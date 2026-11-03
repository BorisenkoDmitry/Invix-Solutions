import type { MaskedPatternOptions } from "imask";
export const phoneMaskOptions: MaskedPatternOptions = {
  mask: "+{7} (000) 000-00-00",
  lazy: true,
  prepare: (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits.length === 11 && digits.startsWith("8")
      ? "+7" + digits.slice(1)
      : value;
  },
  prepareChar: (char, masked) =>
    !masked.unmaskedValue && char === "8" ? "7" : char,
};
