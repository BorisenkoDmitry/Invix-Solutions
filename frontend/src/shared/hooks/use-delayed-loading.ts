"use client";

import { useEffect, useState } from "react";

export function useDelayedLoading(loading: boolean, delayMs = 250): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!loading || delayMs <= 0) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [loading, delayMs]);
  return loading && (delayMs <= 0 || visible);
}
