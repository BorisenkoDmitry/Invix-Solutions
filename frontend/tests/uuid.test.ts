import assert from "node:assert/strict";
import { test } from "node:test";
import { createUUID } from "../src/shared/lib/uuid";

test("checkout UUID works when HTTP exposes getRandomValues without randomUUID", (t) => {
  t.mock.getter(globalThis, "crypto", () => ({
    getRandomValues: (bytes: Uint8Array) => {
      assert.equal(bytes.length, 16);
      return bytes.fill(255);
    },
  }));
  assert.equal(createUUID(), "ffffffff-ffff-4fff-bfff-ffffffffffff");
});

test("checkout keys use independent random values and valid UUID v4 bits", () => {
  const keys = Array.from({ length: 100 }, createUUID);
  assert.equal(new Set(keys).size, keys.length);
  for (const key of keys) {
    assert.match(key, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  }
});
