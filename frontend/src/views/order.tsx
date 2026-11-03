"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/shared/api/client";
import { money, type Order } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";
import { Loader } from "@/shared/ui/loader";
import { CheckCircle2 } from "lucide-react";
export function OrderView({ id }: { id: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    api<Order>(`orders/${id}`)
      .then((o) => {
        if (active) {
          setOrder(o);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id, attempt]);
  if (error)
    return (
      <div className="empty" role="alert">
        <p>{error}</p>
        <Button
          onClick={() => {
            setError("");
            setAttempt(attempt + 1);
          }}
        >
          Повторить
        </Button>
      </div>
    );
  if (!order) return <Loader variant="page" label="Загружаем ваш заказ…" />;
  return (
    <section className="order">
      <p className="order-status">
        <CheckCircle2 aria-hidden="true" />
        Заказ оформлен
      </p>
      <h1>Спасибо, {order.customer.name}!</h1>
      <p className="muted">Номер заказа</p>
      <p className="order-id">{order.id}</p>
      <div className="order-items">
        {order.items.map((i) => (
          <div className="total" key={i.product_id}>
            <span>
              {i.name} × {i.quantity}
            </span>
            <strong>{money(i.price * i.quantity)}</strong>
          </div>
        ))}
        <div className="total">
          <strong>Итого</strong>
          <strong>{money(order.total)}</strong>
        </div>
      </div>
      <p>
        <strong>Доставка:</strong> {order.customer.address}
      </p>
      <p>
        <strong>Телефон:</strong> {order.customer.phone}
      </p>
      <p className="muted">
        Это демонстрационный заказ. Деньги не списывались.
      </p>
      <Button asChild size="lg">
        <Link href="/">Вернуться в каталог</Link>
      </Button>
      <Button asChild variant="ghost" className="ml-2 mt-2">
        <Link href="/orders">История заказов</Link>
      </Button>
    </section>
  );
}
