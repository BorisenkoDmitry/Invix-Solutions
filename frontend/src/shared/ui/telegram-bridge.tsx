"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { usePathname, useRouter } from "next/navigation";
import { hasTelegramLaunch, isTelegramApp, type TelegramWebApp } from "@/shared/lib/telegram";

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function TelegramBridge() {
  const [launch, setLaunch] = useState(false);
  const [app, setApp] = useState<TelegramWebApp>();
  const path = usePathname();
  const router = useRouter();

  useEffect(() => {
    setLaunch(hasTelegramLaunch(location.hash, location.search));
    if (isTelegramApp(window.Telegram?.WebApp)) setApp(window.Telegram.WebApp);
  }, []);

  useEffect(() => {
    if (!isTelegramApp(app)) return;
    document.documentElement.dataset.telegram = "true";
    app.ready();
    app.expand();
    return () => { delete document.documentElement.dataset.telegram; };
  }, [app]);

  useEffect(() => {
    if (!isTelegramApp(app)) return;
    const back = () => { router.push("/"); };
    if (path === "/") app.BackButton.hide();
    else app.BackButton.show();
    app.BackButton.onClick(back);
    return () => {
      app.BackButton.offClick(back);
      app.BackButton.hide();
    };
  }, [app, path, router]);

  if (!launch) return null;
  return <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive"
    onReady={() => setApp(window.Telegram?.WebApp)} />;
}
