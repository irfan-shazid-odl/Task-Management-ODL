// Core API client: a thin typed wrapper over fetch that targets the Express
// backend, attaches the JWT, and normalizes errors to `{ error }` messages.

export const API_BASE_URL = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || 'http://localhost:4000/api';
  try {
    const parsed = new URL(raw);
    // The backend mounts everything under /api. Tolerate env values that point
    // at the host root and normalize them to the /api base automatically.
    if (parsed.pathname === '' || parsed.pathname === '/') return `${parsed.origin}/api`;
  } catch {
    // Keep whatever value was provided if it isn't a parseable URL.
  }
  return raw;
})();

// Write payloads from the UI frequently use `field || null` for optional
// values. This mapped type mirrors an entity's fields but also permits null,
// so those payloads type-check (the backend validates + coerces).
export type ApiInput<T> = { [K in keyof T]?: T[K] | null };

const TOKEN_KEY = 'ops_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  // Set false to skip attaching the auth header (e.g. login / reset).
  auth?: boolean;
  // For non-JSON responses (file download) — returns the raw Response.
  raw?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function apiFetch<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const isForm = opts.body instanceof FormData;

  if (opts.body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

  if (opts.auth !== false) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path, opts.query), {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body === undefined ? undefined : isForm ? (opts.body as FormData) : JSON.stringify(opts.body),
    signal: opts.signal,
  });

  if (opts.raw) {
    if (!res.ok) throw new ApiError(res.status, `Request failed (${res.status})`);
    return res as unknown as T;
  }

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'error' in data && (data as { error: string }).error) ||
      `Request failed (${res.status})`;
    throw new ApiError(res.status, String(message));
  }

  return data as T;
}
