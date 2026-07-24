"use client";

import { useEffect, useRef, useState } from "react";
import { Box, RefreshCw } from "lucide-react";

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
};

type ModelViewerElement = HTMLElement & {
  getDimensions?: () => { x: number; y: number; z: number };
  updateFraming?: () => void;
  jumpCameraToGoal?: () => void;
};

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
}: Product3DModelViewerProps) {
  const [ready, setReady] = useState(false);
  const [viewerImportFailed, setViewerImportFailed] = useState(false);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const loadError = viewerImportFailed || failedSrc === src;

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

  function fitModelToRealWorldSize() {
    const viewer = viewerRef.current;
    const dimensions = viewer?.getDimensions?.();

    if (!viewer || !dimensions) return;

    if (ar && arDefaultScale > 0) {
      viewer.setAttribute("scale", `${arDefaultScale} ${arDefaultScale} ${arDefaultScale}`);
      viewer.updateFraming?.();
      viewer.jumpCameraToGoal?.();
      return;
    }

    const width = Math.max(dimensions.x, dimensions.z);
    const height = dimensions.y;
    const widthScale = width > 0 ? maxWidthMeters / width : Number.POSITIVE_INFINITY;
    const heightScale = height > 0 ? maxHeightMeters / height : Number.POSITIVE_INFINITY;
    const scale = Math.min(widthScale, heightScale, 1);

    if (!Number.isFinite(scale) || scale <= 0) return;

    viewer.setAttribute("scale", `${scale} ${scale} ${scale}`);
    viewer.updateFraming?.();
    viewer.jumpCameraToGoal?.();
  }

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
            ref={(element: HTMLElement | null) => {
              viewerRef.current = element as ModelViewerElement | null;
            }}
            src={src}
            alt={title}
            ar={ar}
            ar-modes={ar ? "webxr scene-viewer quick-look" : undefined}
            ar-scale={ar ? "auto" : undefined}
            scale={
              ar
                ? `${arDefaultScale} ${arDefaultScale} ${arDefaultScale}`
                : undefined
            }
            camera-controls
            auto-rotate={false}
            shadow-intensity="0.85"
            environment-image="neutral"
            exposure="0.95"
            interaction-prompt="auto"
            onLoad={fitModelToRealWorldSize}
            onError={() => setFailedSrc(src)}
            className="h-full w-full bg-gradient-to-b from-slate-50 to-slate-100"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading 3D viewer...
          </div>
        )}
      </div>
    </div>
  );
}
