import asyncio

from aiogram import Bot

from app.config import Settings


async def main():
    settings = Settings()
    if (
        not settings.bot_token
        or not settings.bot_webhook_url.startswith("https://")
        or not settings.bot_webhook_secret
    ):
        raise SystemExit("Set BOT_TOKEN, BOT_WEBHOOK_URL (HTTPS), BOT_WEBHOOK_SECRET")
    async with Bot(settings.bot_token) as bot:
        await bot.set_webhook(
            settings.bot_webhook_url,
            secret_token=settings.bot_webhook_secret,
            allowed_updates=["message"],
            drop_pending_updates=False,
        )
        print("Webhook registered")


if __name__ == "__main__":
    asyncio.run(main())
