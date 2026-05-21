import * as THREE from "three";
import type { MeasurementPoint } from "./types";

const EPSILON = 0.0001;
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const WORLD_RIGHT = new THREE.Vector3(1, 0, 0);
const WORLD_FORWARD = new THREE.Vector3(0, 0, 1);

export const MIN_SEGMENT_LENGTH_METERS = 0.015;

export type MeasurementPlaneKind = "floor" | "wall";

export interface MeasurementPlane {
  anchor: THREE.Vector3;
  kind: MeasurementPlaneKind;
  normal: THREE.Vector3;
  quality: "stable" | "slanted";
}

export function extractSurfaceNormal(matrix: THREE.Matrix4) {
  const normal = new THREE.Vector3().setFromMatrixColumn(matrix, 1);

  if (normal.lengthSq() < EPSILON) {
    return null;
  }

  return normal.normalize();
}

export function createMeasurementPlane(
  position: THREE.Vector3,
  surfaceNormal: THREE.Vector3 | null,
  preferredKind?: MeasurementPlaneKind,
  viewerForward?: THREE.Vector3 | null,
): MeasurementPlane {
  const classified = classifySurfaceNormal(
    surfaceNormal,
    preferredKind,
    viewerForward,
  );

  return {
    anchor: position.clone(),
    kind: classified.kind,
    normal: classified.normal,
    quality: classified.quality,
  };
}

export function projectPointToPlane(
  position: THREE.Vector3,
  plane: MeasurementPlane,
) {
  const distanceFromPlane = new THREE.Vector3()
    .subVectors(position, plane.anchor)
    .dot(plane.normal);

  return position.clone().addScaledVector(plane.normal, -distanceFromPlane);
}

export function createPlaneReticleMatrix(
  position: THREE.Vector3,
  plane: MeasurementPlane,
) {
  const normal = plane.normal.clone().normalize();
  let xAxis =
    plane.kind === "wall"
      ? new THREE.Vector3().crossVectors(WORLD_UP, normal)
      : WORLD_RIGHT.clone();

  if (xAxis.lengthSq() < EPSILON) {
    xAxis = new THREE.Vector3().crossVectors(WORLD_FORWARD, normal);
  }

  if (xAxis.lengthSq() < EPSILON) {
    xAxis = WORLD_RIGHT.clone();
  }

  xAxis.normalize();
  const zAxis = new THREE.Vector3().crossVectors(xAxis, normal).normalize();
  const matrix = new THREE.Matrix4().makeBasis(xAxis, normal, zAxis);
  matrix.setPosition(position);

  return matrix;
}

export function copyMeasurementPlane(
  plane: MeasurementPlane,
  anchor = plane.anchor,
): MeasurementPlane {
  return {
    anchor: anchor.clone(),
    kind: plane.kind,
    normal: plane.normal.clone(),
    quality: plane.quality,
  };
}

export function snapShapePoint(
  rawPosition: THREE.Vector3,
  points: MeasurementPoint[],
  surface: MeasurementPlane | THREE.Vector3 | null,
) {
  if (points.length === 0) {
    return rawPosition.clone();
  }

  const previous = points[points.length - 1].position;

  if (points.length === 1) {
    return snapSecondPointToLevelBaseline(rawPosition, previous, surface);
  }

  const primaryAxis = getPrimaryAxis(points);
  const secondaryAxis = getSecondaryAxis(points, surface);

  if (!primaryAxis || !secondaryAxis) {
    return rawPosition.clone();
  }

  return snapToDominantAxis(rawPosition, previous, primaryAxis, secondaryAxis);
}

