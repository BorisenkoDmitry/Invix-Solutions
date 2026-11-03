import hmac

from aiogram.methods import SendMessage
from aiogram.types import Update
from fastapi import APIRouter, HTTPException, Request

from app.inbox import claim_update

router = APIRouter()


@router.get("/health/live")
async def health(request: Request):
    return {"status": "ok", "telegram_configured": request.app.state.bot is not None}


@router.post("/telegram/webhook")
async def webhook(request: Request):
    state = request.app.state
    secret = state.settings.bot_webhook_secret
    if not secret or not hmac.compare_digest(
        request.headers.get("X-Telegram-Bot-Api-Secret-Token", ""), secret
    ):
        raise HTTPException(403)
    if state.bot is None:
        raise HTTPException(503, "BOT_TOKEN is not configured")
    try:
        update = Update.model_validate(await request.json(), context={"bot": state.bot})
    except ValueError as error:
        raise HTTPException(422, "Некорректное обновление Telegram") from error
    async with claim_update(state.pool, update.update_id) as acquired:
        if not acquired:
            return {"ok": True}
        result = await state.dispatcher.feed_update(state.bot, update)
        if isinstance(result, SendMessage):
            return {
                "method": "sendMessage",
                **result.model_dump(mode="json", exclude_none=True, exclude_defaults=True),
            }
    return {"ok": True}
