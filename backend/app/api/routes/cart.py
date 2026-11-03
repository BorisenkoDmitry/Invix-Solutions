from uuid import UUID

from fastapi import APIRouter

from app.api.dependencies import CartToken, Shop
from app.api.schemas import CartResponse, QuantityRequest

router = APIRouter(prefix="/v1/cart", tags=["cart"])


@router.get("", response_model=CartResponse)
def get_cart(token: CartToken, shop: Shop):
    return shop.cart(token)


@router.put("/items/{product_id}", response_model=CartResponse)
def set_quantity(product_id: UUID, body: QuantityRequest, token: CartToken, shop: Shop):
    return shop.set_quantity(token, product_id, body.quantity)
