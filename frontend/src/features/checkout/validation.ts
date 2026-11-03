import type { ValidationIssue } from "@/shared/api/client";

export const customerFields = ["name", "phone", "address"] as const;
export type CustomerField = (typeof customerFields)[number];
export type CustomerValues = Record<CustomerField, string>;
export type FieldErrors = Partial<Record<CustomerField, string>>;
export const emptyCustomer: CustomerValues = {
  name: "",
  phone: "",
  address: "",
};

export function validateField(
  field: CustomerField,
  value: string,
): string | undefined {
  const trimmed = value.trim();
  if (field === "phone") {
    const digits = trimmed.replace(/\D/g, "");
    if (!digits || digits === "7") return "Укажите номер телефона.";
    if (digits.length !== 11 || !digits.startsWith("7"))
      return "Введите номер полностью: +7 (999) 123-45-67.";
    return;
  }
  const label = field === "name" ? "имя" : "адрес доставки";
  const min = field === "name" ? 2 : 5;
  const max = field === "name" ? 100 : 500;
  if (!trimmed) return `Укажите ${label}.`;
  if (trimmed.length < min)
    return field === "name"
      ? "Имя должно содержать минимум 2 символа."
      : "Укажите адрес подробнее — минимум 5 символов.";
  if (trimmed.length > max) return `Максимальная длина — ${max} символов.`;
}

export function validateCustomer(values: CustomerValues): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of customerFields) {
    const message = validateField(field, values[field]);
    if (message) errors[field] = message;
  }
  return errors;
}

// Match FastAPI's body.<field> paths. Unexpected/header errors remain form-level errors.
export function serverFieldErrors(issues: ValidationIssue[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    if (issue.loc?.[0] !== "body") continue;
    const field = issue.loc[1] as CustomerField;
    if (!customerFields.includes(field) || errors[field]) continue;
    if (issue.type === "missing")
      errors[field] =
        field === "name"
          ? "Укажите имя."
          : field === "phone"
            ? "Укажите номер телефона."
            : "Укажите адрес доставки.";
    else if (issue.type === "string_too_short")
      errors[field] =
        `Минимальная длина — ${issue.ctx?.min_length ?? (field === "name" ? 2 : 5)} символов.`;
    else if (issue.type === "string_too_long")
      errors[field] =
        `Максимальная длина — ${issue.ctx?.max_length ?? (field === "address" ? 500 : 100)} символов.`;
    else if (field === "phone")
      errors[field] = "Проверьте номер телефона и введите его полностью.";
    else errors[field] = "Проверьте значение: поле не должно быть пустым.";
  }
  return errors;
}
