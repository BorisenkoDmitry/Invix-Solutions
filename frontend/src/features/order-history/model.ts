"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/shared/api/client";
import type { OrderHistory, OrderSummary } from "@/shared/api/types";

const PAGE_SIZE = 20;
export function useOrderHistory() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const nextOffset = useRef(0);
  const inFlight = useRef(false);
  const mounted = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError("");
    try {
      const offset = nextOffset.current;
      const page = await api<OrderHistory>(
        `orders?limit=${PAGE_SIZE}&offset=${offset}`,
      );
      if (!mounted.current) return;
      setOrders((previous) =>
        offset === 0 ? page.items : [...previous, ...page.items],
      );
      nextOffset.current += page.items.length;
      setHasMore(page.has_more);
    } catch (error) {
      if (mounted.current)
        setError(
          error instanceof Error
            ? error.message
            : "Не удалось загрузить заказы.",
        );
    } finally {
      inFlight.current = false;
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);
  return { orders, hasMore, loading, error, load };
}
