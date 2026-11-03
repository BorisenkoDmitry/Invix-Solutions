from dataclasses import dataclass
from typing import Any, Protocol
from uuid import UUID

from app.domain.errors import ShopError


@dataclass(frozen=True)
class CheckoutLine:
    product_id: UUID
    name: str
    price: int
    quantity: int
    stock: int


class CheckoutRepository(Protocol):
    def lock_cart(self, token: str) -> UUID: ...
    def find_order(self, cart_id: UUID, key: UUID) -> dict[str, Any] | None: ...
    def checkout_lines(self, cart_id: UUID) -> list[CheckoutLine]: ...
    def save_order(
        self,
        cart_id: UUID,
        key: UUID,
        customer: dict,
        fingerprint: str,
        lines: list[CheckoutLine],
        total: int,
    ) -> dict: ...


def order_total(lines: list[CheckoutLine]) -> int:
    if not lines:
        raise ShopError("Корзина пуста")
    for line in lines:
        if line.quantity > line.stock:
            raise ShopError(f"Недостаточно товара: {line.name}")
    return sum(line.price * line.quantity for line in lines)
