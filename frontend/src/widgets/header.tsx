"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, ArrowUpRight, CircleAlert } from "lucide-react";
import { useCart } from "@/features/cart/model";
import { Button } from "@/shared/ui/button";
import { Loader } from "@/shared/ui/loader";
import { BusyButton } from "@/shared/ui/busy-button";

export function Header() {
  const { cart, error, reload, loading } = useCart();
  const path = usePathname();
  const count = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  return (
    <>
      <header className="header">
        <Link className="brand" href="/" aria-label="На главную">
          <span className="brand-mark" aria-hidden="true">
            <ShoppingBag size={21} strokeWidth={1.8} />
          </span>
        </Link>
        <nav aria-label="Основная навигация">
          <Button variant="ghost" asChild className="nav-catalog">
            <Link aria-current={path === "/" ? "page" : undefined} href="/">
              Каталог
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </Button>
          <Button
            variant={path.startsWith("/orders") ? "secondary" : "ghost"}
            asChild
            className="nav-history"
          >
            <Link
              aria-current={path === "/orders" ? "page" : undefined}
              href="/orders"
            >
              История заказов
            </Link>
          </Button>
          <Button
            variant={path === "/cart" ? "default" : "secondary"}
            asChild
            className="nav-cart"
          >
            <Link
              aria-current={path === "/cart" ? "page" : undefined}
              aria-label={`Корзина, товаров: ${count}`}
              href="/cart"
            >
              <ShoppingBag size={17} aria-hidden="true" />
              <span className="count" aria-live="polite">
                <span className={cart === null ? "invisible" : undefined}>
                  {count}
                </span>
                <span className="count-loader">
                  <Loader label="" active={loading && cart === null} />
                </span>
              </span>
            </Link>
          </Button>
        </nav>
      </header>
      {error && (
        <div className="notice" role="alert">
          <CircleAlert size={18} aria-hidden="true" />
          <span>{error}</span>
          <BusyButton
            variant="ghost"
            size="sm"
            busy={loading}
            busyLabel="Загружаем…"
            onClick={() => void reload()}
          >
            Повторить
          </BusyButton>
        </div>
      )}
    </>
  );
}
