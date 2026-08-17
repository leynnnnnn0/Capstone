import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { metersToCentimeters } from "../../lib/format";
import { computeDimensions } from "./dimensions";
import { createLabel } from "./labels";
import { normalizeCatalogAssetUrl, type ModelDefinition } from "./model-catalog";
import { OBJECT_TYPES } from "./object-types";
import {
  MIN_SEGMENT_LENGTH_METERS,
  type MeasurementPlane,
} from "./snapping";
import type {
  MeasuredObject,
  MeasurementPoint,
  MeasurementSegment,
  ReticleConfidence,
} from "./types";
import {
  PREVIEW_MODEL_DEPTH_METERS,
  type ModelFrame,
  type V2PlacedObject,
} from "./workspace-types";

const gltfLoader = new GLTFLoader();
const modelCache = new Map<string, Promise<THREE.Group>>();

export function setReticleColor(
  reticle: THREE.Mesh,
  confidence: ReticleConfidence,
) {
  const material = reticle.material as THREE.MeshBasicMaterial;
  const color = {
    none: 0xff1744,
    weak: 0xfacc15,
    medium: 0xfacc15,
    high: 0x34d399,
  }[confidence];
  material.color.setHex(color);
}

export function recolorMeasurementGuides(
  object: MeasuredObject,
  color: string,
) {
  const nextColor = new THREE.Color(color);

  [
    ...object.points.map((point) => point.marker),
    ...object.segments.map((segment) => segment.line),
  ].forEach((guide) => {
    guide.traverse((child) => {
      const mesh = child as THREE.Mesh;
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : mesh.material
          ? [mesh.material]
          : [];

      materials.forEach((material) => {
        const colored = material as THREE.Material & {
          color?: THREE.Color;
          emissive?: THREE.Color;
        };
        colored.color?.copy(nextColor);
        colored.emissive?.copy(nextColor);
      });
    });
  });
}

export function getPreferredPlaneKind(): MeasurementPlane["kind"] | undefined {
  return undefined;
}

export function getViewerForward(
  frame: XRFrame,
  referenceSpace: XRReferenceSpace,
) {
  const viewerPose = frame.getViewerPose(referenceSpace);
  const viewMatrix = viewerPose?.views[0]?.transform.matrix;

  if (!viewMatrix) {
    return null;
  }

  return new THREE.Vector3(0, 0, -1)
    .transformDirection(new THREE.Matrix4().fromArray(viewMatrix))
    .normalize();
}

export function createMarker(
  position: THREE.Vector3,
  index: number,
  color: string,
) {
  const group = new THREE.Group();
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.65,
    }),
  );
  marker.position.copy(position);
  group.add(marker);
  group.userData.pointIndex = index;

  return group;
}

export function createSegment(
  start: THREE.Vector3,
  end: THREE.Vector3,
  color: string,
  length = start.distanceTo(end),
): MeasurementSegment {
  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const line = new THREE.Group();

  if (length >= 0.01) {
    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    const cylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, length, 10),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.35,
      }),
    );
    cylinder.position.copy(midpoint);
    cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    line.add(cylinder);
  }

  const centimeters = metersToCentimeters(length);
  const label = centimeters >= 1 ? createLabel(`${centimeters} cm`, color) : null;

  if (label) {
    label.position.copy(midpoint);
    label.position.y += 0.055;
  }

  return { line, label };
}

export function createObjectLabel(
  id: number,
  model: ModelDefinition,
  points: MeasurementPoint[],
) {
  const center = points
    .reduce((total, point) => total.add(point.position), new THREE.Vector3())
    .multiplyScalar(1 / points.length);

  const label = createLabel(`${model.label} ${id}`, OBJECT_TYPES[model.type].color);
  label.position.copy(center);
  label.position.y += 0.12;

  return label;
}

export function createV2ObjectLabel(
  id: number,
  model: ModelDefinition,
  dimensions: V2PlacedObject["dimensions"],
) {
  const label = createLabel(`${model.label} ${id}`, OBJECT_TYPES[model.type].color);
  label.position.set(0, dimensions.heightCm / 100 + 0.12, 0);

  return label;
}

export function createV2ObjectModel(
  dimensions: V2PlacedObject["dimensions"],
  model: ModelDefinition,
) {
  const widthMeters = Math.max(0.05, dimensions.segmentsCm[0] / 100);
  const heightMeters = Math.max(0.05, dimensions.heightCm / 100);
  const depthMeters = Math.max(0.01, dimensions.depthCm / 100);
  const color = OBJECT_TYPES[model.type].color;
  const group = new THREE.Group();
  const center = new THREE.Vector3(0, heightMeters / 2, depthMeters / 2);

  group.add(
    createPanelMesh(
      widthMeters,
      heightMeters,
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 1),
      center,
      color,
    ),
  );

  const frame: ModelFrame = {
    center,
    widthDir: new THREE.Vector3(1, 0, 0),
    heightDir: new THREE.Vector3(0, 1, 0),
    depthDir: new THREE.Vector3(0, 0, 1),
    width: widthMeters,
    height: heightMeters,
    depth: depthMeters,
  };

  const modelFile = normalizeCatalogAssetUrl(model.file);

  loadCatalogModel(modelFile)
    .then((catalogModel) => {
      group.add(fitCatalogModel(catalogModel, frame, model));
    })
    .catch((error) => {
      console.warn(`Unable to load model ${modelFile}`, error);
    });

  return group;
}

