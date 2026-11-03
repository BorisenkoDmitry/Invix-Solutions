"""Run against disposable PostgreSQL: TEST_DATABASE_URL=postgresql+psycopg://...
Uses isolated rows and never truncates shared tables.
"""

import base64
import os
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, delete, select
from sqlalchemy.orm import sessionmaker

import app.main as http_app
from app.config import settings
from app.domain.checkout import ShopError
from app.infrastructure.database import get_session
from app.infrastructure.models import Cart, CartItem, Order, Product
from app.infrastructure.repositories import ShopRepository
from app.infrastructure.storage import storage
from app.services.checkout import checkout

pytestmark = pytest.mark.skipif(not os.getenv("TEST_DATABASE_URL"), reason="TEST_DATABASE_URL not configured")


@pytest.fixture
def database():
    engine = create_engine(os.environ["TEST_DATABASE_URL"], pool_pre_ping=True)
    factory = sessionmaker(engine, expire_on_commit=False)
    product_id = uuid4()
    tokens = [uuid4().hex + uuid4().hex for _ in range(2)]
    carts = []
    with factory.begin() as db:
        db.add(Product(id=product_id, name="Test", description="Test", category="Test", price=12345, stock=1))
        db.flush()
        for token in tokens:
            repo = ShopRepository(db)
            cart_id = repo.lock_cart(token)
            carts.append(cart_id)
            repo.set_quantity(cart_id, product_id, 1)
    yield factory, product_id, tokens
    with factory.begin() as db:
        db.execute(delete(Order).where(Order.cart_id.in_(carts)))
        db.execute(delete(CartItem).where(CartItem.cart_id.in_(carts)))
        db.execute(delete(Cart).where(Cart.id.in_(carts)))
        db.execute(delete(Product).where(Product.id == product_id))
    engine.dispose()


CUSTOMER = {"name": "Test", "phone": "+79990000000", "address": "Test address"}


def test_order_history_is_private_sorted_and_paginated(database):
    factory, product_id, tokens = database

    def test_session():
        with factory.begin() as session:
            yield session

    http_app.app.dependency_overrides[get_session] = test_session
    try:
        with TestClient(http_app.app) as client:
            assert client.get("/v1/orders").status_code == 422
            other_headers = {"X-Cart-Token": tokens[1]}
            assert client.get("/v1/orders", headers=other_headers).json() == {"items": [], "has_more": False}
            own_ids = [uuid4(), uuid4(), uuid4()]
            other_id = uuid4()
            with factory.begin() as session:
                repository = ShopRepository(session)
                own_cart = repository.lock_cart(tokens[0])
                other_cart = repository.lock_cart(tokens[1])
                for index, order_id in enumerate([*own_ids, other_id]):
                    session.add(
                        Order(
                            id=order_id,
                            cart_id=own_cart if index < 3 else other_cart,
                            idempotency_key=uuid4(),
                            fingerprint="private-fingerprint",
                            customer=CUSTOMER,
                            items=[
                                {"product_id": str(product_id), "name": "Test", "price": 12345, "quantity": 1}
                            ],
                            total=12345,
                            created_at=datetime(2026, 1, 1 + min(index, 1), tzinfo=UTC),
                        )
                    )
            expected_ids = [str(order_id) for order_id in sorted(own_ids[1:], reverse=True)] + [
                str(own_ids[0])
            ]
            headers = {"X-Cart-Token": tokens[0]}
            first = client.get("/v1/orders?limit=2", headers=headers)
            assert first.status_code == 200
            assert [order["id"] for order in first.json()["items"]] == expected_ids[:2]
            assert first.json()["has_more"] is True
            assert all(
                "customer" not in order and "fingerprint" not in order for order in first.json()["items"]
            )
            second = client.get("/v1/orders?limit=2&offset=2", headers=headers).json()
            assert [order["id"] for order in second["items"]] == expected_ids[2:]
            assert second["has_more"] is False
            other = client.get("/v1/orders", headers=other_headers).json()
            assert [order["id"] for order in other["items"]] == [str(other_id)]
            assert client.get("/v1/orders?limit=0", headers=headers).status_code == 422
            assert client.get("/v1/orders?offset=-1", headers=headers).status_code == 422
    finally:
        http_app.app.dependency_overrides.pop(get_session, None)


def test_two_buyers_cannot_buy_last_item(database):
    factory, product_id, tokens = database

    def buy(token):
        try:
            with factory.begin() as db:
                return checkout(ShopRepository(db), token, uuid4(), CUSTOMER)
        except ShopError:
            return None

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(buy, tokens))
    assert sum(r is not None for r in results) == 1
    with factory() as db:
        assert db.get(Product, product_id).stock == 0
        assert (
            len(
                db.scalars(
                    select(Order).where(
                        Order.items[0]["product_id"].astext == str(product_id),
                    )
                ).all()
            )
            == 1
        )


