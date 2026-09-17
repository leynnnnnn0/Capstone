import type { ReticleConfidence } from "./types";
import type { V2Mode } from "./workspace-types";

export function v2Guidance(mode: V2Mode, confidence: ReticleConfidence, wallEligible: boolean, seconds: number, placing: boolean) {
  if (placing) return { title: "Placing product…", detail: "Keep the wall in view while your phone anchors the product.", ready: false };
  const ready = confidence === "high" && (mode !== "scanWall" || wallEligible);
  const title = ready
    ? mode === "scanWall" ? "Wall ready to lock" : "Ready to place"
    : mode === "scanWall" && confidence !== "none" && !wallEligible ? "Aim at a vertical wall"
    : confidence === "none" ? "Looking for a surface…" : "Surface found · stabilizing…";
  const detail = ready
    ? mode === "scanWall" ? "Tap Lock wall below to continue." : "Aim at the spot on your wall, then tap Place product."
    : seconds >= 8 ? "Try a wall edge or textured area in good light. Plain or reflective surfaces can be harder to detect."
    : seconds >= 4 ? "Still scanning. Move a little sideways while keeping the wall in view."
    : "Move your phone slowly side to side. Keep the wall in view.";
  return { title, detail, ready };
}
