from fastapi import FastAPI

from app.api.errors import register_error_handlers
from app.api.routes import cart, catalog, health, media, orders


def create_app() -> FastAPI:
    app = FastAPI(title="Shop API", version="1.0.0")
    register_error_handlers(app)
    for router in (health.router, catalog.router, cart.router, orders.router, media.router):
        app.include_router(router)
    return app


app = create_app()
