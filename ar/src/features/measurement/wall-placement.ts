import * as THREE from "three";
import type { MeasurementPlane } from "./snapping";
import type { V2PlacementAxes } from "./workspace-types";

export function createPlacementAxes(
  plane: MeasurementPlane,
  camera: THREE.Camera,
): V2PlacementAxes {
  const worldUp = new THREE.Vector3(0, 1, 0);
  const normal = plane.normal
    .clone()
    .addScaledVector(worldUp, -plane.normal.dot(worldUp))
    .normalize();

  if (plane.kind === "wall" && normal.lengthSq() > 0.0001) {
    const cameraPosition = new THREE.Vector3();
    camera.getWorldPosition(cameraPosition);
    const cameraDirection = cameraPosition.sub(plane.anchor);
    if (normal.dot(cameraDirection) < 0) {
      normal.multiplyScalar(-1);
    }

    const heightDir = worldUp.clone();
    const widthDir = new THREE.Vector3()
      .crossVectors(heightDir, normal)
      .normalize();
    return { widthDir, heightDir, depthDir: normal };
  }

  const cameraForward = new THREE.Vector3();
  camera.getWorldDirection(cameraForward);
  const depthDir = cameraForward.clone().setY(0).multiplyScalar(-1);
  if (depthDir.lengthSq() < 0.0001) depthDir.set(0, 0, 1);
  depthDir.normalize();

  return {
    widthDir: new THREE.Vector3()
      .crossVectors(worldUp, depthDir)
      .normalize(),
    heightDir: worldUp,
    depthDir,
  };
}

export function projectPlacementToReferenceWall(
  position: THREE.Vector3,
  referenceWall: MeasurementPlane,
) {
  const offsetFromWall = new THREE.Vector3().subVectors(
    position,
    referenceWall.anchor,
  );

  return position
    .clone()
    .addScaledVector(
      referenceWall.normal,
      -offsetFromWall.dot(referenceWall.normal),
    );
}

export function setV2RootTransform(
  root: THREE.Group,
  anchor: THREE.Vector3,
  axes: V2PlacementAxes,
) {
  root.position.copy(anchor);
  root.quaternion.setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(
      axes.widthDir.clone().normalize(),
      axes.heightDir.clone().normalize(),
      axes.depthDir.clone().normalize(),
    ),
  );
}
