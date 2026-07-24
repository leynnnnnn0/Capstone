"use client";

import { useId, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  RotateCcw,
  Ruler,
  ScanLine,
  X,
} from "lucide-react";

import NumericInput from "@/components/form/NumericInput";
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

type ArDimensions = {
  width: string;
  height: string;
  depth: string;
};

type ArFit = "exact" | "contain";

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
  const fitSelectId = useId();
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const defaults = defaultArDimensions(
    productName,
    categoryName,
    defaultWidthCm,
    defaultHeightCm,
    defaultDepthCm,
  );
  const [draftDimensions, setDraftDimensions] = useState<ArDimensions>(() =>
    dimensionsToStrings(defaults),
  );
  const [appliedDimensions, setAppliedDimensions] = useState(defaults);
  const [fit, setFit] = useState<ArFit>("exact");
  const [appliedFit, setAppliedFit] = useState<ArFit>("exact");
  const parsedDraft = parseDimensions(draftDimensions);
  const dimensionsValid = parsedDraft !== null;
  const dimensionsDirty =
    !parsedDraft ||
    parsedDraft.width !== appliedDimensions.width ||
    parsedDraft.height !== appliedDimensions.height ||
    parsedDraft.depth !== appliedDimensions.depth ||
    fit !== appliedFit;

  function applyDimensions() {
    if (!parsedDraft) return;

    setAppliedDimensions(parsedDraft);
    setAppliedFit(fit);
  }

  function resetDimensions() {
    setDraftDimensions(dimensionsToStrings(defaults));
    setAppliedDimensions(defaults);
    setFit("exact");
    setAppliedFit("exact");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setFallbackOpen(true)}
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
          aria-labelledby={`ar-size-title-${productId}`}
        >
          <div
            className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:rounded-[1.75rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b px-5 py-4 sm:px-6 sm:py-5">
              <div className="min-w-0">
                <p
                  id={`ar-size-title-${productId}`}
                  className="truncate text-base font-bold text-slate-900"
                >
                  {productName}
                </p>
                <p className="mt-1 hidden text-sm text-slate-500 sm:block">
                  Set the finished size, then place it in your space.
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
            <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[19rem_minmax(0,1fr)] lg:overflow-hidden">
              <aside className="border-b border-slate-200 bg-white p-4 sm:p-5 lg:overflow-y-auto lg:border-b-0 lg:border-r">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf2f8] text-[#2c5282]">
                    <Ruler className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Real-world size</p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">
                      Enter the finished outside dimensions in centimeters.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 lg:grid-cols-1">
                  <DimensionInput
                    label="Width"
                    value={draftDimensions.width}
                    onChange={(width) =>
                      setDraftDimensions((current) => ({ ...current, width }))
                    }
                  />
                  <DimensionInput
                    label="Height"
                    value={draftDimensions.height}
                    onChange={(height) =>
                      setDraftDimensions((current) => ({ ...current, height }))
                    }
                  />
                  <DimensionInput
                    label="Depth"
                    value={draftDimensions.depth}
                    onChange={(depth) =>
                      setDraftDimensions((current) => ({ ...current, depth }))
                    }
                  />
                </div>

                {!dimensionsValid && (
                  <p className="mt-2 text-xs font-medium text-red-600">
                    Use values from 1 to 1,000 cm.
                  </p>
                )}

                <details className="group mt-4 rounded-xl border border-slate-200 bg-slate-50/70">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-3 text-xs font-bold text-slate-700">
                    Advanced sizing
                    <ChevronDown className="h-4 w-4 text-slate-400 transition group-open:rotate-180" />
                  </summary>
                  <div className="border-t border-slate-200 px-3 py-3">
                    <label
                      htmlFor={fitSelectId}
                      className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500"
                    >
                      Model fit
                    </label>
                    <select
                      id={fitSelectId}
                      value={fit}
                      onChange={(event) => setFit(event.target.value as ArFit)}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#608db9] focus:ring-2 focus:ring-[#608db9]/20"
                    >
                      <option value="exact">Exact width, height and depth</option>
                      <option value="contain">Preserve model proportions</option>
                    </select>
                    <p className="mt-2 text-[11px] leading-4 text-slate-500">
                      Preserve proportions fits the model inside your measurements
                      without stretching its shape.
                    </p>
                  </div>
                </details>

                <button
                  type="button"
                  onClick={applyDimensions}
                  disabled={!dimensionsValid || !dimensionsDirty}
                  className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#10263f] px-4 text-xs font-bold text-white transition hover:bg-[#193a60] disabled:cursor-default disabled:bg-slate-200 disabled:text-slate-500"
                >
                  {dimensionsDirty ? (
                    <Ruler className="h-4 w-4" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {dimensionsDirty ? "Apply dimensions" : "Size applied"}
                </button>
                <button
                  type="button"
                  onClick={resetDimensions}
                  className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset recommended size
                </button>

                <div className="mt-4 rounded-xl bg-[#eaf2f8] px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#608db9]">
                    AR will render
                  </p>
                  <p className="mt-1 text-sm font-extrabold text-[#10263f]">
                    {formatDimension(appliedDimensions.width)} ×{" "}
                    {formatDimension(appliedDimensions.height)} ×{" "}
                    {formatDimension(appliedDimensions.depth)} cm
                  </p>
                </div>
              </aside>

              <Product3DModelViewer
                src={modelSrc}
                title={productName}
                description="Rotate and zoom the model before opening full AR on a supported device."
                hideHeader
                ar
                arDimensionsCm={appliedDimensions}
                arFit={appliedFit}
                className="min-h-[22rem] rounded-none border-0"
                viewportClassName="h-[min(52dvh,34rem)] lg:h-[min(70dvh,40rem)]"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DimensionInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <span className="relative block">
        <NumericInput
          value={value}
          decimalScale={1}
          onValueChange={onChange}
          aria-label={`${label} in centimeters`}
          className="h-11 rounded-xl border-slate-200 bg-white pr-9 text-sm font-bold text-slate-800"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] font-bold text-slate-400">
          cm
        </span>
      </span>
    </label>
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
    depth:
      positiveDimension(depth) ??
      (isCabinet ? 55 : isShower ? 90 : isDoor || isWindow ? 10 : 50),
  };
}

function positiveDimension(value?: number) {
  return Number.isFinite(value) && Number(value) > 0 ? Number(value) : null;
}

function dimensionsToStrings(dimensions: {
  width: number;
  height: number;
  depth: number;
}): ArDimensions {
  return {
    width: String(dimensions.width),
    height: String(dimensions.height),
    depth: String(dimensions.depth),
  };
}

function parseDimensions(dimensions: ArDimensions) {
  const parsed = {
    width: Number(dimensions.width),
    height: Number(dimensions.height),
    depth: Number(dimensions.depth),
  };

  return Object.values(parsed).every(
    (value) => Number.isFinite(value) && value >= 1 && value <= 1000,
  )
    ? parsed
    : null;
}

function formatDimension(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
