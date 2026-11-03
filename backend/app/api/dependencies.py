import hmac
from typing import Annotated

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.infrastructure.database import get_session
from app.infrastructure.repositories import ShopRepository
from app.services.shop import ShopService

DatabaseSession = Annotated[Session, Depends(get_session, scope="function")]
CartToken = Annotated[
    str, Header(alias="X-Cart-Token", min_length=32, max_length=128, pattern=r"^[a-zA-Z0-9_-]+$")
]


def get_shop(session: DatabaseSession) -> ShopService:
    return ShopService(ShopRepository(session))


Shop = Annotated[ShopService, Depends(get_shop)]


def require_admin(x_admin_key: Annotated[str, Header()] = "") -> None:
    expected = settings().admin_api_key
    if not expected or not hmac.compare_digest(x_admin_key, expected):
        raise HTTPException(403, "Доступ запрещён")
