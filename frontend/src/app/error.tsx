"use client";
import { useTransition } from "react";
import { BusyButton } from "@/shared/ui/busy-button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const [pending, startTransition] = useTransition();
  return (
    <section className="empty" role="alert">
      <h1>Магазин временно недоступен</h1>
      <p>Не удалось загрузить данные. Попробуйте ещё раз.</p>
      <BusyButton
        busy={pending}
        busyLabel="Загружаем…"
        onClick={() => startTransition(reset)}
      >
        Повторить
      </BusyButton>
    </section>
  );
}
