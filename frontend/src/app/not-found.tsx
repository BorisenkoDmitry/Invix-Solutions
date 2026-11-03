import Link from "next/link";
import { Button } from "@/shared/ui/button";
export default function NotFound() {
  return (
    <section className="empty">
      <h1>Страница не найдена</h1>
      <Button asChild>
        <Link href="/">В каталог</Link>
      </Button>
    </section>
  );
}
