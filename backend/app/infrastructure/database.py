from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings

engine = create_engine(settings().database_url, pool_pre_ping=True, pool_size=5, max_overflow=5)
session_factory = sessionmaker(engine, expire_on_commit=False)


def get_session() -> Generator[Session, None, None]:
    with session_factory.begin() as session:
        yield session
