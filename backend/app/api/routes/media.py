from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from starlette.concurrency import run_in_threadpool

from app.api.dependencies import DatabaseSession, require_admin
from app.api.schemas import ProductResponse
from app.infrastructure.repositories import ShopRepository
from app.infrastructure.storage import ImageStorage
from app.services.catalog import CatalogService
from app.services.media import IMAGE_TYPES, MAX_IMAGE_SIZE, ProductImageService

router = APIRouter(prefix="/v1", tags=["media"])


async def read_image(request: Request) -> tuple[bytes, str]:
    content_type = request.headers.get("content-type", "")
    if content_type not in IMAGE_TYPES:
        raise HTTPException(415, "Нужен PNG, JPEG или WebP")
    data = bytearray()
    async for chunk in request.stream():
        data.extend(chunk)
        if len(data) > MAX_IMAGE_SIZE:
            raise HTTPException(413, "Максимальный размер — 5 МБ")
    return bytes(data), content_type


@router.put(
    "/admin/products/{product_id}",
    response_model=ProductResponse,
    dependencies=[Depends(require_admin)],
    status_code=201,
)
async def create_product(
    product_id: UUID,
    request: Request,
    session: DatabaseSession,
    name: str = Query(min_length=1, max_length=200, pattern=r".*\S.*"),
):
    data, content_type = await read_image(request)
    service = CatalogService(ShopRepository(session), ImageStorage())
    return await run_in_threadpool(service.create, product_id, name.strip(), data, content_type)


@router.get("/media/{key}")
def get_image(key: str):
    if len(key) > 200 or "/" in key or ".." in key:
        raise HTTPException(404)
    image = ImageStorage().open(key)

    def chunks():
        try:
            yield from image.stream(64 * 1024)
        finally:
            image.close()
            image.release_conn()

    return StreamingResponse(
        chunks(),
        media_type=image.headers.get("Content-Type", "image/png"),
        headers={"Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff"},
    )


@router.post(
    "/admin/products/{product_id}/image",
    response_model=ProductResponse,
    dependencies=[Depends(require_admin)],
)
async def upload_image(product_id: UUID, request: Request, session: DatabaseSession):
    data, content_type = await read_image(request)
    service = ProductImageService(ShopRepository(session), ImageStorage())
    return await run_in_threadpool(service.replace, product_id, bytes(data), content_type)
