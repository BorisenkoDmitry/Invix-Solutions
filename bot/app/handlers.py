from aiogram import Router
from aiogram.filters import Command
from aiogram.methods import SendMessage
from aiogram.types import Message

from app.catalog import load_products
from app.config import Settings


async def start(message: Message, settings: Settings) -> SendMessage:
    return SendMessage(
        chat_id=message.chat.id,
        text=f"Каталог: /catalog\nОткрыть магазин: {settings.shop_url}\nОплата не требуется.",
    )


async def catalog(message: Message, settings: Settings) -> SendMessage:
    products = await load_products(settings.api_url)
    lines = [
        f"{product['name']} — {product['price'] / 100:.2f} ₽ · в наличии {product['stock']}"
        for product in products
    ]
    return SendMessage(chat_id=message.chat.id, text="\n".join(lines) + f"\n\nЗаказать: {settings.shop_url}")


def create_router() -> Router:
    router = Router()
    router.message.register(start, Command("start", "shop"))
    router.message.register(catalog, Command("catalog"))
    return router