def test_concurrent_retries_create_one_order(database):
    factory, product_id, tokens = database
    key = uuid4()

    def buy(_):
        with factory.begin() as db:
            return checkout(ShopRepository(db), tokens[0], key, CUSTOMER)

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(buy, range(2)))
    assert results[0]["id"] == results[1]["id"]
    with factory() as db:
        assert db.get(Product, product_id).stock == 0


def test_failed_checkout_rolls_back_all_stock(database):
    factory, product_id, tokens = database
    second_id = uuid4()
    with factory.begin() as db:
        db.add(Product(id=second_id, name="Second", description="Test", category="Test", price=100, stock=1))
        db.flush()
        repo = ShopRepository(db)
        repo.set_quantity(repo.lock_cart(tokens[0]), second_id, 1)
    with factory.begin() as db:
        db.get(Product, product_id).stock = 0
    with pytest.raises(ShopError), factory.begin() as db:
        checkout(ShopRepository(db), tokens[0], uuid4(), CUSTOMER)
    with factory.begin() as db:
        assert db.get(Product, second_id).stock == 1
        cart_id = ShopRepository(db).lock_cart(tokens[0])
        assert len(ShopRepository(db).cart(cart_id)["items"]) == 2
        db.execute(delete(CartItem).where(CartItem.product_id == second_id))
        db.execute(delete(Product).where(Product.id == second_id))


@pytest.mark.skipif(not os.getenv("TEST_MINIO"), reason="TEST_MINIO not configured")
def test_admin_image_roundtrip_without_disk(database):
    factory, product_id, _ = database

    def test_session():
        with factory.begin() as session:
            yield session

    http_app.app.dependency_overrides[get_session] = test_session
    data = base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN2kAAAAASUVORK5CYII="
    )
    key = None
    try:
        with TestClient(http_app.app) as client:
            path = f"/v1/admin/products/{product_id}/image"
            assert client.post(path, content=data, headers={"Content-Type": "image/png"}).status_code == 403
            headers = {"Content-Type": "image/png", "X-Admin-Key": settings().admin_api_key}
            assert client.post(path, content=b"invalid", headers=headers).status_code == 415
            response = client.post(path, content=data, headers=headers)
            assert response.status_code == 200
            key = response.json()["image_url"].rsplit("/", 1)[1]
            downloaded = client.get(f"/v1/media/{key}")
            assert downloaded.status_code == 200
            assert downloaded.content == data
            assert downloaded.headers["content-type"] == "image/png"
    finally:
        http_app.app.dependency_overrides.pop(get_session, None)
        if key:
            storage().remove_object(settings().minio_bucket, key)


@pytest.mark.skipif(not os.getenv("TEST_MINIO"), reason="TEST_MINIO not configured")
def test_create_catalog_product_is_authorized_durable_and_idempotent(database):
    factory, _, _ = database
    product_id = uuid4()
    data = b"\xff\xd8\xfftest-photo"
    key = None

    def test_session():
        with factory.begin() as session:
            yield session

    http_app.app.dependency_overrides[get_session] = test_session
    try:
        with TestClient(http_app.app) as client:
            path = f"/v1/admin/products/{product_id}"
            headers = {"Content-Type": "image/jpeg", "X-Admin-Key": settings().admin_api_key}
            assert client.put(path, params={"name": "Тест"}, content=data).status_code == 403
            assert client.put(path, params={"name": " "}, content=data, headers=headers).status_code == 422
            assert (
                client.put(path, params={"name": "Тест"}, content=b"bad", headers=headers).status_code == 415
            )
            assert (
                client.put(
                    path, params={"name": "Тест"}, content=b"x" * (5 * 1024 * 1024 + 1), headers=headers
                ).status_code
                == 413
            )

            def create(_):
                return client.put(path, params={"name": "Тест"}, content=data, headers=headers)

            with ThreadPoolExecutor(max_workers=2) as pool:
                responses = list(pool.map(create, range(2)))
            assert [response.status_code for response in responses] == [201, 201]
            assert responses[0].json() == responses[1].json()
            product = responses[0].json()
            key = product["image_url"].rsplit("/", 1)[1]
            assert product["price"] == 0
            assert product["stock"] == 0
            assert client.get(f"/v1/products/{product_id}").json()["name"] == "Тест"
            assert client.get(f"/v1/media/{key}").content == data
            assert (
                client.put(path, params={"name": "Другой"}, content=data, headers=headers).status_code == 409
            )
        with factory() as db:
            assert db.get(Product, product_id).image_key == key
    finally:
        http_app.app.dependency_overrides.pop(get_session, None)
        with factory.begin() as db:
            db.execute(delete(Product).where(Product.id == product_id))
        if key:
            storage().remove_object(settings().minio_bucket, key)
