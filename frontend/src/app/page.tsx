import { getProducts } from "@/shared/api/server";
import { Catalog } from "@/views/catalog";
export default async function Page() {
  return <Catalog products={await getProducts()} />;
}
