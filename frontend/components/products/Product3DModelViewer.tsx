"use client";

import { createElement, useEffect, useRef, useState } from "react";
import { Box } from "lucide-react";

import { cn } from "@/lib/utils";

type Product3DModelViewerProps = {
  src?: string | null;
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
  hideHeader?: boolean;
  ar?: boolean;
  maxWidthMeters?: number;
  maxHeightMeters?: number;
};

type ModelViewerElement = HTMLElement & {
  getDimensions?: () => { x: number; y: number; z: number };
  updateFraming?: () => void;
};

export default function Product3DModelViewer({
  src,
  title = "3D model preview",
  description = "Drag to rotate. Pinch or scroll to zoom.",
  className,
  compact = false,
  hideHeader = false,
  ar = false,
  maxWidthMeters = 0.8,
  maxHeightMeters = 1.2,
}: Product3DModelViewerProps) {
  const [ready, setReady] = useState(false);
  const viewerRef = useRef<ModelViewerElement | null>(null);

  useEffect(() => {
    let mounted = true;

    import("@google/model-viewer").then(() => {
      if (mounted) setReady(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

  function fitModelToRealWorldSize() {
    const viewer = viewerRef.current;
    const dimensions = viewer?.getDimensions?.();

    if (!viewer || !dimensions) return;

    const width = Math.max(dimensions.x, dimensions.z);
    const height = dimensions.y;
    const widthScale = width > 0 ? maxWidthMeters / width : Number.POSITIVE_INFINITY;
    const heightScale = height > 0 ? maxHeightMeters / height : Number.POSITIVE_INFINITY;
    const scale = Math.min(widthScale, heightScale, 1);

    if (!Number.isFinite(scale) || scale <= 0) return;

    viewer.setAttribute("scale", `${scale} ${scale} ${scale}`);
    viewer.updateFraming?.();
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
      <div className={compact ? "h-48" : "h-80"}>
        {ready ? (
          createElement("model-viewer", {
            ref: viewerRef,
            src,
            alt: title,
            ar,
            ...(ar
                ? {
                    "ar-modes": "webxr scene-viewer quick-look",
                    "ar-scale": "auto",
                  }
                : {}),
            "camera-controls": true,
            "auto-rotate": false,
            "camera-orbit": "0deg 75deg 2.5m",
            "camera-target": "0m 0m 0m",
            "field-of-view": "30deg",
            "shadow-intensity": "0.85",
            "environment-image": "neutral",
            exposure: "0.95",
            "interaction-prompt": "auto",
            onLoad: fitModelToRealWorldSize,
            className: "h-full w-full bg-gradient-to-b from-slate-50 to-slate-100",
          })
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading 3D viewer...
          </div>
        )}
      </div>
    </div>
  );
}
