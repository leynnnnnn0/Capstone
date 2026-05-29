"use client";

import type { MouseEvent } from "react";
import { useState } from "react";
import { Box, X } from "lucide-react";

import Product3DModelViewer from "@/components/products/Product3DModelViewer";

type ProductArButtonProps = {
  productId: number;
  productName: string;
  modelSrc?: string | null;
  className?: string;
};

function arUrl(productId: number) {
  const configured = process.env.NEXT_PUBLIC_AR_URL?.replace(/\/+$/, "");
  const base =
    configured ||
    (window.location.port === "3000"
      ? `${window.location.protocol}//${window.location.hostname}:5173/ar/v3`
      : "/ar/v3");

  return `${base}?product=${productId}`;
}

async function supportsWebXrAr() {
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
        className={
          className ??
          "absolute bottom-3 right-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-primary/90"
        }
        aria-label={`View ${productName} in AR`}
        title="View in AR"
      >
        <Box className="h-5 w-5" />
      </button>

      {fallbackOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setFallbackOpen(false)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <p className="text-sm font-bold text-slate-900">{productName}</p>
                <p className="text-xs text-slate-500">
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
            />
          </div>
        </div>
      )}
    </>
  );
}
