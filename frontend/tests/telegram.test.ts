import assert from "node:assert/strict";
import { test } from "node:test";
import { hasTelegramLaunch, isTelegramApp, type TelegramWebApp } from "../src/shared/lib/telegram";

test("normal browser and arbitrary hashes do not load the Telegram bridge", () => {
  assert.equal(hasTelegramLaunch("#catalog", "?category=paper"), false);
  assert.equal(isTelegramApp(undefined), false);
  assert.equal(isTelegramApp({ initData: "", platform: "unknown" } as TelegramWebApp), false);
});

test("Telegram launch parameters are supported in hash and query", () => {
  assert.equal(hasTelegramLaunch("#tgWebAppData=user%3Dtest&tgWebAppVersion=8.0", ""), true);
  assert.equal(hasTelegramLaunch("", "?tgWebAppVersion=8.0"), true);
  assert.equal(isTelegramApp({ initData: "signed-data", platform: "android" } as TelegramWebApp), true);
});
