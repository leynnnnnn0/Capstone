import type * as THREE from "three";

export type ObjectType = "door" | "window" | "cabinet" | "shower" | "other";

export type ReticleConfidence = "none" | "weak" | "medium" | "high";

export interface MeasurementPoint {
  id: number;
  position: THREE.Vector3;
  marker: THREE.Group;
}

export interface MeasurementSegment {
  line: THREE.Object3D;
  label: THREE.Sprite | null;
}

export interface MeasurementDimensions {
  segmentsCm: number[];
  heightCm: number;
}

export interface MeasuredObject {
  id: number;
  type: ObjectType;
  points: MeasurementPoint[];
  segments: MeasurementSegment[];
  dimensions: MeasurementDimensions;
  label: THREE.Sprite;
  model: THREE.Object3D;
}

export interface ObjectTypeDefinition {
  label: string;
  shortLabel: string;
  color: string;
  hex: number;
}
