type SearchLike = { toString: () => string };

export function currentPathWithSearch(pathname: string, searchParams: SearchLike) {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("returnTo");

  const query = params.toString();

  return `${pathname}${query ? `?${query}` : ""}`;
}

export function withReturnTo(href: string, returnTo: string) {
  if (!returnTo) return href;

  const hashIndex = href.indexOf("#");
  const beforeHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const queryIndex = beforeHash.indexOf("?");
  const path = queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash;
  const query = queryIndex >= 0 ? beforeHash.slice(queryIndex + 1) : "";
  const params = new URLSearchParams(query);
  params.set("returnTo", returnTo);

  return `${path}?${params.toString()}${hash}`;
}

export function safeReturnTo(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;

  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    value.startsWith("/api/")
  ) {
    return fallback;
  }

  return value;
}
