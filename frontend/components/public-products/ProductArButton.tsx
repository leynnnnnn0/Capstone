"use client";

import type { MouseEvent } from "react";
import { useState } from "react";
import { ArrowUpRight, ScanLine, X } from "lucide-react";

import Product3DModelViewer from "@/components/products/Product3DModelViewer";
import { cn } from "@/lib/utils";

type ProductArButtonProps = {
  productId: number;
  productName: string;
  categoryName?: string;
  modelSrc?: string | null;
  defaultWidthCm?: number;
  defaultHeightCm?: number;
  defaultDepthCm?: number;
  className?: string;
};

function arUrl(productId: number, directEntry: boolean) {
  const version = process.env.NEXT_PUBLIC_AR_VERSION || "v2";
  const configured = process.env.NEXT_PUBLIC_AR_URL?.replace(/\/+$/, "");
  const base = configured
    ? configured.replace(/\/ar(?:\/v[123])?$/, "") + `/ar/${version}`
    : window.location.port === "3000"
      ? `${window.location.protocol}//${window.location.hostname}:5173/ar/${version}`
      : `/ar/${version}`;

  const params = new URLSearchParams({ product: String(productId) });
  if (directEntry) params.set("direct", "ar");

  return `${base}?${params.toString()}`;
}

async function supportsWebXrAr() {
  const xr = (navigator as Navigator & {
    xr?: { isSessionSupported?: (mode: "immersive-ar") => Promise<boolean> };
  }).xr;

  if (!window.isSecureContext || !xr?.isSessionSupported) return false;

  return xr.isSessionSupported("immersive-ar").catch(() => false);
}

function isAndroidDevice() {
  return /Android/i.test(navigator.userAgent);
}

export default function ProductArButton({
  productId,
  productName,
  categoryName,
  modelSrc,
  defaultWidthCm,
  defaultHeightCm,
  defaultDepthCm,
  className,
}: ProductArButtonProps) {
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const defaults = defaultArDimensions(
    productName,
    categoryName,
    defaultWidthCm,
    defaultHeightCm,
    defaultDepthCm,
  );

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    if (await supportsWebXrAr()) {
      window.location.assign(arUrl(productId, isAndroidDevice()));
      return;
    }

    setFallbackOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "group absolute bottom-3 right-3 z-10 inline-flex max-w-[calc(100%_-_1.5rem)] items-center gap-3 rounded-[1.15rem] border border-white/20 bg-[#10263f]/95 p-2.5 pr-3 text-white shadow-[0_16px_40px_rgba(15,35,58,0.28)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-[#193a60] hover:shadow-[0_20px_46px_rgba(15,35,58,0.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#608db9] focus-visible:ring-offset-2",
          className,
        )}
        aria-label={`View ${productName} in AR`}
        title="View in AR"
      >
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[0.8rem] bg-white/10 ring-1 ring-inset ring-white/15">
          <span className="absolute inset-x-1.5 top-1/2 h-px -translate-y-1/2 bg-[#8fc4ef]/45 transition-transform duration-300 group-hover:translate-y-1.5" />
          <ScanLine className="relative h-5 w-5 text-[#b9ddfa]" />
        </span>
        <span className="min-w-0 text-left leading-none">
          <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-white/55">
            Preview in your space
          </span>
          <span className="mt-1.5 block text-sm font-semibold tracking-[-0.01em] text-white">
            View in AR
          </span>
        </span>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-white/55 transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
      </button>

      {fallbackOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-3 sm:p-6"
          onClick={() => setFallbackOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`ar-preview-title-${productId}`}
        >
          <div
            className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:rounded-[1.75rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b px-5 py-4 sm:px-6 sm:py-5">
              <div className="min-w-0">
                <p
                  id={`ar-preview-title-${productId}`}
                  className="truncate text-base font-bold text-slate-900"
                >
                  {productName}
                </p>
                <p className="mt-1 hidden text-sm text-slate-500 sm:block">
                  Drag to rotate. Pinch or scroll to zoom.
                </p>
              </div>
              <button
                type="button"
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                onClick={() => setFallbackOpen(false)}
                aria-label="Close 3D preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <Product3DModelViewer
                src={modelSrc}
                title={productName}
                hideHeader
                ar
                arDefaultScale={1}
                arDimensionsCm={defaults}
                arFit="exact"
                className="h-full min-h-[22rem] rounded-none border-0"
                viewportClassName="h-[min(70dvh,44rem)]"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function defaultArDimensions(
  productName: string,
  categoryName?: string,
  width?: number,
  height?: number,
  depth?: number,
) {
  const searchable = `${productName} ${categoryName ?? ""}`.toLowerCase();
  const isDoor = searchable.includes("door");
  const isWindow = searchable.includes("window");
  const isCabinet =
    searchable.includes("cabinet") ||
    searchable.includes("wardrobe") ||
    searchable.includes("closet");
  const isShower = searchable.includes("shower");

  return {
    width: positiveDimension(width) ?? (isDoor ? 90 : isWindow ? 120 : isCabinet ? 120 : 100),
    height:
      positiveDimension(height) ??
      (isDoor ? 210 : isWindow ? 120 : isCabinet || isShower ? 200 : 100),
    // GLBs carry their physical depth. A category cannot distinguish a flat
    // shower screen from a corner enclosure, so never invent a depth here.
    depth: positiveDimension(depth) ?? undefined,
  };
}

function positiveDimension(value?: number) {
  return Number.isFinite(value) && Number(value) > 0 ? Number(value) : null;
}
