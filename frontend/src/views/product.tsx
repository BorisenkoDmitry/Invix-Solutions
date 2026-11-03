import Link from "next/link";
import { ArrowLeft, PackageCheck } from "lucide-react";
import { AddButton } from "@/features/cart/add-button";
import { money, type Product } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";

export function ProductView({ product: p }: { product: Product }) {
  return (
    <>
      <Button variant="ghost" asChild className="back">
        <Link href="/">
          <ArrowLeft size={16} aria-hidden="true" />
          Все товары
        </Link>
      </Button>
      <div className="product-detail">
        <div className="product-detail-image">
          {p.image_url ? (
            <img src={p.image_url} alt={p.name} width="600" height="450" />
          ) : (
            <div className="placeholder">Нет изображения</div>
          )}
        </div>
        <section className="product-detail-info">
          <p className="product-category">{p.category}</p>
          <h1>{p.name}</h1>
          <p className="description">{p.description}</p>
          <p className="price">{p.price > 0 ? money(p.price) : "Цена уточняется"}</p>
          <p className="stock-label">
            <PackageCheck size={17} aria-hidden="true" />
            {p.stock ? `В наличии: ${p.stock} шт.` : "Нет в наличии"}
          </p>
          <AddButton product={p} />
          <p className="product-purchase-note">
            Демонстрационный магазин.
            <br />
            Заказ без оплаты.
          </p>
        </section>
      </div>
    </>
  );
}
