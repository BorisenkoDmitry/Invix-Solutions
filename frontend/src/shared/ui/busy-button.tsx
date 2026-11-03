"use client";

import type { ComponentProps } from "react";
import { useDelayedLoading } from "@/shared/hooks/use-delayed-loading";
import { cn } from "@/shared/lib/utils";
import { Button } from "./button";
import { Loader } from "./loader";

export function BusyButton({
  busy = false,
  busyLabel = "Загружаем…",
  children,
  disabled,
  className,
  ...props
}: ComponentProps<typeof Button> & { busy?: boolean; busyLabel?: string }) {
  const showLoading = useDelayedLoading(busy);
  return (
    <Button
      {...props}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      data-pending={busy || undefined}
      className={cn("busy-button", className)}
    >
      <span className="busy-button-content">
        <span
          className={cn("busy-button-label", showLoading && "invisible")}
          aria-hidden={showLoading}
        >
          {children}
        </span>
        <span
          className={cn("busy-button-label", !showLoading && "invisible")}
          aria-hidden={!showLoading}
        >
          <Loader label={busyLabel} active={showLoading} delayMs={0} />
        </span>
      </span>
    </Button>
  );
}
