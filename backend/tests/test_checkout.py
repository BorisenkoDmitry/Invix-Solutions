from uuid import uuid4

import pytest

from app.domain.checkout import CheckoutLine, ShopError, order_total
from app.services.checkout import checkout


def test_money_uses_integer_kopecks():
    assert order_total([CheckoutLine(uuid4(), "A", 19999, 3, 5)]) == 59997


def test_empty_and_out_of_stock_rejected():
    with pytest.raises(ShopError, match="пуста"):
        order_total([])
    with pytest.raises(ShopError, match="Недостаточно"):
        order_total([CheckoutLine(uuid4(), "A", 100, 2, 1)])


def test_retry_returns_order_without_rechecking_empty_cart():
    class Repo:
        def lock_cart(self, token):
            return uuid4()

        def find_order(self, cart_id, key):
            return self.order

        def checkout_lines(self, cart_id):
            return [CheckoutLine(uuid4(), "A", 100, 1, 1)]

        def save_order(self, cart_id, key, customer, fingerprint, lines, total):
            self.order = {"id": str(uuid4()), "fingerprint": fingerprint, "total": total}
            return self.order

    repo = Repo()
    repo.order = None
    key = uuid4()
    first = checkout(repo, "token", key, {"name": "Test"})
    repo.checkout_lines = lambda _: pytest.fail("Retry must not touch stock")
    assert checkout(repo, "token", key, {"name": "Test"}) == first
    with pytest.raises(ShopError, match="другими данными"):
        checkout(repo, "token", key, {"name": "Changed"})
