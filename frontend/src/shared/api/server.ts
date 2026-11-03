import "server-only";
import type { Product } from "./types";
export async function getProducts(): Promise<Product[]> {
  const response = await fetch(
    `${process.env.API_URL || "http://localhost:8000"}/v1/products`,
    { cache: "no-store", signal: AbortSignal.timeout(8000) },
  );
  if (!response.ok) throw new Error("Каталог временно недоступен");
  return response.json();
}
export async function getProduct(id: string): Promise<Product | null> {
  const response = await fetch(
    `${process.env.API_URL || "http://localhost:8000"}/v1/products/${encodeURIComponent(id)}`,
    { cache: "no-store", signal: AbortSignal.timeout(8000) },
  );
  if (response.status === 404 || response.status === 422) return null;
  if (!response.ok) throw new Error("Товар временно недоступен");
  return response.json();
}
