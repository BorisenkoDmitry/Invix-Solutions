from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def test_invalid_customer_is_rejected_before_database_access():
    with TestClient(app) as client:
        response = client.post(
            "/v1/orders",
            headers={"X-Cart-Token": "a" * 43, "Idempotency-Key": str(uuid4())},
            json={"name": "   ", "phone": "-------", "address": "     "},
        )
    assert response.status_code == 422
    fields = {error["loc"][-1] for error in response.json()["detail"]}
    assert fields == {"name", "phone", "address"}
