export type ValidationIssue = {
  loc: (string | number)[];
  type: string;
  msg: string;
  ctx?: Record<string, unknown>;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly issues: ValidationIssue[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/${path}`, {
      ...options,
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new ApiError(
      "Нет связи с магазином. Проверьте подключение и попробуйте ещё раз.",
      0,
    );
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(
      typeof body?.detail === "string"
        ? body.detail
        : response.status === 422
          ? "Проверьте заполнение полей."
          : "Не удалось выполнить запрос. Попробуйте ещё раз.",
      response.status,
      Array.isArray(body?.detail) ? body.detail : [],
    );
  }
  return response.json();
}
