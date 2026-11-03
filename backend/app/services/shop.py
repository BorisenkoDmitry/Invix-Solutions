from typing import Protocol
from uuid import UUID

from app.domain.checkout import CheckoutRepository
from app.services.checkout import checkout


class ShopRepository(CheckoutRepository, Protocol):
    def products(self) -> list[dict]: ...
    def product(self, product_id: UUID) -> dict: ...
    def cart(self, cart_id: UUID) -> dict: ...
    def set_quantity(self, cart_id: UUID, product_id: UUID, quantity: int) -> dict: ...
    def order(self, cart_id: UUID, order_id: UUID) -> dict: ...
    def orders(self, cart_id: UUID, limit: int, offset: int) -> dict: ...


class ShopService:
    def __init__(self, repository: ShopRepository):
        self.repository = repository

    def products(self) -> list[dict]:
        return self.repository.products()

    def product(self, product_id: UUID) -> dict:
        return self.repository.product(product_id)

    def cart(self, token: str) -> dict:
        cart_id = self.repository.lock_cart(token)
        return self.repository.cart(cart_id)

    def set_quantity(self, token: str, product_id: UUID, quantity: int) -> dict:
        cart_id = self.repository.lock_cart(token)
        return self.repository.set_quantity(cart_id, product_id, quantity)

    def place_order(self, token: str, key: UUID, customer: dict) -> dict:
        return checkout(self.repository, token, key, customer)

    def order(self, token: str, order_id: UUID) -> dict:
        cart_id = self.repository.lock_cart(token)
        return self.repository.order(cart_id, order_id)

    def orders(self, token: str, limit: int, offset: int) -> dict:
        cart_id = self.repository.lock_cart(token)
        return self.repository.orders(cart_id, limit, offset)
