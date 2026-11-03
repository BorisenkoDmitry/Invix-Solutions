from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Header, Query

from app.api.dependencies import CartToken, Shop
from app.api.schemas import CustomerRequest, OrderHistoryResponse, OrderResponse

router = APIRouter(prefix="/v1/orders", tags=["orders"])


@router.get("", response_model=OrderHistoryResponse)
def list_orders(
    token: CartToken,
    shop: Shop,
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    return shop.orders(token, limit, offset)


@router.post("", status_code=201, response_model=OrderResponse)
def create_order(
    body: CustomerRequest, token: CartToken, shop: Shop, idempotency_key: Annotated[UUID, Header()]
):
    return shop.place_order(token, idempotency_key, body.model_dump())


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: UUID, token: CartToken, shop: Shop):
    return shop.order(token, order_id)
