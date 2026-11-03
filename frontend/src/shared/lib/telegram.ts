export interface TelegramWebApp {
  initData: string;
  platform: string;
  ready(): void;
  expand(): void;
  BackButton: {
    show(): void;
    hide(): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
  };
}

export function isTelegramApp(app: TelegramWebApp | undefined): app is TelegramWebApp {
  return Boolean(app?.initData && app.platform && app.platform !== "unknown");
}

export function hasTelegramLaunch(hash: string, search: string): boolean {
  return [hash.replace(/^#/, ""), search.replace(/^\?/, "")].some((part) => {
    const params = new URLSearchParams(part);
    return params.has("tgWebAppData") || params.has("tgWebAppVersion");
  });
}
