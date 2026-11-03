"use client";
import Link from "next/link";
import { CircleAlert, History } from "lucide-react";
import { OrderCard } from "@/entities/order/card";
import { useOrderHistory } from "@/features/order-history/model";
import { Button } from "@/shared/ui/button";
import { BusyButton } from "@/shared/ui/busy-button";
import { Loader } from "@/shared/ui/loader";
import { Alert, AlertDescription } from "@/shared/ui/alert";

export function OrderHistoryView() {
  const { orders, hasMore, loading, error, load } = useOrderHistory();
  return (
    <section className="history-page" aria-labelledby="history-heading">
      <div className="page-heading">
        <div>
          <h1 id="history-heading">История заказов</h1>
          <p className="muted">Ваши покупки в этом браузере.</p>
        </div>
      </div>
      {loading && !orders.length ? (
        <Loader variant="page" label="Загружаем историю заказов…" />
      ) : (
        <>
          {error && (
            <Alert variant="destructive" className="history-error">
              <CircleAlert aria-hidden="true" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!orders.length && !error && (
            <div className="empty">
              <History className="empty-icon" aria-hidden="true" />
              <h2>Заказов пока нет</h2>
              <p className="muted">
                После оформления покупки она появится здесь.
              </p>
              <Button asChild size="lg">
                <Link href="/">Перейти в каталог</Link>
              </Button>
            </div>
          )}
          {!!orders.length && (
            <div className="history-list">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
          {(hasMore || error) && (
            <div className="history-actions">
              <BusyButton
                busy={loading}
                busyLabel="Загружаем заказы…"
                variant="secondary"
                onClick={() => void load()}
              >
                {error ? "Повторить загрузку" : "Показать ещё"}
              </BusyButton>
            </div>
          )}
        </>
      )}
    </section>
  );
}
