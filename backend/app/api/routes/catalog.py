from uuid import UUID

from fastapi import APIRouter

from app.api.dependencies import Shop
from app.api.schemas import ProductResponse

router = APIRouter(prefix="/v1/products", tags=["catalog"])


@router.get("", response_model=list[ProductResponse])
def list_products(shop: Shop):
    return shop.products()


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: UUID, shop: Shop):
    return shop.product(product_id)
