import * as THREE from "three";

import type { ModelDefinition } from "./model-catalog";
import type {
  MeasurementDimensions,
  ReticleConfidence,
} from "./types";
import type { MeasurementPlane } from "./snapping";

export const VERSION = "react-vite-tier1-2026-05-17";
export const PREVIEW_MODEL_DEPTH_METERS = 0.012;
export const V2_DEFAULT_WIDTH_CM = 120;
export const V2_DEFAULT_HEIGHT_CM = 210;
export const V2_DEFAULT_DEPTH_CM = 12;
export const V2_NUDGE_METERS = 0.05;
export const V2_ROTATE_RADIANS = THREE.MathUtils.degToRad(7.5);
export const V2_MAX_WALL_NORMAL_Y = 0.18;
export const SAVED_AR_QUOTE_KEY = "sog-ar-saved-quote";
export const SURFACE_SAMPLE_LIMIT = 24;
export const SURFACE_READY_SAMPLE_COUNT = 18;
export const SURFACE_READY_JITTER_METERS = 0.025;
export const SURFACE_READY_NORMAL_SPREAD_RADIANS =
  THREE.MathUtils.degToRad(7);

export type CapturePhase = "shape" | "height";
export type FlowVersion = "v1" | "v2" | "v3";
export type V2Mode = "scanWall" | "place" | "edit";
export type AnchorTrackingState =
  | "idle"
  | "anchored"
  | "recovering"
  | "unavailable";

export type XRAnchorLike = {
  anchorSpace: XRSpace;
  delete?: () => void;
};

export type XRHitTestResultWithAnchor = XRHitTestResult & {
  createAnchor?: () => Promise<XRAnchorLike>;
};

export interface ArQuoteTransferItem {
  productId: number;
  modelId: string;
  label: string;
  description: string;
  segmentsCm: number[];
  widthCm: number;
  heightCm: number;
  price?: number | null;
}

export interface ArQuoteTransferPayload {
  source: "sog-ar";
  version: 1;
  createdAt: string;
  items: ArQuoteTransferItem[];
}

export interface SummaryQuoteItem {
  id: number;
  label: string;
  description: string;
  dimensionsText: string;
  price: number | null;
}

export interface V2PlacedObject {
  id: number;
  type: ModelDefinition["type"];
  modelId: string;
  captureConfidence: ReticleConfidence;
  root: THREE.Group;
  model: THREE.Object3D;
  label: THREE.Sprite;
  anchor: THREE.Vector3;
  anchorOffset: THREE.Vector3;
  xrAnchor: XRAnchorLike | null;
  anchorRelativeMatrix: THREE.Matrix4 | null;
  lastAnchorPoseMatrix: THREE.Matrix4 | null;
  missedAnchorPoseFrames: number;
  widthDir: THREE.Vector3;
  heightDir: THREE.Vector3;
  depthDir: THREE.Vector3;
  dimensions: MeasurementDimensions & { depthCm: number };
}

export interface SurfaceSample {
  kind: MeasurementPlane["kind"];
  normal: THREE.Vector3;
  position: THREE.Vector3;
  quality: MeasurementPlane["quality"];
}

export interface StabilizedSurface {
  confidence: ReticleConfidence;
  normal: THREE.Vector3;
  position: THREE.Vector3;
  quality: MeasurementPlane["quality"];
}

export interface V2PlacementAxes {
  widthDir: THREE.Vector3;
  heightDir: THREE.Vector3;
  depthDir: THREE.Vector3;
}

export interface ModelFrame {
  center: THREE.Vector3;
  widthDir: THREE.Vector3;
  heightDir: THREE.Vector3;
  depthDir: THREE.Vector3;
  width: number;
  height: number;
  depth: number;
}

export type MeasurementSaveState =
  | { phase: "idle" }
  | { phase: "saving" }
  | { phase: "saved"; reference: string; fingerprint: string }
  | { phase: "error"; message: string };

export type QuoteDraftSaveState =
  | { phase: "idle" }
  | { phase: "saved"; itemCount: number }
  | { phase: "error"; message: string };
