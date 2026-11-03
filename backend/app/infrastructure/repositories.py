import hashlib
from uuid import UUID

from sqlalchemy import delete, select, text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.domain.checkout import CheckoutLine, ShopError
from app.domain.errors import NotFoundError
from app.infrastructure.models import Cart, CartItem, Order, Product


def product_dict(p: Product) -> dict:
    return {
        "id": str(p.id),
        "name": p.name,
        "description": p.description,
        "category": p.category,
        "price": p.price,
        "stock": p.stock,
        "image_url": f"/api/media/{p.image_key}" if p.image_key else None,
    }


def order_dict(o: Order) -> dict:
    return {
        "id": str(o.id),
        "items": o.items,
        "total": o.total,
        "customer": o.customer,
        "created_at": o.created_at.isoformat(),
        "fingerprint": o.fingerprint,
    }


class ShopRepository:
    def __init__(self, session: Session):
        self.session = session

    def lock_product(self, product_id: UUID) -> None:
        self.session.execute(
            text("SELECT pg_advisory_xact_lock(:key)"),
            {"key": int.from_bytes(product_id.bytes[:8], signed=True)},
        )

    def find_product(self, product_id: UUID) -> dict | None:
        product = self.session.get(Product, product_id)
        return product_dict(product) if product else None

    def create_product(self, product_id: UUID, name: str, image_key: str) -> dict:
        product = Product(
            id=product_id,
            name=name,
            description="",
            category="Каталог",
            price=0,
            stock=0,
            image_key=image_key,
        )
        self.session.add(product)
        self.session.flush()
        return product_dict(product)

    def products(self) -> list[dict]:
        return [
            product_dict(product) for product in self.session.scalars(select(Product).order_by(Product.name))
        ]

    def product(self, product_id: UUID) -> dict:
        product = self.session.get(Product, product_id)
        if product is None:
            raise NotFoundError("Товар не найден")
        return product_dict(product)

    def order(self, cart_id: UUID, order_id: UUID) -> dict:
        order = self.session.scalar(select(Order).where(Order.id == order_id, Order.cart_id == cart_id))
        if order is None:
            raise NotFoundError("Заказ не найден")
        return order_dict(order)

    def orders(self, cart_id: UUID, limit: int, offset: int) -> dict:
        orders = self.session.scalars(
            select(Order)
            .where(Order.cart_id == cart_id)
            .order_by(Order.created_at.desc(), Order.id.desc())
            .offset(offset)
            .limit(limit + 1)
        ).all()
        return {"items": [order_dict(order) for order in orders[:limit]], "has_more": len(orders) > limit}

    def set_image(self, product_id: UUID, key: str) -> dict:
        product = self.session.get(Product, product_id)
        if product is None:
            raise NotFoundError("Товар не найден")
        product.image_key = key
        return product_dict(product)

    def lock_cart(self, token: str) -> UUID:
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        self.session.execute(insert(Cart).values(token_hash=token_hash).on_conflict_do_nothing())
        return self.session.scalar(select(Cart.id).where(Cart.token_hash == token_hash).with_for_update())

    def cart(self, cart_id: UUID) -> dict:
        rows = self.session.execute(
            select(CartItem, Product).join(Product).where(CartItem.cart_id == cart_id).order_by(Product.name)
        ).all()
        items = [{"product": product_dict(p), "quantity": i.quantity} for i, p in rows]
        return {"items": items, "total": sum(i.quantity * p.price for i, p in rows)}

    def set_quantity(self, cart_id: UUID, product_id: UUID, quantity: int) -> dict:
        product = self.session.get(Product, product_id)
        if not product:
            raise NotFoundError("Товар не найден")
        if quantity > 0 and product.price <= 0:
            raise ShopError("Цена товара ещё не указана")
        if quantity > product.stock:
            raise ShopError("Недостаточно товара на складе")
        if quantity == 0:
            self.session.execute(
                delete(CartItem).where(CartItem.cart_id == cart_id, CartItem.product_id == product_id)
            )
        else:
            self.session.execute(
                insert(CartItem)
                .values(cart_id=cart_id, product_id=product_id, quantity=quantity)
                .on_conflict_do_update(
                    index_elements=[CartItem.cart_id, CartItem.product_id], set_={"quantity": quantity}
                )
            )
        return self.cart(cart_id)

    def find_order(self, cart_id: UUID, key: UUID) -> dict | None:
        order = self.session.scalar(
            select(Order).where(Order.cart_id == cart_id, Order.idempotency_key == key)
        )
        return order_dict(order) if order else None

    def checkout_lines(self, cart_id: UUID) -> list[CheckoutLine]:
        rows = self.session.execute(
            select(CartItem, Product)
            .join(Product)
            .where(CartItem.cart_id == cart_id)
            .order_by(Product.id)
            .with_for_update(of=Product)
        ).all()
        return [CheckoutLine(p.id, p.name, p.price, i.quantity, p.stock) for i, p in rows]

    def save_order(
        self,
        cart_id: UUID,
        key: UUID,
        customer: dict,
        fingerprint: str,
        lines: list[CheckoutLine],
        total: int,
    ) -> dict:
        items = [
            {"product_id": str(i.product_id), "name": i.name, "price": i.price, "quantity": i.quantity}
            for i in lines
        ]
        for line in lines:
            product = self.session.get(Product, line.product_id)
            product.stock -= line.quantity
        order = Order(
            cart_id=cart_id,
            idempotency_key=key,
            customer=customer,
            fingerprint=fingerprint,
            items=items,
            total=total,
        )
        self.session.add(order)
        self.session.execute(delete(CartItem).where(CartItem.cart_id == cart_id))
        self.session.flush()
        return order_dict(order)
