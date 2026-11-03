import hashlib
from typing import Protocol
from uuid import UUID

from app.domain.checkout import ShopError
from app.services.media import ImageStorage, validate_image


class CatalogProducts(Protocol):
    def lock_product(self, product_id: UUID) -> None: ...
    def find_product(self, product_id: UUID) -> dict | None: ...
    def create_product(self, product_id: UUID, name: str, image_key: str) -> dict: ...


class CatalogService:
    def __init__(self, products: CatalogProducts, images: ImageStorage):
        self.products = products
        self.images = images

    def create(self, product_id: UUID, name: str, data: bytes, content_type: str) -> dict:
        validate_image(data, content_type)
        key = f"{product_id}-{hashlib.sha256(data).hexdigest()}"
        self.products.lock_product(product_id)
        existing = self.products.find_product(product_id)
        if existing:
            if existing["name"] != name or existing["image_url"] != f"/api/media/{key}":
                raise ShopError("Этот идентификатор уже использован для другого товара")
            return existing
        self.images.put(key, data, content_type)
        return self.products.create_product(product_id, name, key)
