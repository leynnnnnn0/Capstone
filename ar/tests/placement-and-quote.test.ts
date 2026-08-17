import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import {
  createPlacementAxes,
  projectPlacementToReferenceWall,
  setV2RootTransform,
} from "../src/features/measurement/wall-placement.ts";
import { formatQuoteDimensions } from "../src/features/measurement/quote-format.ts";
import type { MeasurementPlane } from "../src/features/measurement/snapping.ts";

test("quote dimensions are displayed in centimeters", () => {
  assert.equal(formatQuoteDimensions(120, 210), "120 cm x 210 cm");
  assert.equal(formatQuoteDimensions(95.25, 200.5), "95.3 cm x 200.5 cm");
});

test("wall placement projects the model root onto the reference wall", () => {
  const wall: MeasurementPlane = {
    anchor: new THREE.Vector3(0, 0, 2),
    normal: new THREE.Vector3(0, 0, -1),
    kind: "wall",
    quality: "stable",
  };
  const placement = projectPlacementToReferenceWall(
    new THREE.Vector3(1.5, 1.2, 0.4),
    wall,
  );

  assert.ok(Math.abs(placement.x - 1.5) < 1e-9);
  assert.ok(Math.abs(placement.y - 1.2) < 1e-9);
  assert.ok(Math.abs(placement.z - 2) < 1e-9);
});

test("wall placement orients local model depth away from the wall", () => {
  const wall: MeasurementPlane = {
    anchor: new THREE.Vector3(0, 0, 2),
    normal: new THREE.Vector3(0, 0, -1),
    kind: "wall",
    quality: "stable",
  };
  const camera = new THREE.PerspectiveCamera();
  camera.position.set(0, 1.5, 0);
  camera.updateMatrixWorld(true);

  const axes = createPlacementAxes(wall, camera);
  const root = new THREE.Group();
  setV2RootTransform(root, wall.anchor, axes);

  const worldDepth = new THREE.Vector3(0, 0, 1)
    .applyQuaternion(root.quaternion)
    .normalize();

  assert.ok(worldDepth.dot(new THREE.Vector3(0, 0, -1)) > 0.999);
  assert.ok(Math.abs(root.position.z - wall.anchor.z) < 1e-9);
});
