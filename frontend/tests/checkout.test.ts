import assert from "node:assert/strict";
import { test } from "node:test";
import IMask from "imask";
import { phoneMaskOptions } from "../src/shared/lib/phone-mask";
import { api, ApiError } from "../src/shared/api/client";
import {
  validateCustomer,
  validateField,
  serverFieldErrors,
} from "../src/features/checkout/validation";

test("empty or whitespace-only fields get individual Russian errors", () => {
  const errors = validateCustomer({ name: "  ", phone: "", address: "\n " });
  assert.deepEqual(Object.keys(errors), ["name", "phone", "address"]);
  assert.match(errors.name!, /имя/);
  assert.match(errors.phone!, /телефона/);
  assert.match(errors.address!, /адрес/);
});
test("incomplete mask is rejected, full formatted number is accepted", () => {
  assert.ok(validateField("phone", "+7 (999) 12"));
  assert.ok(validateField("phone", "+7"));
  assert.equal(validateField("phone", "+7 (999) 123-45-67"), undefined);
  assert.equal(validateField("name", " Ирина "), undefined);
  assert.ok(validateField("name", "a"));
  assert.ok(validateField("address", "дом"));
  assert.ok(validateField("address", "я".repeat(501)));
});
test("phone mask preserves all digits when replacing and typing a full number", () => {
  const mask = IMask.createMask(phoneMaskOptions);
  mask.resolve("99912");
  for (const value of ["89991234567", "+79991234567", "9991234567"]) {
    mask.resolve(value);
    assert.equal(mask.value, "+7 (999) 123-45-67");
  }
  mask.reset();
  for (const char of "89991234567") mask.append(char);
  assert.equal(mask.value, "+7 (999) 123-45-67");
});
test("FastAPI 422 errors map by body field, never by array position or header", () => {
  const errors = serverFieldErrors([
    {
      loc: ["body", "address"],
      type: "string_too_short",
      msg: "String too short",
      ctx: { min_length: 5 },
    },
    { loc: ["header", "idempotency-key"], type: "missing", msg: "Required" },
    { loc: ["body", "phone"], type: "value_error", msg: "Value error, phone" },
    { loc: ["body", "name"], type: "missing", msg: "Required" },
  ]);
  assert.deepEqual(Object.keys(errors), ["address", "phone", "name"]);
  assert.match(errors.address!, /5/);
  assert.match(errors.phone!, /телефона/);
});
test("API preserves validation details and status for field-level rendering", async () => {
  const originalFetch = globalThis.fetch;
  const issues = [
    { loc: ["body", "phone"], type: "value_error", msg: "Invalid phone" },
  ];
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ detail: issues }), { status: 422 });
  try {
    await assert.rejects(api("orders", { method: "POST" }), (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 422);
      assert.deepEqual(error.issues, issues);
      assert.match(error.message, /Проверьте/);
      return true;
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
test("API keeps business errors readable and gracefully handles non-JSON failures", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ detail: "Недостаточно товара" }), {
        status: 409,
      });
    await assert.rejects(api("orders"), /Недостаточно товара/);
    globalThis.fetch = async () => new Response("Bad gateway", { status: 502 });
    await assert.rejects(
      api("orders"),
      (error) =>
        error instanceof ApiError &&
        error.status === 502 &&
        !error.issues.length,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
test("network errors have a recoverable Russian message", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };
  try {
    await assert.rejects(
      api("cart"),
      (error) =>
        error instanceof ApiError &&
        error.status === 0 &&
        error.message.includes("Нет связи"),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
