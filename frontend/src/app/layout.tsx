import type { Metadata } from "next";
import { CartProvider } from "@/features/cart/model";
import { Header } from "@/widgets/header";
import "@fontsource-variable/manrope";
import "@/shared/ui/theme.css";
import "./styles.css";

export const metadata: Metadata = {
  title: "Каталог товаров",
  description: "Каталог товаров и оформление заказа",
};
export const dynamic = "force-dynamic";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <a href="#main" className="skip">
          К содержимому
        </a>
        <CartProvider>
          <div className="shell">
            <Header />
            <main id="main">
              {children}
            </main>
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
