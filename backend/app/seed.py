import io
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.dialects.postgresql import insert

from app.config import settings
from app.infrastructure.database import session_factory
from app.infrastructure.models import Product
from app.infrastructure.storage import storage

# Demo fixtures only; all prices are integer kopecks.
PRODUCTS = [
    (
        "Блокнот",
        "Бумага",
        49000,
        "Блокнот A5 в мягкой обложке. 80 чистых листов для заметок и идей.",
        "#d5dbcc",
        "▤",
    ),
    (
        "Кружка",
        "Для дома",
        89000,
        "Керамическая кружка объёмом 300 мл. Можно мыть в посудомоечной машине.",
        "#dfc6ad",
        "◡",
    ),
    (
        "Шопер",
        "Аксессуары",
        79000,
        "Хлопковая сумка с длинными ручками. Размер 35 × 40 см, плотность 240 г/м².",
        "#e6dccc",
        "▢",
    ),
    (
        "Карандаши",
        "Бумага",
        35000,
        "Набор из шести графитовых карандашей HB в картонной упаковке.",
        "#d9c99e",
        "╱",
    ),
    (
        "Бутылка",
        "Аксессуары",
        129000,
        "Стальная бутылка 500 мл с герметичной крышкой. Для воды и прохладных напитков.",
        "#c0ced1",
        "▥",
    ),
    (
        "Подставка",
        "Для дома",
        59000,
        "Пробковая подставка под горячее. Диаметр 18 см, толщина 1 см.",
        "#ceb79a",
        "◎",
    ),
]


def main():
    client = storage()
    bucket = settings().minio_bucket
    with session_factory.begin() as db:
        db.execute(text("SELECT pg_advisory_xact_lock(73002002)"))
        if not client.bucket_exists(bucket):
            client.make_bucket(bucket)
        for index, (name, category, price, description, color, symbol) in enumerate(PRODUCTS, 1):
            key = f"demo-{index}.svg"
            svg = (
                f'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">'
                f'<rect width="600" height="450" fill="{color}"/>'
                f'<text x="300" y="260" text-anchor="middle" font-family="sans-serif" '
                f'font-size="150" fill="#3c493e">{symbol}</text></svg>'
            ).encode()
            client.put_object(bucket, key, io.BytesIO(svg), len(svg), content_type="image/svg+xml")
            db.execute(
                insert(Product)
                .values(
                    id=UUID(int=index),
                    name=name,
                    description=description,
                    category=category,
                    price=price,
                    stock=20,
                    image_key=key,
                )
                .on_conflict_do_nothing()
            )


if __name__ == "__main__":
    main()