export function createGlassModel(
  points: MeasurementPoint[],
  model: ModelDefinition,
) {
  const dimensions = computeDimensions(points);
  const shapePoints = points.slice(0, -1);
  const heightStart = points[points.length - 2].position;
  const heightEnd = points[points.length - 1].position;
  const heightDir = new THREE.Vector3().subVectors(heightEnd, heightStart);
  if (heightDir.lengthSq() < 0.0001) heightDir.set(0, 1, 0);
  heightDir.normalize();
  const heightMeters = Math.max(0.05, dimensions.heightCm / 100);
  const group = new THREE.Group();
  const color = OBJECT_TYPES[model.type].color;

  shapePoints.slice(0, -1).forEach((point, index) => {
    const nextPoint = shapePoints[index + 1];
    const segmentDir = new THREE.Vector3().subVectors(
      nextPoint.position,
      point.position,
    );
    const segmentLength = segmentDir.length();

    if (segmentLength < MIN_SEGMENT_LENGTH_METERS) return;

    segmentDir.normalize();
    const normal = new THREE.Vector3().crossVectors(segmentDir, heightDir);
    if (normal.lengthSq() < 0.0001) normal.set(0, 0, 1);
    normal.normalize();

    const center = new THREE.Vector3()
      .addVectors(point.position, nextPoint.position)
      .multiplyScalar(0.5)
      .add(heightDir.clone().multiplyScalar(heightMeters / 2))
      .add(normal.clone().multiplyScalar(PREVIEW_MODEL_DEPTH_METERS / 2));
    group.add(
      createPanelMesh(
        segmentLength,
        heightMeters,
        segmentDir,
        heightDir,
        normal,
        center,
        color,
      ),
    );
  });

  const frame = createModelFrame(points, model, heightDir, heightMeters);
  const modelFile = normalizeCatalogAssetUrl(model.file);

  loadCatalogModel(modelFile)
    .then((catalogModel) => {
      group.add(fitCatalogModel(catalogModel, frame, model));
    })
    .catch((error) => {
      console.warn(`Unable to load model ${modelFile}`, error);
    });

  return group;
}

function loadCatalogModel(file: string) {
  if (!modelCache.has(file)) {
    modelCache.set(
      file,
      new Promise<THREE.Group>((resolve, reject) => {
        gltfLoader.load(
          file,
          (gltf) => resolve(gltf.scene),
          undefined,
          (error) => reject(error),
        );
      }).catch((error) => {
        modelCache.delete(file);
        throw error;
      }),
    );
  }

  return modelCache.get(file)!;
}

function createModelFrame(
  points: MeasurementPoint[],
  model: ModelDefinition,
  heightDir: THREE.Vector3,
  heightMeters: number,
): ModelFrame {
  const shapePoints = points.slice(0, -1);
  const origin = shapePoints[0].position;
  const widthDir = findWidthDirection(shapePoints, heightDir);
  const depthDir = findDepthDirection(shapePoints, widthDir, heightDir);
  const projected = shapePoints.map((point) => {
    const relative = new THREE.Vector3().subVectors(point.position, origin);
    return { x: relative.dot(widthDir), z: relative.dot(depthDir) };
  });
  const minX = Math.min(...projected.map((point) => point.x), 0);
  const maxX = Math.max(...projected.map((point) => point.x), 0);
  const minZ = Math.min(...projected.map((point) => point.z), 0);
  const maxZ = Math.max(...projected.map((point) => point.z), 0);
  const width = Math.max(maxX - minX, MIN_SEGMENT_LENGTH_METERS);
  const measuredDepth = maxZ - minZ;
  const fallbackDepth =
    model.type === "cabinet"
      ? Math.max(width * 0.42, 0.28)
      : PREVIEW_MODEL_DEPTH_METERS * 4;
  const depth = Math.max(measuredDepth, fallbackDepth);
  const center = origin
    .clone()
    .add(widthDir.clone().multiplyScalar(minX + width / 2))
    .add(depthDir.clone().multiplyScalar(minZ + depth / 2))
    .add(heightDir.clone().multiplyScalar(heightMeters / 2));

  return {
    center,
    widthDir,
    heightDir,
    depthDir,
    width,
    height: heightMeters,
    depth,
  };
}

function findWidthDirection(
  shapePoints: MeasurementPoint[],
  heightDir: THREE.Vector3,
) {
  for (let index = 0; index < shapePoints.length - 1; index += 1) {
    const direction = new THREE.Vector3().subVectors(
      shapePoints[index + 1].position,
      shapePoints[index].position,
    );
    if (direction.length() >= MIN_SEGMENT_LENGTH_METERS) {
      const widthDir = direction.normalize();
      if (Math.abs(widthDir.dot(heightDir)) < 0.94) return widthDir;
    }
  }

  return new THREE.Vector3(1, 0, 0);
}

