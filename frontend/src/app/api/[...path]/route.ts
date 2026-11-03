import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
export const dynamic = "force-dynamic";
async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const path = (await context.params).path.join("/");
  const allowed =
    request.method === "GET"
      ? /^(cart|orders|orders\/[0-9a-f-]{36}|media\/[a-zA-Z0-9.-]+)$/.test(path)
      : request.method === "PUT"
        ? /^cart\/items\/[0-9a-f-]{36}$/.test(path)
        : request.method === "POST" && path === "orders";
  if (!allowed)
    return NextResponse.json({ detail: "Маршрут не найден" }, { status: 404 });
  if (request.method !== "GET") {
    const origin = request.headers.get("origin");
    const expected = `${request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "")}://${request.headers.get("host")}`;
    if (!origin || origin !== expected)
      return NextResponse.json(
        { detail: "Недопустимый источник запроса" },
        { status: 403 },
      );
  }
  const isMedia = path.startsWith("media/");
  const existing = request.cookies.get("shop_session")?.value;
  const token =
    existing && /^[A-Za-z0-9_-]{43}$/.test(existing)
      ? existing
      : randomBytes(32).toString("base64url");
  const headers: Record<string, string> = { "X-Cart-Token": token };
  if (request.method !== "GET") headers["Content-Type"] = "application/json";
  const key = request.headers.get("idempotency-key");
  if (key) headers["Idempotency-Key"] = key;
  try {
    let body: string | undefined;
    if (request.method !== "GET") {
      body = await request.text();
      if (body.length > 10000)
        return NextResponse.json(
          { detail: "Слишком большой запрос" },
          { status: 413 },
        );
    }
    const target = new URL(
      `${process.env.API_URL || "http://localhost:8000"}/v1/${path}`,
    );
    if (request.method === "GET" && path === "orders") {
      for (const key of ["limit", "offset"]) {
        const value = request.nextUrl.searchParams.get(key);
        if (value !== null) target.searchParams.set(key, value);
      }
    }
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    const response = new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") || "application/json",
        "Cache-Control": isMedia ? "public, max-age=86400" : "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
    if (!isMedia && token !== existing)
      response.cookies.set("shop_session", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.COOKIE_SECURE === "true",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    return response;
  } catch {
    return NextResponse.json(
      { detail: "Сервис временно недоступен. Попробуйте ещё раз." },
      { status: 503 },
    );
  }
}
export { proxy as GET, proxy as PUT, proxy as POST };