export function snapHeightPoint(
  rawPosition: THREE.Vector3,
  points: MeasurementPoint[],
  surface: MeasurementPlane | THREE.Vector3 | null,
) {
  const start = points[points.length - 1]?.position;

  if (!start) {
    return rawPosition.clone();
  }

  const heightAxis = getHeightAxis(points, surface);
  const rawDelta = new THREE.Vector3().subVectors(rawPosition, start);
  const projectedHeight = rawDelta.dot(heightAxis);
  const heightDistance =
    Math.abs(projectedHeight) >= MIN_SEGMENT_LENGTH_METERS
      ? Math.abs(projectedHeight)
      : rawDelta.length();

  return start.clone().add(heightAxis.multiplyScalar(heightDistance));
}

function classifySurfaceNormal(
  surfaceNormal: THREE.Vector3 | null,
  preferredKind?: MeasurementPlaneKind,
  viewerForward?: THREE.Vector3 | null,
): Omit<MeasurementPlane, "anchor"> {
  if (preferredKind === "floor") {
    return {
      kind: "floor",
      normal: WORLD_UP.clone(),
      quality: "stable",
    };
  }

  if (preferredKind === "wall") {
    return {
      kind: "wall",
      normal: getWallNormal(surfaceNormal, viewerForward),
      quality: getSurfaceQuality(surfaceNormal),
    };
  }

  if (!surfaceNormal || surfaceNormal.lengthSq() < EPSILON) {
    return {
      kind: "wall",
      normal: WORLD_FORWARD.clone(),
      quality: "slanted",
    };
  }

  const rawNormal = surfaceNormal.clone().normalize();
  const upAmount = Math.abs(rawNormal.dot(WORLD_UP));
  const quality = getSurfaceQuality(rawNormal);

  if (upAmount >= 0.58) {
    return {
      kind: "floor",
      normal: WORLD_UP.clone(),
      quality,
    };
  }

  return {
    kind: "wall",
    normal: getWallNormal(rawNormal, viewerForward),
    quality,
  };
}

function getSurfaceQuality(surfaceNormal: THREE.Vector3 | null) {
  if (!surfaceNormal || surfaceNormal.lengthSq() < EPSILON) {
    return "slanted";
  }

  const upAmount = Math.abs(surfaceNormal.clone().normalize().dot(WORLD_UP));

  return upAmount > 0.78 || upAmount < 0.28 ? "stable" : "slanted";
}

function getWallNormal(
  surfaceNormal: THREE.Vector3 | null,
  viewerForward?: THREE.Vector3 | null,
) {
  const surfaceWallNormal = surfaceNormal?.clone() ?? null;

  if (surfaceWallNormal) {
    surfaceWallNormal.y = 0;

    if (surfaceWallNormal.lengthSq() >= EPSILON) {
      return surfaceWallNormal.normalize();
    }
  }

  const viewerWallNormal = viewerForward?.clone() ?? null;

  if (viewerWallNormal) {
    viewerWallNormal.y = 0;

    if (viewerWallNormal.lengthSq() >= EPSILON) {
      return viewerWallNormal.normalize();
    }
  }

  return WORLD_FORWARD.clone();
}

function snapToDominantAxis(
  rawPosition: THREE.Vector3,
  previous: THREE.Vector3,
  primaryAxis: THREE.Vector3,
  secondaryAxis: THREE.Vector3,
) {
  const delta = new THREE.Vector3().subVectors(rawPosition, previous);
  const primaryProjection = delta.dot(primaryAxis);
  const secondaryProjection = delta.dot(secondaryAxis);
  const axis =
    Math.abs(primaryProjection) >= Math.abs(secondaryProjection)
      ? primaryAxis
      : secondaryAxis;
  const distance = axis === primaryAxis ? primaryProjection : secondaryProjection;

  return previous.clone().add(axis.clone().multiplyScalar(distance));
}

