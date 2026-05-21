"use client";

import { createElement, useEffect, useState } from "react";
import { Box } from "lucide-react";

import { cn } from "@/lib/utils";

type Product3DModelViewerProps = {
  src?: string | null;
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
};

export default function Product3DModelViewer({
  src,
  title = "3D model preview",
  description = "Drag to rotate. Pinch or scroll to zoom.",
  className,
  compact = false,
}: Product3DModelViewerProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    import("@google/model-viewer").then(() => {
      if (mounted) setReady(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

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
      <div className="border-b px-3 py-2">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className={compact ? "h-48" : "h-80"}>
        {ready ? (
          createElement("model-viewer", {
            src,
            alt: title,
            "camera-controls": true,
            "auto-rotate": true,
            "shadow-intensity": "0.85",
            "environment-image": "neutral",
            exposure: "0.95",
            "interaction-prompt": "auto",
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
