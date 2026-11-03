import logging

import httpx
from aiogram import Bot, F, Router
from aiogram.filters import Command
from aiogram.methods import SendMessage
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
    WebAppInfo,
)

from app.config import Settings
from app.products import publish_product

logger = logging.getLogger(__name__)


def is_admin(message: Message, settings: Settings) -> bool:
    return bool(message.from_user and message.from_user.id in settings.admin_ids)


def catalog_keyboard(settings: Settings) -> InlineKeyboardMarkup:
    if settings.mini_app_url.startswith("https://"):
        button = InlineKeyboardButton(
            text="Открыть каталог", web_app=WebAppInfo(url=settings.mini_app_url)
        )
    else:
        button = InlineKeyboardButton(
            text="Открыть каталог в браузере", url=settings.shop_url
        )
    return InlineKeyboardMarkup(inline_keyboard=[[button]])


async def start(message: Message, settings: Settings) -> SendMessage:
    text = "У меня есть товар. Откройте каталог, чтобы посмотреть товары."
    if is_admin(message, settings):
        text += "\n\nДобавление товара: /create_product — Создать товар."
    return SendMessage(
        chat_id=message.chat.id, text=text, reply_markup=catalog_keyboard(settings)
    )


async def create_product(message: Message, settings: Settings) -> SendMessage:
    text = (
        "Отправьте фотографию и название товара в подписи к ней одним сообщением. "
        "Название — до 200 символов, фотография — до 5 МБ. "
        "Товар появится в каталоге без цены и остатка."
        if is_admin(message, settings)
        else "Создавать товары может только администратор."
    )
    return SendMessage(chat_id=message.chat.id, text=text)


async def receive_photo(message: Message, settings: Settings, bot: Bot) -> SendMessage:
    if not is_admin(message, settings):
        return SendMessage(
            chat_id=message.chat.id, text="Создавать товары может только администратор."
        )
    name = (message.caption or "").strip()
    if not name or len(name) > 200 or "\n" in name:
        return SendMessage(
            chat_id=message.chat.id,
            text="Добавьте название до 200 символов в подпись к фотографии.",
        )
    try:
        product = await publish_product(bot, message, settings, name)
    except ValueError as error:
        return SendMessage(chat_id=message.chat.id, text=str(error))
    except httpx.HTTPError:
        logger.exception("Catalog request failed")
        raise
    return SendMessage(
        chat_id=message.chat.id,
        text=f"Товар «{product['name']}» добавлен в каталог.",
        reply_markup=catalog_keyboard(settings),
    )


async def fallback(message: Message, settings: Settings) -> SendMessage:
    if is_admin(message, settings):
        return SendMessage(
            chat_id=message.chat.id,
            text="Для добавления товара отправьте фото с названием в подписи. Команда: /create_product.",
        )
    return await start(message, settings)


def create_router() -> Router:
    router = Router()
    router.message.filter(F.chat.type == "private")
    router.message.register(start, Command("start", "shop", "catalog"))
    router.message.register(create_product, Command("create_product"))
    router.message.register(create_product, F.text.casefold() == "создать товар")
    router.message.register(receive_photo, F.photo)
    router.message.register(fallback)
    return router
