from fastapi import FastAPI

from app.runtime import lifespan
from app.webhook import router


def create_app() -> FastAPI:
    app = FastAPI(title="Telegram webhook", lifespan=lifespan)
    app.include_router(router)
    return app


app = create_app()
