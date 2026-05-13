const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type ApiOptions = RequestInit & { skipAuth?: boolean };

export type ApiValidationErrors = Record<string, string[] | string>;

export class ApiError extends Error {
  status: number;
  errors?: ApiValidationErrors;

  constructor(message: string, status: number, errors?: ApiValidationErrors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export async function api<T = unknown>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const { skipAuth, ...requestOptions } = options;
  const isFormData =
    typeof FormData !== "undefined" && requestOptions.body instanceof FormData;

  const res = await fetch(`${BASE}${endpoint}`, {
    ...requestOptions,
    credentials: "include", // CRITICAL: sends the httpOnly cookie
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      Accept: "application/json",
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });

  if (res.status === 401 && !skipAuth) {
    // Token expired or invalid — redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthenticated");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new ApiError(error.message ?? "API error", res.status, error.errors);
  }

  return res.json();
}
