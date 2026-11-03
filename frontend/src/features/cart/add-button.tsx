"use client";
import Link from "next/link";
import { useCart } from "./model";
import type { Product } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";
import { BusyButton } from "@/shared/ui/busy-button";
import { ShoppingBag, Check } from "lucide-react";
export function AddButton({ product }: { product: Product }) {
  const { cart, busy, pendingProductId, loading, setQuantity } = useCart();
  const quantity =
    cart?.items.find((i) => i.product.id === product.id)?.quantity || 0;
  if (quantity)
    return (
      <Button asChild variant="secondary" className="product-action">
        <Link href="/cart">
          <Check aria-hidden="true" />В корзине: {quantity}
        </Link>
      </Button>
    );
  return (
    <BusyButton
      className="product-action"
      busy={pendingProductId === product.id || loading}
      busyLabel={pendingProductId === product.id ? "Добавляем…" : "Загружаем…"}
      disabled={busy || !cart || product.stock === 0}
      onClick={() => {
        void setQuantity(product.id, 1).catch(() => {});
      }}
    >
      <ShoppingBag aria-hidden="true" />
      {product.stock ? "В корзину" : "Нет в наличии"}
    </BusyButton>
  );
}
