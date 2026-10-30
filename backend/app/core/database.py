import jwt
from typing import Optional
from supabase import create_client, Client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

_supabase_client: Optional[Client] = None


def is_supabase_token(token: str) -> bool:
    """Checks whether the token was issued by Supabase Gotrue rather than Nexus backend."""
    try:
        unverified = jwt.decode(token, options={"verify_signature": False})
        iss = str(unverified.get("iss", ""))
        return "supabase" in iss or iss.startswith("https://") or "ref" in unverified
    except Exception:
        return False


def get_supabase_client(token: Optional[str] = None) -> Client:
    """
    Returns an initialized Supabase client:
    - If SUPABASE_SERVICE_ROLE_KEY is set, uses service role (bypasses RLS).
    - If token is provided and was issued by Supabase Gotrue, returns client authenticated with caller's JWT for RLS.
    - Otherwise returns the standard anon client singleton for catalog reading.
    """
    if settings.SUPABASE_SERVICE_ROLE_KEY:
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    if token and is_supabase_token(token):
        try:
            return get_authenticated_supabase_client(token)
        except Exception as e:
            logger.warning(f"Failed to create authenticated Supabase client: {e}")

    global _supabase_client
    if _supabase_client is None:
        key = settings.SUPABASE_ANON_KEY
        if not key or not settings.SUPABASE_URL:
            logger.warning("Supabase credentials not fully provided in settings.")
        _supabase_client = create_client(settings.SUPABASE_URL, key)
    return _supabase_client


def get_authenticated_supabase_client(token: str) -> Client:
    """
    Creates a scoped Supabase client with the caller's JWT token for RLS enforcement.
    """
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    # Inject user JWT authorization header
    client.postgrest.auth(token)
    return client
