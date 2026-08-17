export function apiBaseUrl() {
  const env = (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env;
  const configured = env?.VITE_API_URL?.trim();
  const isLocalHost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const fallback = isLocalHost
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : window.location.origin;

  return (configured || fallback)
    .replace(/\/+$/, "")
    .replace(/\/api\/v1$/, "")
    .replace(/\/api$/, "");
}
