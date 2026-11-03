import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { money, type OrderSummary } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

const orderDate = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
export function OrderCard({ order }: { order: OrderSummary }) {
  return (
    <Card className="history-card border-0 shadow-none">
      <div className="history-card-heading">
        <div>
          <h2>Заказ №{order.id.slice(0, 8).toUpperCase()}</h2>
          <time dateTime={order.created_at} className="muted small">
            {orderDate.format(new Date(order.created_at))}
          </time>
        </div>
        <span className="order-status">
          <CheckCircle2 size={16} aria-hidden="true" />
          Оформлен
        </span>
      </div>
      <ul className="history-items">
        {order.items.map((item) => (
          <li key={item.product_id}>
            <span>
              {item.name} <span className="muted">× {item.quantity}</span>
            </span>
            <span>{money(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="history-card-footer">
        <div>
          <span className="muted small">Итого</span>
          <strong>{money(order.total)}</strong>
        </div>
        <Button variant="secondary" asChild>
          <Link
            href={`/orders/${order.id}`}
            aria-label={`Подробнее о заказе ${order.id.slice(0, 8)}`}
          >
            Подробнее
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
