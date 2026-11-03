from typing import Protocol
from uuid import UUID, uuid4

from app.domain.errors import InvalidImageError

IMAGE_TYPES = {"image/png", "image/jpeg", "image/webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024


class ProductImages(Protocol):
    def product(self, product_id: UUID) -> dict: ...
    def set_image(self, product_id: UUID, key: str) -> dict: ...


class ImageStorage(Protocol):
    def put(self, key: str, data: bytes, content_type: str) -> None: ...


def validate_image(data: bytes, content_type: str) -> None:
    valid = (
        content_type == "image/png"
        and data.startswith(b"\x89PNG\r\n\x1a\n")
        or content_type == "image/jpeg"
        and data.startswith(b"\xff\xd8\xff")
        or content_type == "image/webp"
        and data[:4] == b"RIFF"
        and data[8:12] == b"WEBP"
    )
    if not valid:
        raise InvalidImageError("Содержимое не соответствует формату изображения")


class ProductImageService:
    def __init__(self, products: ProductImages, images: ImageStorage):
        self.products = products
        self.images = images

    def replace(self, product_id: UUID, data: bytes, content_type: str) -> dict:
        validate_image(data, content_type)
        self.products.product(product_id)
        key = str(uuid4())
        self.images.put(key, data, content_type)
        return self.products.set_image(product_id, key)
