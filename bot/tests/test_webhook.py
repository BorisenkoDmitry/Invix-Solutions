import os
import time

import psycopg
import pytest
from app.runtime import settings
from fastapi.testclient import TestClient

from app.main import app

pytestmark = pytest.mark.skipif(not os.getenv("RUN_DB_TESTS"), reason="RUN_DB_TESTS not configured")


def test_webhook_auth_and_durable_deduplication(monkeypatch):
    monkeypatch.setattr(settings, "bot_token", "123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi")
    monkeypatch.setattr(settings, "bot_webhook_secret", "test-secret")
    update_id = -time.time_ns() // 1000
    payload = {
        "update_id": update_id,
        "message": {
            "message_id": 1,
            "date": 1700000000,
            "chat": {"id": 12345, "type": "private"},
            "from": {"id": 12345, "is_bot": False, "first_name": "Test"},
            "text": "/start",
            "entities": [{"type": "bot_command", "offset": 0, "length": 6}],
        },
    }
    headers = {"X-Telegram-Bot-Api-Secret-Token": "test-secret"}
    try:
        with TestClient(app) as client:
            assert client.post("/telegram/webhook", json=payload).status_code == 403
            assert client.post("/telegram/webhook", headers=headers, json={"invalid": True}).status_code == 422
            first = client.post("/telegram/webhook", headers=headers, json=payload)
            assert first.status_code == 200
            assert first.json()["method"] == "sendMessage"
            assert first.json()["chat_id"] == 12345
        # New app lifespan: no in-process deduplication survives this point.
        with TestClient(app) as client:
            repeat = client.post("/telegram/webhook", headers=headers, json=payload)
            assert repeat.status_code == 200
            assert repeat.json() == {"ok": True}
    finally:
        with psycopg.connect(settings.database_url) as connection:
            connection.execute("DELETE FROM telegram_updates WHERE update_id=%s", (update_id,))
