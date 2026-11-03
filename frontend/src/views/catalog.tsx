"use client";

import { useState } from "react";
import { ArrowDown, ShoppingBag } from "lucide-react";
import { ProductCard } from "@/entities/product/card";
import { AddButton } from "@/features/cart/add-button";
import type { Product } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";

export function Catalog({ products }: { products: Product[] }) {
  const [category, setCategory] = useState("Все товары");
  const categories = [
    "Все товары",
    ...new Set(products.map((p) => p.category)),
  ];
  const visible = products.filter(
    (p) => category === "Все товары" || p.category === category,
  );
  return (
    <>
      <section className="catalog-intro" aria-labelledby="catalog-title">
        <div>
          <h1 id="catalog-title">
            Простые вещи.
            <br />
            На каждый день.
          </h1>
          <p>Для заметок, любимого кофе и небольших планов.</p>
        </div>
        <div className="catalog-note">
          <ShoppingBag size={28} strokeWidth={1.4} aria-hidden="true" />
          <p>
            Небольшой магазин.
            <br />
            Только самое нужное.
          </p>
          <a href="#catalog" aria-label="Перейти к товарам">
            <ArrowDown size={21} aria-hidden="true" />
          </a>
        </div>
      </section>
      <section id="catalog" aria-labelledby="products-heading">
        <div className="catalog-toolbar">
          <div className="catalog-section-title">
            <h2 id="products-heading">Каталог</h2>
            <span className="catalog-count" aria-live="polite">
              {visible.length} товаров
            </span>
          </div>
          <div className="filters" role="group" aria-label="Категория">
            {categories.map((c) => (
              <Button
                key={c}
                variant={c === category ? "default" : "ghost"}
                className={c === category ? "filter active" : "filter"}
                aria-pressed={c === category}
                onClick={() => setCategory(c)}
              >
                {c}
              </Button>
            ))}
          </div>
        </div>
        {visible.length ? (
          <div className="product-grid" key={category}>
            {visible.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                action={<AddButton product={p} />}
              />
            ))}
          </div>
        ) : (
          <p className="empty">В этой категории пока нет товаров.</p>
        )}
      </section>
    </>
  );
}
