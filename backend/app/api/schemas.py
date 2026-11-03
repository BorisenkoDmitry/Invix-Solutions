from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class QuantityRequest(BaseModel):
    quantity: int = Field(ge=0, le=99, strict=True)


class CustomerRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(min_length=2, max_length=100, pattern=r".*\S.*")
    phone: str = Field(min_length=7, max_length=25, pattern=r"^\+?[0-9 ()-]{7,25}$")
    address: str = Field(min_length=5, max_length=500, pattern=r".*\S.*")

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        if not 7 <= sum(character.isdigit() for character in value) <= 15:
            raise ValueError("Телефон должен содержать от 7 до 15 цифр")
        return value


class ProductResponse(BaseModel):
    id: UUID
    name: str
    description: str
    category: str
    price: int
    stock: int
    image_url: str | None


class CartItemResponse(BaseModel):
    product: ProductResponse
    quantity: int


class CartResponse(BaseModel):
    items: list[CartItemResponse]
    total: int


class OrderItemResponse(BaseModel):
    product_id: UUID
    name: str
    price: int
    quantity: int


class OrderSummaryResponse(BaseModel):
    id: UUID
    items: list[OrderItemResponse]
    total: int
    created_at: datetime


class OrderResponse(OrderSummaryResponse):
    customer: CustomerRequest


class OrderHistoryResponse(BaseModel):
    items: list[OrderSummaryResponse]
    has_more: bool
