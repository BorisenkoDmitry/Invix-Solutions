import asyncio
from datetime import UTC, datetime
from unittest.mock import AsyncMock

import httpx
import pytest
from aiogram import Bot
from aiogram.types import Message
from app.config import Settings
from app.handlers import catalog_keyboard, create_product, receive_photo, start
from app.products import MAX_PHOTO_SIZE, PhotoBuffer, publish_product


def message(user=42, **values):
    return Message.model_validate(
        {
            "message_id": 12,
            "date": datetime.now(UTC),
            "chat": {"id": 42, "type": "private"},
            "from": {"id": user, "is_bot": False, "first_name": "Test"},
            **values,
        }
    )


def test_start_and_mini_app_button():
    settings = Settings(
        bot_admin_ids="42, 73", mini_app_url="https://shop.example/catalog"
    )
    response = asyncio.run(start(message(), settings))
    assert response.text.startswith("У меня есть товар")
    assert "/create_product" in response.text
    assert (
        response.reply_markup.inline_keyboard[0][0].web_app.url == settings.mini_app_url
    )
    browser_button = catalog_keyboard(Settings()).inline_keyboard[0][0]
    assert browser_button.web_app is None
    assert browser_button.url == "http://localhost:8088"


def test_empty_admin_ids_deny_product_creation():
    response = asyncio.run(create_product(message(), Settings()))
    assert "только администратор" in response.text


def test_photo_validation_and_authorization(monkeypatch):
    publish = AsyncMock()
    monkeypatch.setattr("app.handlers.publish_product", publish)
    settings = Settings(bot_admin_ids="42")
    photo = [
        {"file_id": "photo", "file_unique_id": "unique", "width": 10, "height": 10}
    ]

    async def scenario():
        async with Bot("123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi") as bot:
            denied = await receive_photo(
                message(user=99, photo=photo, caption="Test"), settings, bot
            )
            assert "только администратор" in denied.text
            missing = await receive_photo(message(photo=photo), settings, bot)
            assert "подпись" in missing.text
            publish.assert_not_awaited()
            publish.return_value = {"name": "Чашка"}
            result = await receive_photo(
                message(photo=photo, caption="Чашка"), settings, bot
            )
            assert "Чашка" in result.text
            publish.assert_awaited_once()

    asyncio.run(scenario())


def test_photo_download_stays_in_memory_and_retries_use_same_product_id(monkeypatch):
    requests = []

    def respond(request):
        requests.append(request)
        assert request.headers["X-Admin-Key"] == "internal-key"
        assert request.content == b"\xff\xd8\xfftest"
        assert request.url.params["name"] == "Чашка"
        return httpx.Response(201, json={"name": "Чашка"})

    original_client = httpx.AsyncClient
    monkeypatch.setattr(
        "app.products.httpx.AsyncClient",
        lambda **kw: original_client(transport=httpx.MockTransport(respond), **kw),
    )

    async def download(photo, destination):
        destination.write(b"\xff\xd8\xfftest")
        destination.seek(0)

    async def scenario():
        async with Bot("123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi") as bot:
            monkeypatch.setattr(bot, "download", download)
            photo = [
                {
                    "file_id": "photo",
                    "file_unique_id": "unique",
                    "width": 10,
                    "height": 10,
                }
            ]
            settings = Settings(admin_api_key="internal-key")
            for _ in range(2):
                await publish_product(
                    bot, message(photo=photo, caption="Чашка"), settings, "Чашка"
                )

    asyncio.run(scenario())
    assert requests[0].url == requests[1].url


def test_photo_buffer_enforces_actual_download_size():
    with PhotoBuffer() as buffer:
        buffer.write(b"a" * MAX_PHOTO_SIZE)
        with pytest.raises(ValueError, match="5 МБ"):
            buffer.write(b"x")
