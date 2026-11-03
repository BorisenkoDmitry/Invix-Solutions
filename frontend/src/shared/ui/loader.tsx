"use client";

import { cn } from "@/shared/lib/utils";
import { useDelayedLoading } from "@/shared/hooks/use-delayed-loading";
import { Spinner } from "./spinner";

type LoaderProps = {
  label?: string;
  variant?: "inline" | "page";
  className?: string;
  active?: boolean;
  delayMs?: number;
};
export function Loader({
  label = "Загружаем…",
  variant = "inline",
  className,
  active = true,
  delayMs = 250,
}: LoaderProps) {
  const visible = useDelayedLoading(active, delayMs);
  return (
    <span
      role={visible ? "status" : undefined}
      aria-live={visible ? "polite" : undefined}
      aria-hidden={!visible}
      className={cn(
        "loader inline-flex items-center justify-center gap-2.5",
        variant === "page" &&
          "loading-state flex min-h-64 w-full flex-col gap-4 text-sm text-muted-foreground",
        !visible && "invisible",
        className,
      )}
    >
      <Spinner
        aria-hidden="true"
        role={undefined}
        aria-label={undefined}
        className={cn(
          "motion-reduce:animate-none",
          variant === "page" ? "size-8" : "size-4",
        )}
      />
      {label && <span>{label}</span>}
    </span>
  );
}