function snapSecondPointToLevelBaseline(
  rawPosition: THREE.Vector3,
  previous: THREE.Vector3,
  surface: MeasurementPlane | THREE.Vector3 | null,
) {
  const horizontalDelta = new THREE.Vector3().subVectors(rawPosition, previous);
  horizontalDelta.y = 0;

  if (horizontalDelta.lengthSq() >= EPSILON) {
    return previous.clone().add(horizontalDelta);
  }

  const axes = getInitialShapeAxes(surface);

  if (!axes) {
    return rawPosition.clone();
  }

  return snapToDominantAxis(rawPosition, previous, axes[0], axes[1]);
}

function getInitialShapeAxes(surface: MeasurementPlane | THREE.Vector3 | null) {
  const normal = getSurfaceNormal(surface);

  if (surface && "kind" in surface && surface.kind === "wall") {
    const horizontal = new THREE.Vector3().crossVectors(WORLD_UP, surface.normal);

    if (horizontal.lengthSq() >= EPSILON) {
      return [horizontal.normalize(), WORLD_UP.clone()] as const;
    }
  }

  if (surface && "kind" in surface && surface.kind === "floor") {
    return [WORLD_RIGHT.clone(), WORLD_FORWARD.clone()] as const;
  }

  if (!normal) {
    return null;
  }

  const horizontal = new THREE.Vector3().crossVectors(WORLD_UP, normal);

  if (horizontal.lengthSq() >= EPSILON) {
    return [horizontal.normalize(), WORLD_UP.clone()] as const;
  }

  return [WORLD_RIGHT.clone(), WORLD_FORWARD.clone()] as const;
}

function getPrimaryAxis(points: MeasurementPoint[]) {
  if (points.length < 2) {
    return null;
  }

  const axis = new THREE.Vector3().subVectors(
    points[1].position,
    points[0].position,
  );

  if (axis.lengthSq() < EPSILON) {
    return null;
  }

  return axis.normalize();
}

function getSecondaryAxis(
  points: MeasurementPoint[],
  surface: MeasurementPlane | THREE.Vector3 | null,
) {
  const primaryAxis = getPrimaryAxis(points);

  if (!primaryAxis) {
    return null;
  }

  const normal = getStableNormal(primaryAxis, surface);
  const secondaryAxis = new THREE.Vector3().crossVectors(normal, primaryAxis);

  if (secondaryAxis.lengthSq() < EPSILON) {
    return null;
  }

  return secondaryAxis.normalize();
}

function getHeightAxis(
  points: MeasurementPoint[],
  surface: MeasurementPlane | THREE.Vector3 | null,
) {
  const primaryAxis = getPrimaryAxis(points);

  if (!primaryAxis) {
    return WORLD_UP.clone();
  }

  const normal = getStableNormal(primaryAxis, surface);

  if (Math.abs(normal.dot(WORLD_UP)) > 0.65) {
    return WORLD_UP.clone();
  }

  const heightAxis = new THREE.Vector3().crossVectors(normal, primaryAxis);

  if (heightAxis.lengthSq() < EPSILON) {
    return WORLD_UP.clone();
  }

  heightAxis.normalize();

  if (heightAxis.dot(WORLD_UP) < 0) {
    heightAxis.negate();
  }

  return heightAxis;
}

function getStableNormal(
  primaryAxis: THREE.Vector3,
  surface: MeasurementPlane | THREE.Vector3 | null,
) {
  const normal = getSurfaceNormal(surface) ?? new THREE.Vector3(0, 0, 1);

  if (normal.lengthSq() < EPSILON || Math.abs(normal.dot(primaryAxis)) > 0.92) {
    const fallback = new THREE.Vector3().crossVectors(primaryAxis, WORLD_UP);

    if (fallback.lengthSq() >= EPSILON) {
      return fallback.normalize();
    }

    return new THREE.Vector3(0, 0, 1);
  }

  return normal.normalize();
}

function getSurfaceNormal(surface: MeasurementPlane | THREE.Vector3 | null) {
  if (!surface) {
    return null;
  }

  if ("normal" in surface) {
    return surface.normal.clone();
  }

  return surface.clone();
}
