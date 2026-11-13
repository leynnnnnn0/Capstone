import type { ReticleConfidence } from "./types";

export function v2Guidance(confidence: ReticleConfidence, wallReady: boolean, seconds: number, placing: boolean) {
  if (placing) return { title: "Placing product…", detail: "Keep the wall in view while your phone anchors the product.", ready: false };
  if (wallReady) return { title: "Ready to place", detail: "Aim at the center of the product’s spot, then tap Place product.", ready: true };

  const title = confidence === "high" ? "Aim at a vertical wall" : "Finding the wall…";
  const scanTip = seconds >= 8 ? "Aim near a wall edge or textured area for a wall fit."
    : seconds >= 4 ? "Still scanning. Move sideways slowly for a wall fit."
    : "The app will use the wall if it detects one.";
  const detail = `Tap Place product to use an estimated distance. ${scanTip}`;
  return { title, detail, ready: false };
}
