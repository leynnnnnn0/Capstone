import * as THREE from "three";

import type { ModelDefinition } from "./model-catalog";
import type { MeasurementPlane } from "./snapping";
import type { ReticleConfidence } from "./types";
import {
  SURFACE_READY_JITTER_METERS,
  SURFACE_READY_NORMAL_SPREAD_RADIANS,
  SURFACE_READY_SAMPLE_COUNT,
  SURFACE_SAMPLE_LIMIT,
  V2_DEFAULT_DEPTH_CM,
  V2_DEFAULT_HEIGHT_CM,
  V2_DEFAULT_WIDTH_CM,
  V2_MAX_WALL_NORMAL_Y,
  type StabilizedSurface,
  type SurfaceSample,
  type V2PlacedObject,
  type XRHitTestResultWithAnchor,
} from "./workspace-types";

export function appendSurfaceSample(
  samples: SurfaceSample[],
  sample: SurfaceSample,
) {
  const previous = samples.at(-1);
  const changedSurface =
    previous &&
    (previous.kind !== sample.kind ||
      previous.position.distanceTo(sample.position) > 0.35 ||
      Math.abs(previous.normal.dot(sample.normal)) < 0.7);
  const nextSamples = changedSurface ? [sample] : [...samples, sample];

  return nextSamples.slice(-SURFACE_SAMPLE_LIMIT);
}

export function stabilizeSurface(
  samples: SurfaceSample[],
): StabilizedSurface {
  const latest = samples.at(-1);

  if (!latest) {
    return {
      confidence: "none",
      normal: new THREE.Vector3(0, 1, 0),
      position: new THREE.Vector3(),
      quality: "slanted",
    };
  }

  const position = new THREE.Vector3(
    median(samples.map((sample) => sample.position.x)),
    median(samples.map((sample) => sample.position.y)),
    median(samples.map((sample) => sample.position.z)),
  );
  const referenceNormal = latest.normal.clone().normalize();
  const normal = samples.reduce((average, sample) => {
    const aligned = sample.normal.clone().normalize();

    if (aligned.dot(referenceNormal) < 0) {
      aligned.multiplyScalar(-1);
    }

    return average.add(aligned);
  }, new THREE.Vector3());

  if (normal.lengthSq() < 0.0001) {
    normal.copy(referenceNormal);
  } else {
    normal.normalize();
  }

  const positionJitter = Math.sqrt(
    samples.reduce(
      (total, sample) => total + sample.position.distanceToSquared(position),
      0,
    ) / samples.length,
  );
  const normalSpread = samples.reduce((largestAngle, sample) => {
    const alignment = THREE.MathUtils.clamp(
      Math.abs(sample.normal.clone().normalize().dot(normal)),
      -1,
      1,
    );

    return Math.max(largestAngle, Math.acos(alignment));
  }, 0);
  const stableSampleRatio =
    samples.filter((sample) => sample.quality === "stable").length /
    samples.length;
  const quality: MeasurementPlane["quality"] =
    stableSampleRatio >= 0.75 ? "stable" : "slanted";
  const confidence: ReticleConfidence =
    samples.length < 5
      ? "weak"
      : samples.length < SURFACE_READY_SAMPLE_COUNT ||
          quality === "slanted" ||
          positionJitter > SURFACE_READY_JITTER_METERS ||
          normalSpread > SURFACE_READY_NORMAL_SPREAD_RADIANS
        ? "medium"
        : "high";

  return {
    confidence,
    normal,
    position,
    quality,
  };
}

