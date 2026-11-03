"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleAlert, LockKeyhole } from "lucide-react";
import { api, ApiError } from "@/shared/api/client";
import { money, type Order } from "@/shared/api/types";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Label } from "@/shared/ui/label";
import { Card } from "@/shared/ui/card";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { PhoneInput } from "@/shared/ui/phone-input";
import { BusyButton } from "@/shared/ui/busy-button";
import { createUUID } from "@/shared/lib/uuid";
import {
  customerFields,
  emptyCustomer,
  serverFieldErrors,
  validateCustomer,
  validateField,
  type CustomerField,
  type FieldErrors,
} from "./validation";

type CheckoutProps = {
  total: number;
  cartBusy: boolean;
  onOrdered: () => Promise<void>;
  onBusyChange: (busy: boolean) => void;
};
export function CheckoutForm({
  total,
  cartBusy,
  onOrdered,
  onBusyChange,
}: CheckoutProps) {
  const [values, setValues] = useState({ ...emptyCustomer });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<CustomerField, boolean>>
  >({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);
  const attemptRef = useRef<{ key: string; payload: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  function change(field: CustomerField, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    if (touched[field])
      setErrors((previous) => ({
        ...previous,
        [field]: validateField(field, value),
      }));
    setFormError("");
  }
  function blur(field: CustomerField) {
    setTouched((previous) => ({ ...previous, [field]: true }));
    setErrors((previous) => ({
      ...previous,
      [field]: validateField(field, values[field]),
    }));
  }
  function focusError(nextErrors: FieldErrors) {
    const first = customerFields.find((field) => nextErrors[field]);
    if (first)
      (
        formRef.current?.elements.namedItem(first) as HTMLElement | null
      )?.focus();
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || cartBusy) return;
    const nextErrors = validateCustomer(values);
    setErrors(nextErrors);
    setTouched({ name: true, phone: true, address: true });
    setFormError("");
    if (Object.keys(nextErrors).length) {
      focusError(nextErrors);
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    onBusyChange(true);
    const payload = JSON.stringify({
      name: values.name.trim(),
      phone: values.phone.trim(),
      address: values.address.trim(),
    });
    try {
      let saved = attemptRef.current;
      if (!saved) {
        try {
          saved = JSON.parse(
            sessionStorage.getItem("checkout-attempt") || "null",
          );
        } catch {
          saved = null;
        }
      }
      const key =
        saved?.payload === payload && typeof saved.key === "string"
          ? saved.key
          : createUUID();
      attemptRef.current = { key, payload };
      try {
        sessionStorage.setItem(
          "checkout-attempt",
          JSON.stringify({ key, payload }),
        );
      } catch {
        /* Storage is optional. */
      }
      const order = await api<Order>("orders", {
        method: "POST",
        headers: { "Idempotency-Key": key },
        body: payload,
      });
      try {
        sessionStorage.removeItem("checkout-attempt");
      } catch {
        /* Storage may be disabled. */
      }
      router.push(`/orders/${order.id}`);
      void onOrdered();
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        const fields = serverFieldErrors(error.issues);
        setErrors(fields);
        if (Object.keys(fields).length)
          requestAnimationFrame(() => focusError(fields));
        else
          setFormError(
            "Не удалось проверить данные заказа. Повторите попытку.",
          );
      } else
        setFormError(
          error instanceof ApiError
            ? error.message
            : "Не удалось оформить заказ. Попробуйте ещё раз.",
        );
      setSubmitting(false);
      inFlight.current = false;
      onBusyChange(false);
    }
  }
  return (
    <Card className="checkout border-0 shadow-none">
      <form
        ref={formRef}
        onSubmit={submit}
        noValidate
        aria-labelledby="checkout-title"
        aria-busy={submitting}
      >
        <div className="checkout-title">
          <h2 id="checkout-title">Оформление заказа</h2>
          <p className="muted">Осталось указать, кому и куда доставить.</p>
        </div>
        <fieldset disabled={submitting} className="min-w-0 border-0 p-0 m-0">
          <div className="form-field">
            <Label htmlFor="customer-name">Как к вам обращаться</Label>
            <Input
              id="customer-name"
              name="name"
              autoComplete="name"
              placeholder="Имя и фамилия"
              value={values.name}
              onChange={(event) => change("name", event.target.value)}
              onBlur={() => blur("name")}
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" className="field-error" role="alert">
                {errors.name}
              </p>
            )}
          </div>
          <div className="form-field">
            <Label htmlFor="customer-phone">Номер телефона</Label>
            <PhoneInput
            value={values.phone}
              id="customer-phone"
              name="phone"
              onValueChange={(value) => change("phone", value)}
              onBlur={() => blur("phone")}
              aria-required="true"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "phone-error" : "phone-hint"}
            />
            {errors.phone ? (
              <p id="phone-error" className="field-error" role="alert">
                {errors.phone}
              </p>
            ) : (
              <p id="phone-hint" className="field-hint">
                Российский номер в формате +7.
              </p>
            )}
          </div>
          <div className="form-field">
            <Label htmlFor="customer-address">Куда доставить</Label>
            <Textarea
              id="customer-address"
              name="address"
              autoComplete="street-address"
              placeholder="Город, улица, дом и квартира"
              value={values.address}
              onChange={(event) => change("address", event.target.value)}
              onBlur={() => blur("address")}
              rows={3}
              aria-required="true"
              aria-invalid={!!errors.address}
              aria-describedby={errors.address ? "address-error" : undefined}
            />
            {errors.address && (
              <p id="address-error" className="field-error" role="alert">
                {errors.address}
              </p>
            )}
          </div>
        </fieldset>
        <div className="total">
          <span>Итого</span>
          <strong>{money(total)}</strong>
        </div>
        {formError && (
          <Alert
            variant="destructive"
            className="mb-4 border-0 bg-destructive/5"
          >
            <CircleAlert aria-hidden="true" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        <BusyButton
          type="submit"
          className="checkout-submit w-full"
          size="lg"
          busy={submitting}
          busyLabel="Оформляем заказ…"
          disabled={cartBusy}
        >
          Оформить заказ
          <ArrowRight aria-hidden="true" />
        </BusyButton>
        <p className="checkout-note field-hint">
          <LockKeyhole size={14} aria-hidden="true" />
          Тестовый заказ, без оплаты.
        </p>
      </form>
    </Card>
  );
}
