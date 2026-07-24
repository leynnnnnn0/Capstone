"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Box, LoaderCircle, RefreshCw, ScanLine } from "lucide-react";

import { cn } from "@/lib/utils";

type Product3DModelViewerProps = {
  src?: string | null;
  title?: string;
  description?: string;
  className?: string;
  viewportClassName?: string;
  compact?: boolean;
  hideHeader?: boolean;
  ar?: boolean;
  arDefaultScale?: number;
  maxWidthMeters?: number;
  maxHeightMeters?: number;
  arDimensionsCm?: {
    width: number;
    height: number;
    depth: number;
  };
  arFit?: "exact" | "contain";
};

type ModelViewerElement = HTMLElement & {
  getDimensions?: () => { x: number; y: number; z: number };
  updateFraming?: () => void;
  jumpCameraToGoal?: () => void;
};

type ModelScale = {
  x: number;
  y: number;
  z: number;
};

type ArDimensions = {
  width: number;
  height: number;
  depth: number;
};

type ArModelSource = {
  src: string;
  scale: ModelScale;
  supportsBakedScale?: boolean;
};

function uniformScale(value: number): ModelScale {
  return { x: value, y: value, z: value };
}

function scaleAttribute(scale: ModelScale) {
  return `${scale.x} ${scale.y} ${scale.z}`;
}

