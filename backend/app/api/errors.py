from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.domain.errors import InvalidImageError, NotFoundError, ShopError, StorageUnavailableError


async def handle_shop_error(request: Request, error: ShopError) -> JSONResponse:
    status = 409
    if isinstance(error, NotFoundError):
        status = 404
    elif isinstance(error, InvalidImageError):
        status = 415
    elif isinstance(error, StorageUnavailableError):
        status = 503
    return JSONResponse({"detail": str(error)}, status_code=status)


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(ShopError, handle_shop_error)
