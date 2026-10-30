from typing import Optional
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings
from app.core.database import get_supabase_client
import jwt
import logging

logger = logging.getLogger(__name__)

security_scheme = HTTPBearer(auto_error=False)


class AuthenticatedUser:
    def __init__(self, id: str, email: Optional[str] = None, metadata: Optional[dict] = None, token: Optional[str] = None):
        self.id = id
        self.email = email
        self.metadata = metadata or {}
        self.username = self.metadata.get("username")
        self.role = self.metadata.get("role", "student")
        self.token = token


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> AuthenticatedUser:
    """
    Validates Bearer token:
    1. First checks backend-issued JWT token (instant, secure, username-native).
    2. Falls back to Supabase Auth token validation for backwards compatibility.
    Guarantees user identity cannot be spoofed by browser client.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # 1. Check backend-signed JWT token
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id = payload.get("sub")
        if user_id:
            username = payload.get("username")
            role = payload.get("role", "student")
            metadata = {
                "username": username,
                "role": role,
                "full_name": payload.get("full_name") or username,
            }
            return AuthenticatedUser(
                id=user_id,
                email=None,
                metadata=metadata,
                token=token,
            )
    except jwt.PyJWTError:
        pass  # Fall through to Supabase token validation

    # 2. Check Supabase Auth token
    try:
        supabase = get_supabase_client()
        res = supabase.auth.get_user(token)
        if res and res.user:
            user_data = res.user
            metadata = getattr(user_data, 'user_metadata', {}) or {}
            username = metadata.get("username")
            return AuthenticatedUser(
                id=user_data.id,
                email=user_data.email,
                metadata=metadata,
                token=token,
            )
    except Exception as e:
        logger.debug(f"Supabase auth verification note: {e}")

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication session. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> Optional[AuthenticatedUser]:
    """
    Allows public or authenticated access, returning user if valid token present.
    """
    if not credentials or not credentials.credentials:
        return None
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