function modelSourceForAr(src: string, scale: ModelScale): ArModelSource {
  if (Object.values(scale).some((value) => !Number.isFinite(value) || value <= 0)) {
    return { src, scale };
  }

  const isAbsolute = /^[a-z][a-z\d+\-.]*:\/\//i.test(src);

  try {
    const url = new URL(src, "http://sog.local");

    if (!/^\/api\/v1\/product-3d-models\/\d+\/file$/.test(url.pathname)) {
      return { src, scale };
    }

    url.searchParams.delete("ar_scale");
    url.searchParams.set("ar_scale_x", String(scale.x));
    url.searchParams.set("ar_scale_y", String(scale.y));
    url.searchParams.set("ar_scale_z", String(scale.z));

    return {
      src: isAbsolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`,
      scale: uniformScale(1),
      supportsBakedScale: true,
    };
  } catch {
    return { src, scale };
  }
}

export default function Product3DModelViewer({
  src,
  title = "3D model preview",
  description = "Drag to rotate. Pinch or scroll to zoom.",
  className,
  viewportClassName,
  compact = false,
  hideHeader = false,
  ar = false,
  arDefaultScale = 0.01,
  maxWidthMeters = 0.8,
  maxHeightMeters = 1.2,
  arDimensionsCm,
  arFit = "exact",
}: Product3DModelViewerProps) {
  const [ready, setReady] = useState(false);
  const [viewerImportFailed, setViewerImportFailed] = useState(false);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const sizeRequestKey = [
    src,
    ar,
    arDefaultScale,
    arDimensionsCm?.width,
    arDimensionsCm?.height,
    arDimensionsCm?.depth,
    arFit,
  ].join("|");
  const [arSizing, setArSizing] = useState<{
    key: string;
    src: string | null;
    ready: boolean;
  }>(() => ({
    key: sizeRequestKey,
    src: null,
    ready: !arDimensionsCm,
  }));
  const sizedArSrc = arSizing.key === sizeRequestKey ? arSizing.src : null;
  const arSizeReady =
    arSizing.key === sizeRequestKey ? arSizing.ready : !arDimensionsCm;
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const modelLoadHandlerRef = useRef<() => void>(() => undefined);
  const nativeLoadListenerRef = useRef<EventListener>(() => {
    modelLoadHandlerRef.current();
  });
  const setViewerElement = useCallback((element: HTMLElement | null) => {
    const nextViewer = element as ModelViewerElement | null;

    if (viewerRef.current === nextViewer) return;

    viewerRef.current?.removeEventListener(
      "load",
      nativeLoadListenerRef.current,
    );
    viewerRef.current = nextViewer;
    viewerRef.current?.addEventListener("load", nativeLoadListenerRef.current);
  }, []);
  const sizedSourceRef = useRef<{ key: string; src: string | null }>({
    key: sizeRequestKey,
    src: null,
  });
  const loadError = viewerImportFailed || failedSrc === src;
  const defaultArScale = uniformScale(arDefaultScale);
  const arModel = src && ar ? modelSourceForAr(src, defaultArScale) : null;
  const viewerSrc = sizedArSrc ?? arModel?.src ?? src ?? undefined;
  const viewerScale = arModel?.scale ?? defaultArScale;
  const sizingConfigRef = useRef<{
    key: string;
    src?: string | null;
    ar: boolean;
    arDimensionsCm?: ArDimensions;
    arFit: "exact" | "contain";
    arDefaultScale: number;
    arModel: ArModelSource | null;
    maxWidthMeters: number;
    maxHeightMeters: number;
  }>({
    key: sizeRequestKey,
    src,
    ar,
    arDimensionsCm,
    arFit,
    arDefaultScale,
    arModel,
    maxWidthMeters,
    maxHeightMeters,
  });
  useEffect(() => {
    let mounted = true;

    import("@google/model-viewer")
      .then(() => {
        if (mounted) setReady(true);
      })
      .catch(() => {
        if (mounted) setViewerImportFailed(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (
      arSizing.key !== sizeRequestKey ||
      !arSizing.src ||
      arSizing.ready
    ) {
      return;
    }

    const fallback = window.setTimeout(() => {
      setArSizing((current) =>
        current.key === sizeRequestKey && current.src && !current.ready
          ? { ...current, ready: true }
          : current,
      );
    }, 4000);

    return () => window.clearTimeout(fallback);
  }, [arSizing.key, arSizing.ready, arSizing.src, sizeRequestKey]);

  function fitModelToRealWorldSize() {
    const viewer = viewerRef.current;
    const dimensions = viewer?.getDimensions?.();
    const config = sizingConfigRef.current;
    const currentSizedSrc =
      sizedSourceRef.current.key === config.key
        ? sizedSourceRef.current.src
        : null;

    if (!viewer || !dimensions) return;

    if (
      config.src &&
      config.ar &&
      config.arDimensionsCm &&
      config.arModel?.supportsBakedScale &&
      !currentSizedSrc
    ) {
      const target = {
        x: config.arDimensionsCm.width / 100,
        y: config.arDimensionsCm.height / 100,
        z: config.arDimensionsCm.depth / 100,
      };
      const ratios = {
        x: target.x / Math.max(dimensions.x, 0.0001),
        y: target.y / Math.max(dimensions.y, 0.0001),
        z: target.z / Math.max(dimensions.z, 0.0001),
      };
      const fittedRatios =
        config.arFit === "contain"
          ? uniformScale(Math.min(ratios.x, ratios.y, ratios.z))
          : ratios;
      const sizedScale = {
        x: config.arDefaultScale * fittedRatios.x,
        y: config.arDefaultScale * fittedRatios.y,
        z: config.arDefaultScale * fittedRatios.z,
      };
      const nextArModel = modelSourceForAr(config.src, sizedScale);

      if (nextArModel.supportsBakedScale) {
        sizedSourceRef.current = {
          key: config.key,
          src: nextArModel.src,
        };
        setArSizing({
          key: config.key,
          src: nextArModel.src,
          ready: false,
        });
        return;
      }
    }

    if (config.ar) {
      viewer.setAttribute(
        "scale",
        scaleAttribute(config.arModel?.scale ?? uniformScale(config.arDefaultScale)),
      );
      viewer.updateFraming?.();
      viewer.jumpCameraToGoal?.();
      setArSizing({
        key: config.key,
        src: currentSizedSrc,
        ready: true,
      });
      return;
    }

    const width = Math.max(dimensions.x, dimensions.z);
    const height = dimensions.y;
    const widthScale =
      width > 0 ? config.maxWidthMeters / width : Number.POSITIVE_INFINITY;
    const heightScale =
      height > 0 ? config.maxHeightMeters / height : Number.POSITIVE_INFINITY;
    const scale = Math.min(widthScale, heightScale, 1);

    if (!Number.isFinite(scale) || scale <= 0) return;

    viewer.setAttribute("scale", `${scale} ${scale} ${scale}`);
    viewer.updateFraming?.();
    viewer.jumpCameraToGoal?.();
  }

  useLayoutEffect(() => {
    sizingConfigRef.current = {
      key: sizeRequestKey,
      src,
      ar,
      arDimensionsCm,
      arFit,
      arDefaultScale,
      arModel,
      maxWidthMeters,
      maxHeightMeters,
    };
    modelLoadHandlerRef.current = fitModelToRealWorldSize;
  });

  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-dashed bg-muted/30 text-center",
          compact ? "h-44" : "h-72",
          className,
        )}
      >
        <div className="space-y-2 px-4">
          <Box className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">No 3D model selected</p>
          <p className="text-xs text-muted-foreground">Upload a GLB or GLTF file to preview it here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border bg-muted/20", className)}>
      {!hideHeader && (
        <div className="border-b px-3 py-2">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      )}
      <div className={cn(compact ? "h-48" : "h-80", viewportClassName)}>
        {loadError ? (
          <div className="flex h-full items-center justify-center bg-slate-50 px-6 text-center">
            <div>
              <Box className="mx-auto h-7 w-7 text-slate-400" />
              <p className="mt-3 text-sm font-semibold text-slate-700">
                3D preview unavailable
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                The model could not be loaded. Check your connection and try again.
              </p>
              {!viewerImportFailed && (
                <button
                  type="button"
                  onClick={() => setFailedSrc(null)}
                  className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Try again
                </button>
              )}
            </div>
          </div>
        ) : ready ? (
          <model-viewer
            ref={setViewerElement}
            src={viewerSrc}
            alt={title}
            ar={ar}
            ar-modes={ar ? "webxr scene-viewer quick-look" : undefined}
            ar-scale={ar ? "auto" : undefined}
            scale={ar ? scaleAttribute(viewerScale) : undefined}
            camera-controls
            auto-rotate={false}
            shadow-intensity="0.85"
            environment-image="neutral"
            exposure="0.95"
            interaction-prompt="auto"
            onError={() => setFailedSrc(src)}
            className="h-full w-full bg-gradient-to-b from-slate-50 to-slate-100"
          >
            {ar && (
              <button
                slot="ar-button"
                type="button"
                disabled={!arSizeReady}
                className="m-4 inline-flex items-center gap-2 rounded-full bg-[#10263f] px-4 py-3 text-xs font-bold text-white shadow-lg transition hover:bg-[#193a60] disabled:cursor-wait disabled:bg-slate-500"
              >
                {arSizeReady ? (
                  <ScanLine className="h-4 w-4" />
                ) : (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                )}
                {arSizeReady ? "View in your space" : "Preparing real-world size"}
              </button>
            )}
          </model-viewer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading 3D viewer...
          </div>
        )}
      </div>
    </div>
  );
}
