import { notFound } from "next/navigation";
import { getProduct } from "@/shared/api/server";
import { ProductView } from "@/views/product";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const product = await getProduct((await params).id);
  if (!product) notFound();
  return <ProductView product={product} />;
}