function median(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export function createCleanV2WallPlane(
  plane: MeasurementPlane,
  anchor: THREE.Vector3,
): MeasurementPlane | null {
  const horizontalNormal = plane.normal.clone();

  if (Math.abs(horizontalNormal.y) > V2_MAX_WALL_NORMAL_Y) {
    return null;
  }

  horizontalNormal.y = 0;

  if (horizontalNormal.lengthSq() < 0.0001) {
    return null;
  }

  return {
    anchor: anchor.clone(),
    kind: "wall",
    normal: horizontalNormal.normalize(),
    quality: "stable",
  };
}

export function createAnchorRelativeMatrix(
  anchorPoseMatrix: THREE.Matrix4,
  rootWorldMatrix: THREE.Matrix4,
) {
  return anchorPoseMatrix.clone().invert().multiply(rootWorldMatrix.clone());
}

export function syncObjectAnchorRelativeMatrix(object: V2PlacedObject) {
  if (!object.xrAnchor || !object.lastAnchorPoseMatrix) return;

  object.root.updateMatrix();
  object.anchorRelativeMatrix = createAnchorRelativeMatrix(
    object.lastAnchorPoseMatrix,
    object.root.matrix,
  );
}

export function applyAnchorPoseToObject(
  object: V2PlacedObject,
  anchorPoseMatrix: THREE.Matrix4,
) {
  if (!object.anchorRelativeMatrix) return;

  const rootMatrix = new THREE.Matrix4().multiplyMatrices(
    anchorPoseMatrix,
    object.anchorRelativeMatrix,
  );
  rootMatrix.decompose(
    object.root.position,
    object.root.quaternion,
    object.root.scale,
  );
  object.root.updateMatrix();
  object.anchor.setFromMatrixPosition(anchorPoseMatrix);
  object.anchorOffset.copy(object.root.position).sub(object.anchor);

  const rootRotation = new THREE.Matrix4().makeRotationFromQuaternion(
    object.root.quaternion,
  );
  object.widthDir.setFromMatrixColumn(rootRotation, 0).normalize();
  object.heightDir.setFromMatrixColumn(rootRotation, 1).normalize();
  object.depthDir.setFromMatrixColumn(rootRotation, 2).normalize();
}

export async function createV2XrAnchor(
  hitResult: XRHitTestResultWithAnchor,
) {
  return hitResult.createAnchor?.() ?? null;
}

export function defaultV2DimensionsForModel(
  model: ModelDefinition,
): V2PlacedObject["dimensions"] {
  const depth =
    model.type === "cabinet"
      ? 45
      : model.type === "door" || model.type === "window"
        ? 8
        : V2_DEFAULT_DEPTH_CM;

  return normalizeV2Dimensions({
    segmentsCm: [
      model.defaultWidthCm ??
        (model.type === "door" ? 80 : V2_DEFAULT_WIDTH_CM),
    ],
    heightCm:
      model.defaultHeightCm ??
      (model.type === "door"
        ? 200
        : model.type === "window"
          ? 120
          : V2_DEFAULT_HEIGHT_CM),
    depthCm: depth,
  });
}

export function normalizeV2Dimensions(
  dimensions: V2PlacedObject["dimensions"],
): V2PlacedObject["dimensions"] {
  return {
    segmentsCm: [
      clampDimension(
        dimensions.segmentsCm[0] ?? V2_DEFAULT_WIDTH_CM,
        20,
        600,
      ),
    ],
    heightCm: clampDimension(dimensions.heightCm, 20, 400),
    depthCm: clampDimension(dimensions.depthCm, 2, 180),
  };
}

function clampDimension(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function formatV2Dimensions(
  dimensions: V2PlacedObject["dimensions"],
) {
  return `${dimensions.segmentsCm[0]} x ${dimensions.heightCm} x ${dimensions.depthCm} cm`;
}

export function nudgeV2Object(
  object: V2PlacedObject,
  axis: THREE.Vector3,
  distance: number,
) {
  const offsetKey = object.xrAnchor ? "anchorOffset" : "anchor";

  return {
    [offsetKey]: object[offsetKey]
      .clone()
      .add(axis.clone().normalize().multiplyScalar(distance)),
  };
}

export function rotateV2ObjectAxes(
  object: V2PlacedObject,
  radians: number,
) {
  const rotation = new THREE.Quaternion().setFromAxisAngle(
    object.heightDir.clone().normalize(),
    radians,
  );

  return {
    widthDir: object.widthDir.clone().applyQuaternion(rotation).normalize(),
    depthDir: object.depthDir.clone().applyQuaternion(rotation).normalize(),
  };
}

export function v3DragDistancePerPixel(object: V2PlacedObject) {
  const widthMeters =
    (object.dimensions.segmentsCm[0] ?? V2_DEFAULT_WIDTH_CM) / 100;
  const heightMeters = object.dimensions.heightCm / 100;
  const sizeFactor = Math.max(widthMeters, heightMeters, 1);

  return THREE.MathUtils.clamp(sizeFactor / 650, 0.0015, 0.006);
}
