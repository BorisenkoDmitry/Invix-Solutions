"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { api } from "@/shared/api/client";
import type { Cart } from "@/shared/api/types";
type CartContext = {
  cart: Cart | null;
  error: string;
  busy: boolean;
  pendingProductId: string | null;
  loading: boolean;
  setQuantity: (id: string, quantity: number) => Promise<void>;
  reload: () => Promise<void>;
};
const Context = createContext<CartContext | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setCart(await api<Cart>("cart"));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);
  async function setQuantity(id: string, quantity: number) {
    setBusy(true);
    setPendingProductId(id);
    setError("");
    try {
      setCart(
        await api<Cart>(`cart/items/${id}`, {
          method: "PUT",
          body: JSON.stringify({ quantity }),
        }),
      );
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setBusy(false);
      setPendingProductId(null);
    }
  }
  return (
    <Context.Provider
      value={{
        cart,
        error,
        busy,
        pendingProductId,
        loading,
        setQuantity,
        reload,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useCart() {
  const value = useContext(Context);
  if (!value) throw new Error("CartProvider missing");
  return value;
}
