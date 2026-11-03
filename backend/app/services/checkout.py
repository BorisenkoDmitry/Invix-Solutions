import hashlib
import json
from uuid import UUID

from app.domain.checkout import CheckoutRepository, ShopError, order_total


def checkout(repo: CheckoutRepository, token: str, key: UUID, customer: dict) -> dict:
    fingerprint = hashlib.sha256(json.dumps(customer, sort_keys=True).encode()).hexdigest()
    cart_id = repo.lock_cart(token)
    existing = repo.find_order(cart_id, key)
    if existing:
        if existing["fingerprint"] != fingerprint:
            raise ShopError("Ключ запроса уже использован с другими данными")
        return existing
    lines = repo.checkout_lines(cart_id)
    total = order_total(lines)
    return repo.save_order(cart_id, key, customer, fingerprint, lines, total)
