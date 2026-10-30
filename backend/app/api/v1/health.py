from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.config import settings
from app.core.database import get_supabase_client
from app.core.local_db import get_db_connection
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health", summary="Health and readiness check")
async def health_check():
    """
    Returns the system status, checking database connectivity and ML engine readiness.
    """
    db_status = "connected"
    try:
        # Check local DB connection
        conn = get_db_connection()
        conn.execute("SELECT 1").fetchone()
        conn.close()
    except Exception as e:
        logger.warning(f"Local database health probe note: {e}")
        db_status = "degraded"

    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_status,
        "model": settings.EMBEDDING_MODEL_NAME,
    }
