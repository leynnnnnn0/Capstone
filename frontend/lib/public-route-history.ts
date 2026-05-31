const STORAGE_KEY = "sog_public_route_history";

type PublicRouteHistory = {
  entries: string[];
  index: number;
};

let trackedCurrentDocument = false;

function readHistory(): PublicRouteHistory | null {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    if (!value) return null;

    const parsed = JSON.parse(value) as PublicRouteHistory;
    if (!Array.isArray(parsed.entries) || typeof parsed.index !== "number") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeHistory(history: PublicRouteHistory) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function currentPublicHref() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function trackPublicRoute(href = currentPublicHref()) {
  const sameOriginReferrer =
    document.referrer && new URL(document.referrer).origin === window.location.origin;

  if (!trackedCurrentDocument && !sameOriginReferrer) {
    trackedCurrentDocument = true;
    writeHistory({ entries: [href], index: 0 });
    return;
  }

  trackedCurrentDocument = true;
  const history = readHistory();

  if (!history) {
    writeHistory({ entries: [href], index: 0 });
    return;
  }

  if (history.entries[history.index] === href) return;

  if (history.entries[history.index - 1] === href) {
    writeHistory({ ...history, index: history.index - 1 });
    return;
  }

  if (history.entries[history.index + 1] === href) {
    writeHistory({ ...history, index: history.index + 1 });
    return;
  }

  const entries = [...history.entries.slice(0, history.index + 1), href];
  writeHistory({ entries, index: entries.length - 1 });
}

export function hasPreviousPublicRoute(href = currentPublicHref()) {
  const history = readHistory();
  return Boolean(
    history &&
      history.entries[history.index] === href &&
      history.index > 0,
  );
}
