"use client";

import type { MouseEvent } from "react";
import { useState } from "react";
import { ArrowUpRight, ScanLine, X } from "lucide-react";

import Product3DModelViewer from "@/components/products/Product3DModelViewer";
import { cn } from "@/lib/utils";

type ProductArButtonProps = {
  productId: number;
  productName: string;
  modelSrc?: string | null;
  className?: string;
};

function arUrl(productId: number) {
  // Product cards can launch whatever AR version is configured in .env. During
  // local development the AR Vite app usually runs on :5173, while hosted builds
  // can serve the AR route from the same domain.
  const version = process.env.NEXT_PUBLIC_AR_VERSION || "v2";
  const configured = process.env.NEXT_PUBLIC_AR_URL?.replace(/\/+$/, "");
  const base = configured
    ? configured.replace(/\/ar(?:\/v[123])?$/, "") + `/ar/${version}`
    : window.location.port === "3000"
      ? `${window.location.protocol}//${window.location.hostname}:5173/ar/${version}`
      : `/ar/${version}`;

  return `${base}?product=${productId}`;
}

async function supportsWebXrAr() {
  // Full multi-item AR requires WebXR immersive-ar. iOS/Safari may still support
  // model-viewer AR, so unsupported devices fall back to the 3D viewer modal.
  const xr = (navigator as Navigator & {
    xr?: { isSessionSupported?: (mode: "immersive-ar") => Promise<boolean> };
  }).xr;

  if (!window.isSecureContext || !xr?.isSessionSupported) return false;

  return xr.isSessionSupported("immersive-ar").catch(() => false);
}

export default function ProductArButton({
  productId,
  productName,
  modelSrc,
  className,
}: ProductArButtonProps) {
  const [fallbackOpen, setFallbackOpen] = useState(false);

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    // Supported devices go to our multi-item AR page. Other devices stay on the
    // product page and open model-viewer so the user still sees the 3D model.
    if (await supportsWebXrAr()) {
      window.location.href = arUrl(productId);
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
        >
          <div
            className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:rounded-[1.75rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b px-5 py-4 sm:px-6 sm:py-5">
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-slate-900">
                  {productName}
                </p>
                <p className="mt-1 hidden text-sm text-slate-500 sm:block">
                  Use the AR button in the viewer if your device supports native AR.
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
            <Product3DModelViewer
              src={modelSrc}
              title={productName}
              description="Rotate and zoom the model before opening full AR on a supported device."
              hideHeader
              ar
              className="rounded-none border-0"
              viewportClassName="h-[min(64dvh,32rem)] sm:h-[min(70dvh,40rem)]"
            />
          </div>
        </div>
      )}
    </>
  );
}
