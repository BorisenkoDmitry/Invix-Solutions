"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useDelayedLoading } from "@/shared/hooks/use-delayed-loading";
import { Button } from "@/shared/ui/button";
import { Loader } from "@/shared/ui/loader";

type QuantityControlsProps = {
  name: string;
  quantity: number;
  max: number;
  disabled: boolean;
  pending: boolean;
  onChange: (quantity: number) => Promise<void>;
};
export function QuantityControls({
  name,
  quantity,
  max,
  disabled,
  pending,
  onChange,
}: QuantityControlsProps) {
  const [direction, setDirection] = useState<"minus" | "plus" | null>(null);
  const showLoading = useDelayedLoading(pending);

  async function change(next: number, action: "minus" | "plus") {
    setDirection(action);
    try {
      await onChange(next);
    } catch {
      /* Error is displayed by the cart. */
    } finally {
      setDirection(null);
    }
  }

  return (
    <div className="quantity">
      <Button
        variant="secondary"
        size="icon"
        aria-label={`Уменьшить количество: ${name}`}
        disabled={disabled}
        data-pending={disabled || undefined}
        aria-busy={(pending && direction === "minus") || undefined}
        onClick={() => void change(quantity - 1, "minus")}
      >
        {showLoading && direction === "minus" ? (
          <Loader label="" delayMs={0} />
        ) : (
          <Minus aria-hidden="true" />
        )}
      </Button>
      <span aria-live="polite">{quantity}</span>
      <Button
        variant="secondary"
        size="icon"
        aria-label={`Увеличить количество: ${name}`}
        disabled={disabled || quantity >= max}
        data-pending={disabled || undefined}
        aria-busy={(pending && direction === "plus") || undefined}
        onClick={() => void change(quantity + 1, "plus")}
      >
        {showLoading && direction === "plus" ? (
          <Loader label="" delayMs={0} />
        ) : (
          <Plus aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}
