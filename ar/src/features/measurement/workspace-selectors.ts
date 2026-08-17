import type { ModelDefinition } from "./model-catalog";
import type { CapturePhase, V2Mode } from "./workspace-types";
import type { ReticleConfidence } from "./types";

export function relatedCatalogModels(
  catalog: ModelDefinition[],
  selectedModel: ModelDefinition,
  detailModel: ModelDefinition | null,
) {
  const activeModel = detailModel ?? selectedModel;
  const related = catalog.filter(
    (model) =>
      model.id !== activeModel.id &&
      (model.category === activeModel.category || model.type === activeModel.type),
  );

  return (related.length
    ? related
    : catalog.filter((model) => model.id !== activeModel.id)
  ).slice(0, 4);
}

export function selectedById<T extends { id: number }>(
  items: T[],
  selectedId: number | null,
) {
  return items.find((item) => item.id === selectedId) ?? null;
}

interface ArCopyContext {
  capturePhase: CapturePhase;
  confidence: ReticleConfidence;
  isPlacementFlow: boolean;
  isV2: boolean;
  isV3: boolean;
  mode: V2Mode;
}

export function confidenceInstruction({
  capturePhase,
  confidence,
  isPlacementFlow,
  isV2,
  isV3,
  mode,
}: ArCopyContext) {
  if (isV2 && mode === "scanWall") {
    if (confidence === "high") {
      return "Wall ready. Tap the green circle or Lock wall.";
    }
    return confidence === "none"
      ? "Point at the wall, then move your phone slowly."
      : "Keep moving slowly. Wait for the circle to turn green.";
  }
  if (isV2 && mode === "place") {
    return confidence === "high"
      ? "Ready. Tap the green circle to place the product."
      : "Point where the product should go. Wait for green.";
  }
  if (isV3 && mode === "place") {
    return confidence === "high"
      ? "Ready. Tap the green circle to place the product."
      : "Move slowly over the wall or floor. Wait for green.";
  }
  if (isPlacementFlow && mode === "edit") {
    return "Pinch to resize, or tap another surface to reposition.";
  }
  if (capturePhase === "height") {
    return "Tap the top edge to capture the product height.";
  }
  if (confidence === "high") {
    return "Ready. Tap the green circle to place a point.";
  }
  if (confidence === "medium" || confidence === "weak") {
    return "Keep moving slowly. Wait for the circle to turn green.";
  }
  return "Point at the wall or floor and move your phone slowly.";
}

export function arStageName({
  capturePhase,
  isPlacementFlow,
  isV2,
  mode,
}: Pick<
  ArCopyContext,
  "capturePhase" | "isPlacementFlow" | "isV2" | "mode"
>) {
  if (isV2 && mode === "scanWall") return "Step 1 · Scan wall";
  if (isPlacementFlow && mode === "place") return "Step 2 · Place product";
  if (isPlacementFlow && mode === "edit") return "Adjust product";
  if (capturePhase === "height") return "Height capture";
  return "Surface scan";
}

export function primaryArAction({
  capturePhase,
  confidence,
  isPlacementFlow,
  isV3,
  mode,
  wallLocked,
}: Pick<
  ArCopyContext,
  "capturePhase" | "confidence" | "isPlacementFlow" | "isV3" | "mode"
> & { wallLocked: boolean }) {
  if (!isPlacementFlow) return capturePhase === "height" ? "Set height" : "Finish";
  if (mode === "edit") return "Another";
  if (isV3) return confidence === "high" ? "Place" : "Scanning";
  if (wallLocked) return "Rescan";
  return "Lock wall";
}
