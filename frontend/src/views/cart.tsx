"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/features/cart/model";
import { QuantityControls } from "@/features/cart/quantity-controls";
import { CheckoutForm } from "@/features/checkout/form";
import { money } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";
import { Loader } from "@/shared/ui/loader";
import { BusyButton } from "@/shared/ui/busy-button";
import { Alert, AlertDescription } from "@/shared/ui/alert";

export function CartView() {
  const { cart, busy, pendingProductId, loading, setQuantity, reload, error } =
    useCart();
  const [ordering, setOrdering] = useState(false);
  const locked = busy || ordering;
  if (!cart && loading)
    return <Loader variant="page" label="Загружаем корзину…" />;
  if (!cart)
    return (
      <section className="empty">
        <h1>Не удалось загрузить корзину</h1>
        <p className="muted">{error || "Попробуйте обновить данные."}</p>
        <BusyButton
          busy={loading}
          busyLabel="Загружаем…"
          onClick={() => void reload()}
        >
          Повторить загрузку
        </BusyButton>
      </section>
    );
  if (ordering && !cart.items.length)
    return <Loader variant="page" label="Открываем ваш заказ…" />;
  if (!cart.items.length)
    return (
      <section className="empty">
        <ShoppingBag className="empty-icon" aria-hidden="true" />
        <h1>Здесь пока пусто</h1>
        <p className="muted">Хорошие вещи уже ждут в каталоге.</p>
        <Button asChild size="lg">
          <Link href="/">Выбрать что-нибудь</Link>
        </Button>
      </section>
    );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Ваша корзина</h1>
          <p className="muted">Всё, что понравилось, — в одном месте.</p>
        </div>
        <Button asChild variant="ghost">
          <Link href="/">
            <ArrowLeft aria-hidden="true" />
            Продолжить покупки
          </Link>
        </Button>
      </div>
      <div className="checkout-layout">
        <section
          className="cart-items"
          aria-label="Товары в корзине"
          aria-busy={busy}
        >
          {cart.items.map(({ product: p, quantity }) => (
            <article className="cart-row" key={p.id}>
              {p.image_url && (
                <img src={p.image_url} alt="" width="100" height="100" />
              )}
              <div className="cart-name">
                <Link href={`/products/${p.id}`}>{p.name}</Link>
                <span className="muted small">{money(p.price)} / шт.</span>
                <Button
                  className="text-button"
                  variant="ghost"
                  size="sm"
                  disabled={locked}
                  data-pending={locked || undefined}
                  onClick={() => void setQuantity(p.id, 0).catch(() => {})}
                >
                  <Trash2 aria-hidden="true" />
                  Удалить
                </Button>
              </div>
              <QuantityControls
                name={p.name}
                quantity={quantity}
                max={Math.min(p.stock, 99)}
                disabled={locked}
                pending={pendingProductId === p.id}
                onChange={(next) => setQuantity(p.id, next)}
              />
              <strong>{money(p.price * quantity)}</strong>
            </article>
          ))}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </section>
        <CheckoutForm
          total={cart.total}
          cartBusy={busy}
          onOrdered={reload}
          onBusyChange={setOrdering}
        />
      </div>
    </>
  );
}
