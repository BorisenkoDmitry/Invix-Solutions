import logging

from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from app.config import settings
from app.infrastructure.database import session_factory
from app.infrastructure.storage import storage

router = APIRouter(prefix="/health", tags=["health"])
logger = logging.getLogger(__name__)


@router.get("/live")
def liveness():
    return {"status": "ok"}


@router.get("/ready")
def readiness():
    try:
        with session_factory() as session:
            session.execute(text("SELECT 1 FROM products LIMIT 1"))
        available = storage().bucket_exists(settings().minio_bucket)
    except Exception as error:
        logger.exception("Readiness check failed")
        raise HTTPException(503, "Dependencies unavailable") from error
    if not available:
        raise HTTPException(503, "Dependencies unavailable")
    return {"status": "ready"}
