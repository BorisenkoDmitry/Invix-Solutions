import io

from minio import Minio
from minio.error import S3Error

from app.config import settings
from app.domain.errors import NotFoundError, StorageUnavailableError


def storage() -> Minio:
    config = settings()
    return Minio(
        config.minio_endpoint,
        access_key=config.minio_access_key,
        secret_key=config.minio_secret_key,
        secure=config.minio_secure,
    )


class ImageStorage:
    def __init__(self):
        self.client = storage()
        self.bucket = settings().minio_bucket

    def put(self, key: str, data: bytes, content_type: str) -> None:
        try:
            self.client.put_object(self.bucket, key, io.BytesIO(data), len(data), content_type=content_type)
        except S3Error as error:
            raise StorageUnavailableError("Хранилище недоступно") from error

    def open(self, key: str):
        try:
            return self.client.get_object(self.bucket, key)
        except S3Error as error:
            if error.code in {"NoSuchKey", "NoSuchObject"}:
                raise NotFoundError("Изображение не найдено") from error
            raise StorageUnavailableError("Хранилище недоступно") from error
