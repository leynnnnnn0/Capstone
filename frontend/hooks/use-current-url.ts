"use client";

import { usePathname } from "next/navigation";
import type { LinkProps } from "next/link";

type Href = LinkProps["href"];

type IsCurrentUrlFn = (
  urlToCheck: Href,
  currentUrl?: string,
  startsWith?: boolean,
) => boolean;

type WhenCurrentUrlFn = <TIfTrue, TIfFalse = null>(
  urlToCheck: Href,
  ifTrue: TIfTrue,
  ifFalse?: TIfFalse,
) => TIfTrue | TIfFalse;

type UseCurrentUrlReturn = {
  currentUrl: string;
  isCurrentUrl: IsCurrentUrlFn;
  isCurrentOrParentUrl: (urlToCheck: Href, currentUrl?: string) => boolean;
  whenCurrentUrl: WhenCurrentUrlFn;
};

function toUrl(url: Href): string {
  if (typeof url === "string") return url;
  return url.pathname || "/";
}

export function useCurrentUrl(): UseCurrentUrlReturn {
  const pathname = usePathname();

  const isCurrentUrl: IsCurrentUrlFn = (
    urlToCheck,
    currentUrl = pathname,
    startsWith = false,
  ) => {
    const target = toUrl(urlToCheck);

    return startsWith ? currentUrl.startsWith(target) : currentUrl === target;
  };

  const isCurrentOrParentUrl = (urlToCheck: Href, currentUrl?: string) => {
    const target = toUrl(urlToCheck).replace(/\/$/, "") || "/";
    const current = (currentUrl ?? pathname).replace(/\/$/, "") || "/";

    return current === target || (target !== "/" && current.startsWith(`${target}/`));
  };

  const whenCurrentUrl: WhenCurrentUrlFn = (
    urlToCheck,
    ifTrue,
    ifFalse = null as never,
  ) => {
    return isCurrentUrl(urlToCheck) ? ifTrue : ifFalse;
  };

  return {
    currentUrl: pathname,
    isCurrentUrl,
    isCurrentOrParentUrl,
    whenCurrentUrl,
  };
}
