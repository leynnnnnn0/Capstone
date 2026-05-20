import * as THREE from "three";
import type { MeasurementPoint } from "./types";

const EPSILON = 0.0001;
const WORLD_UP = new THREE.Vector3(0, 1, 0);

export const MIN_SEGMENT_LENGTH_METERS = 0.015;

export function extractSurfaceNormal(matrix: THREE.Matrix4) {
  const normal = new THREE.Vector3().setFromMatrixColumn(matrix, 1);

  if (normal.lengthSq() < EPSILON) {
    return null;
  }

  return normal.normalize();
}

export function snapShapePoint(
  rawPosition: THREE.Vector3,
  points: MeasurementPoint[],
  surfaceNormal: THREE.Vector3 | null,
) {
  if (points.length < 2) {
    return rawPosition.clone();
  }

  const previous = points[points.length - 1].position;
  const primaryAxis = getPrimaryAxis(points);
  const secondaryAxis = getSecondaryAxis(points, surfaceNormal);

  if (!primaryAxis || !secondaryAxis) {
    return rawPosition.clone();
  }

  const delta = new THREE.Vector3().subVectors(rawPosition, previous);
  const primaryProjection = delta.dot(primaryAxis);
  const secondaryProjection = delta.dot(secondaryAxis);
  const axis =
    Math.abs(primaryProjection) >= Math.abs(secondaryProjection)
      ? primaryAxis
      : secondaryAxis;
  const distance =
    axis === primaryAxis ? primaryProjection : secondaryProjection;

  return previous.clone().add(axis.clone().multiplyScalar(distance));
}

export function snapHeightPoint(
  rawPosition: THREE.Vector3,
  points: MeasurementPoint[],
  surfaceNormal: THREE.Vector3 | null,
) {
  const start = points[points.length - 1]?.position;

  if (!start) {
    return rawPosition.clone();
  }

  const heightAxis = getHeightAxis(points, surfaceNormal);
  const rawDelta = new THREE.Vector3().subVectors(rawPosition, start);
  const projectedHeight = rawDelta.dot(heightAxis);
  const heightDistance =
    Math.abs(projectedHeight) >= MIN_SEGMENT_LENGTH_METERS
      ? Math.abs(projectedHeight)
      : rawDelta.length();

  return start.clone().add(heightAxis.multiplyScalar(heightDistance));
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
  surfaceNormal: THREE.Vector3 | null,
) {
  const primaryAxis = getPrimaryAxis(points);

  if (!primaryAxis) {
    return null;
  }

  const normal = getStableNormal(primaryAxis, surfaceNormal);
  const secondaryAxis = new THREE.Vector3().crossVectors(normal, primaryAxis);

  if (secondaryAxis.lengthSq() < EPSILON) {
    return null;
  }

  return secondaryAxis.normalize();
}

function getHeightAxis(
  points: MeasurementPoint[],
  surfaceNormal: THREE.Vector3 | null,
) {
  const primaryAxis = getPrimaryAxis(points);

  if (!primaryAxis) {
    return WORLD_UP.clone();
  }

  const normal = getStableNormal(primaryAxis, surfaceNormal);

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
  surfaceNormal: THREE.Vector3 | null,
) {
  const normal = surfaceNormal?.clone() ?? new THREE.Vector3(0, 0, 1);

  if (normal.lengthSq() < EPSILON || Math.abs(normal.dot(primaryAxis)) > 0.92) {
    const fallback = new THREE.Vector3().crossVectors(primaryAxis, WORLD_UP);

    if (fallback.lengthSq() >= EPSILON) {
      return fallback.normalize();
    }

    return new THREE.Vector3(0, 0, 1);
  }

  return normal.normalize();
}
