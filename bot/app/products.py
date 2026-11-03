from io import BytesIO
from uuid import NAMESPACE_URL, uuid5

import httpx
from aiogram import Bot
from aiogram.types import Message

from app.config import Settings

MAX_PHOTO_SIZE = 5 * 1024 * 1024


class PhotoBuffer(BytesIO):
    def write(self, data: bytes) -> int:
        if self.tell() + len(data) > MAX_PHOTO_SIZE:
            raise ValueError("Максимальный размер фотографии — 5 МБ.")
        return super().write(data)


async def publish_product(
    bot: Bot, message: Message, settings: Settings, name: str
) -> dict:
    photo = message.photo[-1]
    if photo.file_size and photo.file_size > MAX_PHOTO_SIZE:
        raise ValueError("Максимальный размер фотографии — 5 МБ.")
    product_id = uuid5(
        NAMESPACE_URL, f"telegram:{bot.id}:{message.chat.id}:{message.message_id}"
    )
    with PhotoBuffer() as buffer:
        await bot.download(photo, destination=buffer)
        data = buffer.getvalue()
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.put(
            f"{settings.api_url}/v1/admin/products/{product_id}",
            params={"name": name},
            headers={
                "X-Admin-Key": settings.admin_api_key,
                "Content-Type": "image/jpeg",
            },
            content=data,
        )
        if response.status_code in {413, 415, 422}:
            raise ValueError(
                "Не удалось принять фотографию или название. Отправьте JPEG до 5 МБ с названием в подписи."
            )
        response.raise_for_status()
        return response.json()