function findDepthDirection(
  shapePoints: MeasurementPoint[],
  widthDir: THREE.Vector3,
  heightDir: THREE.Vector3,
) {
  for (let index = 0; index < shapePoints.length - 1; index += 1) {
    const direction = new THREE.Vector3().subVectors(
      shapePoints[index + 1].position,
      shapePoints[index].position,
    );
    if (direction.length() < MIN_SEGMENT_LENGTH_METERS) continue;

    direction.normalize();
    const candidate = direction
      .clone()
      .addScaledVector(widthDir, -direction.dot(widthDir))
      .addScaledVector(heightDir, -direction.dot(heightDir));
    if (candidate.lengthSq() > 0.04) return candidate.normalize();
  }

  const fallback = new THREE.Vector3().crossVectors(widthDir, heightDir);
  if (fallback.lengthSq() < 0.0001) fallback.set(0, 0, 1);
  return fallback.normalize();
}

function fitCatalogModel(
  source: THREE.Group,
  frame: ModelFrame,
  definition: ModelDefinition,
) {
  const wrapper = new THREE.Group();
  const model = cloneModel(source);
  removeCatalogModelArtifacts(model);
  orientCatalogModelForFrame(model, definition);
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  const modelSize = new THREE.Vector3();
  const modelCenter = new THREE.Vector3();
  bounds.getSize(modelSize);
  bounds.getCenter(modelCenter);
  model.position.sub(modelCenter);
  wrapper.add(model);
  wrapper.scale.set(
    frame.width / Math.max(modelSize.x, 0.001),
    frame.height / Math.max(modelSize.y, 0.001),
    frame.depth / Math.max(modelSize.z, 0.001),
  );
  wrapper.setRotationFromMatrix(
    new THREE.Matrix4().makeBasis(frame.widthDir, frame.heightDir, frame.depthDir),
  );
  wrapper.position.copy(frame.center);
  wrapper.userData.isCatalogModel = true;
  return wrapper;
}

function orientCatalogModelForFrame(
  model: THREE.Group,
  definition: ModelDefinition,
) {
  if (definition.type !== "window") return;

  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  bounds.getSize(size);
  if (size.z > size.x * 1.2) {
    model.rotateY(Math.PI / 2);
    model.updateMatrixWorld(true);
  }
}

function removeCatalogModelArtifacts(model: THREE.Group) {
  model.updateMatrixWorld(true);
  const meshes: THREE.Mesh[] = [];
  model.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh) meshes.push(mesh);
  });
  if (meshes.length < 2) return;

  const meshSizes = meshes.map((mesh) => {
    const box = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    return {
      mesh,
      maxDimension: Math.max(size.x, size.y, size.z),
      minDimension: Math.min(size.x, size.y, size.z),
    };
  });
  const sortedMaxDimensions = meshSizes
    .map((entry) => entry.maxDimension)
    .sort((a, b) => a - b);
  const medianMaxDimension =
    sortedMaxDimensions[Math.floor(sortedMaxDimensions.length / 2)] || 0;

  for (const entry of meshSizes) {
    const geometry = entry.mesh.geometry;
    const triangleCount = geometry.index
      ? geometry.index.count / 3
      : (geometry.attributes.position?.count ?? 0) / 3;
    const isFlat = entry.minDimension < 0.001;
    const isOversized =
      medianMaxDimension > 0 && entry.maxDimension > medianMaxDimension * 4;
    if (isFlat && isOversized && triangleCount <= 12) {
      entry.mesh.parent?.remove(entry.mesh);
    }
  }
  model.updateMatrixWorld(true);
}

function cloneModel(source: THREE.Group) {
  const clone = source.clone(true);
  clone.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.frustumCulled = false;
    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((material) => material.clone());
    } else if (mesh.material) {
      mesh.material = mesh.material.clone();
    }
  });
  return clone;
}

function createPanelMesh(
  widthMeters: number,
  heightMeters: number,
  widthDir: THREE.Vector3,
  heightDir: THREE.Vector3,
  normal: THREE.Vector3,
  center: THREE.Vector3,
  color: string,
) {
  const group = new THREE.Group();
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    emissive: new THREE.Color(color),
    emissiveIntensity: 0.08,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    roughness: 0.15,
    metalness: 0.05,
  });
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(widthMeters, heightMeters, PREVIEW_MODEL_DEPTH_METERS),
    glassMaterial,
  );
  mesh.position.copy(center);
  mesh.setRotationFromMatrix(
    new THREE.Matrix4().makeBasis(widthDir, heightDir, normal),
  );
  group.add(mesh);

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry),
    new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.9,
    }),
  );
  edges.position.copy(mesh.position);
  edges.quaternion.copy(mesh.quaternion);
  group.add(edges);
  return group;
}
