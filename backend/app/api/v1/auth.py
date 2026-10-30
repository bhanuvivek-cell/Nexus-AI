import re
import uuid
import hashlib
import secrets
import hmac
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
import jwt
from app.core.config import settings
from app.core.local_db import (
    get_user_by_username,
    create_user_account,
    get_user_by_id,
    get_user_profile,
    upsert_user_profile,
)
from app.core.security import get_current_user, AuthenticatedUser
from app.core.database import get_supabase_client
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Username format: 3-30 chars, alphanumeric, underscores, hyphens only
USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9_-]{3,30}$")
RESERVED_USERNAMES = {"admin", "administrator", "root", "system", "api", "guest", "null", "undefined"}


def normalize_and_validate_username(raw: str) -> str:
    cleaned = raw.strip().lower()
    if not USERNAME_REGEX.match(cleaned):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Username must be 3-30 characters long and can only contain letters, numbers, underscores, and hyphens."
        )
    if cleaned in RESERVED_USERNAMES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Username '{cleaned}' is reserved. Please choose a different username."
        )
    return cleaned


def hash_password(password: str) -> str:
    """NIST/OWASP approved PBKDF2-HMAC-SHA256 password hasher with 100,000 iterations and 16-byte random salt."""
    salt = secrets.token_hex(16)
    pw_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100_000
    )
    return f"{salt}:{pw_hash.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Constant-time password verification preventing timing attacks."""
    try:
        salt, expected_hex = stored_hash.split(":")
        actual_hash = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            100_000
        )
        return hmac.compare_digest(actual_hash.hex(), expected_hex)
    except Exception:
        return False


def create_access_token(user_id: str, username: str, role: str = "student", full_name: Optional[str] = None) -> str:
    """Issues a cryptographically signed JWT token for the authenticated username."""
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.JWT_EXPIRES_DAYS)
    payload = {
        "sub": user_id,
        "username": username,
        "role": role,
        "full_name": full_name or username,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


# Request / Response Schemas
class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    password: str = Field(..., min_length=6)
    confirm_password: Optional[str] = None
    full_name: Optional[str] = Field(None, max_length=100)


class LoginRequest(BaseModel):
    username: str
    password: str


class UserInfoSchema(BaseModel):
    id: str
    username: str
    full_name: Optional[str] = None
    role: str = "student"


class SessionInfoSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserInfoSchema


class AuthResponseSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserInfoSchema
    session: SessionInfoSchema


@router.post("/register", response_model=AuthResponseSchema, summary="Register using username and password only")
async def register(req: RegisterRequest):
    """
    Registers a student using only username and password.
    - Zero email requirement.
    - Zero confirmation emails.
    - Cryptographically hashes password via PBKDF2-HMAC-SHA256.
    - Enforces unique usernames at the database level.
    """
    username = normalize_and_validate_username(req.username)

    if req.confirm_password and req.password != req.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Passwords do not match. Please verify your password."
        )

    if len(req.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be at least 6 characters long."
        )

    # Check uniqueness
    existing = get_user_by_username(username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"The username '{username}' is already taken. Please choose another."
        )

    # Create account
    user_id = str(uuid.uuid4())
    display_name = (req.full_name or "").strip() or username
    pw_hash = hash_password(req.password)

    user_record = create_user_account(
        user_id=user_id,
        username=username,
        password_hash=pw_hash,
        full_name=display_name,
        role="student"
    )

    # Optional background sync with Supabase if service role key is present
    if settings.SUPABASE_SERVICE_ROLE_KEY:
        try:
            from supabase import create_client
            admin = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
            admin.auth.admin.create_user({
                "id": user_id,
                "email": f"{username}@nexus.internal",
                "password": req.password,
                "email_confirm": True,
                "user_metadata": {"username": username, "full_name": display_name, "role": "student"}
            })
            admin.table("profiles").upsert({
                "id": user_id,
                "username": username,
                "display_name": display_name
            }).execute()
        except Exception as e:
            logger.debug(f"Supabase background registration sync note: {e}")

    token = create_access_token(user_id=user_id, username=username, role="student", full_name=display_name)
    user_info = UserInfoSchema(id=user_id, username=username, full_name=display_name, role="student")
    session_info = SessionInfoSchema(access_token=token, token_type="bearer", user=user_info)

    logger.info(f"Student account registered successfully: '{username}' ({user_id})")
    return AuthResponseSchema(access_token=token, token_type="bearer", user=user_info, session=session_info)


@router.post("/login", response_model=AuthResponseSchema, summary="Log in with username and password only")
async def login(req: LoginRequest):
    """
    Authenticates a student using username and password only.
    Returns signed session token on success.
    Displays clear, friendly error messages on failure.
    """
    username = normalize_and_validate_username(req.username)
    user = get_user_by_username(username)

    if not user:
        # Check if user exists on Supabase with internal email mapping
        if settings.SUPABASE_ANON_KEY and settings.SUPABASE_URL:
            try:
                from supabase import create_client
                anon = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
                auth_res = anon.auth.sign_in_with_password({
                    "email": f"{username}@nexus.internal",
                    "password": req.password
                })
                if auth_res.user and auth_res.session:
                    # Sync into local user_accounts
                    display_name = auth_res.user.user_metadata.get("full_name") or username
                    pw_hash = hash_password(req.password)
                    user = create_user_account(
                        user_id=auth_res.user.id,
                        username=username,
                        password_hash=pw_hash,
                        full_name=display_name,
                        role="student"
                    )
            except Exception:
                pass

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password. Please verify your credentials."
        )

    # Verify password hash
    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password. Please verify your credentials."
        )

    user_id = user["id"]
    display_name = user.get("full_name") or username
    role = user.get("role") or "student"

    token = create_access_token(user_id=user_id, username=username, role=role, full_name=display_name)
    user_info = UserInfoSchema(id=user_id, username=username, full_name=display_name, role=role)
    session_info = SessionInfoSchema(access_token=token, token_type="bearer", user=user_info)

    logger.info(f"Student '{username}' logged in successfully.")
    return AuthResponseSchema(access_token=token, token_type="bearer", user=user_info, session=session_info)


@router.get("/me", response_model=UserInfoSchema, summary="Get current authenticated student identity")
async def get_me(user: AuthenticatedUser = Depends(get_current_user)):
    """Returns verified student identity from server-side token without exposing internal emails."""
    username = user.username or "student"
    full_name = user.metadata.get("full_name") or username
    return UserInfoSchema(
        id=user.id,
        username=username,
        full_name=full_name,
        role=user.role
    )


@router.post("/logout", summary="Terminate session")
async def logout(user: AuthenticatedUser = Depends(get_current_user)):
    return {"message": "Logged out successfully."}
