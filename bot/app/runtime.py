from contextlib import asynccontextmanager

from aiogram import Bot, Dispatcher
from fastapi import FastAPI
from psycopg_pool import AsyncConnectionPool

from app.config import Settings
from app.handlers import create_router
from app.storage import NoStateStorage

settings = Settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.admin_ids
    pool = AsyncConnectionPool(settings.database_url, min_size=1, max_size=5, open=False)
    await pool.open(wait=True)
    bot = Bot(settings.bot_token) if settings.bot_token else None
    dispatcher = Dispatcher(storage=NoStateStorage(), disable_fsm=True, settings=settings)
    dispatcher.include_router(create_router())
    app.state.settings = settings
    app.state.pool = pool
    app.state.bot = bot
    app.state.dispatcher = dispatcher
    try:
        yield
    finally:
        if bot:
            await bot.session.close()
        await pool.close()
