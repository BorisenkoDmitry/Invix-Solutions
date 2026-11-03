export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  image_url: string | null;
};
export type Cart = {
  items: { product: Product; quantity: number }[];
  total: number;
};
export type Order = {
  id: string;
  items: {
    product_id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  total: number;
  customer: { name: string; phone: string; address: string };
  created_at: string;
};
export type OrderSummary = Omit<Order, "customer">;
export type OrderHistory = { items: OrderSummary[]; has_more: boolean };
export const money = (kopecks: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(kopecks / 100);
