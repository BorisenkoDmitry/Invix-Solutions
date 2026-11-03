import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { money, type Product } from "@/shared/api/types";
import { Card } from "@/shared/ui/card";

export function ProductCard({
  product,
  action,
}: {
  product: Product;
  action: React.ReactNode;
}) {
  return (
    <Card className="product">
      <article>
        <Link
          href={`/products/${product.id}`}
          className="product-image-link"
          aria-label={`Подробнее: ${product.name}`}
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt=""
              width="600"
              height="450"
              loading="lazy"
            />
          ) : (
            <div className="placeholder">Нет изображения</div>
          )}
          <span className="product-open" aria-hidden="true">
            <ArrowUpRight size={19} />
          </span>
        </Link>
        <div className="product-info">
          <p className="product-category">{product.category}</p>
          <Link href={`/products/${product.id}`} className="product-title">
            <h2>{product.name}</h2>
          </Link>
          <div className="product-bottom">
            <strong>{money(product.price)}</strong>
            <span
              className={
                product.stock ? "stock-label" : "stock-label unavailable"
              }
            >
              {product.stock ? "В наличии" : "Нет в наличии"}
            </span>
          </div>
          {action}
        </div>
      </article>
    </Card>
  );
}
