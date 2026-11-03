from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore")
    bot_token: str = ""
    bot_webhook_secret: str = ""
    bot_webhook_url: str = ""
    shop_url: str = "http://localhost:8088"
    api_url: str = "http://backend:8000"
    database_url: str = "postgresql://shop:shop@postgres:5432/shop"
