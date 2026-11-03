"use client";
import { IMaskMixin } from "react-imask";
import IMask from "imask";
import type { ComponentProps, Ref, ClipboardEvent } from "react";
import { phoneMaskOptions } from "@/shared/lib/phone-mask";
import { Input } from "./input";

const MaskedInput = IMaskMixin<HTMLInputElement>(({ inputRef, ...props }) => (
  <Input {...props} ref={inputRef as Ref<HTMLInputElement>} />
));
type PhoneProps = Omit<
  ComponentProps<typeof Input>,
  "value" | "onChange" | "type" | "ref"
> & { value: string; onValueChange: (value: string) => void };
export function PhoneInput({ value, onValueChange, ...props }: PhoneProps) {
  return (
    <MaskedInput
      {...props}
      {...phoneMaskOptions}
      value={value}
      onAccept={onValueChange}
      type="text"
      inputMode="tel"
      autoComplete="tel"
      placeholder="+7 (999) 123-45-67"
      onPaste={(event: ClipboardEvent<HTMLInputElement>) => {
        const pasted = event.clipboardData.getData("text");
        const digits = pasted.replace(/\D/g, "");
        if (
          digits.length === 10 ||
          (digits.length === 11 && /^[78]/.test(digits))
        ) {
          event.preventDefault();
          onValueChange(IMask.pipe(pasted, phoneMaskOptions));
        }
      }}
    />
  );
}
