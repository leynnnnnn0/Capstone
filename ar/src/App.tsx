import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { computeDimensions, formatDimensions } from "./features/measurement/dimensions";
import { createLabel } from "./features/measurement/labels";
import { OBJECT_TYPES } from "./features/measurement/object-types";
import {
  createMeasurementScene,
  disposeObject,
  resizeMeasurementScene,
  type MeasurementScene,
} from "./features/measurement/scene";
import type {
  MeasuredObject,
  MeasurementPoint,
  MeasurementSegment,
  ObjectType,
  ReticleConfidence,
} from "./features/measurement/types";
import {
  extractSurfaceNormal,
  MIN_SEGMENT_LENGTH_METERS,
  snapHeightPoint,
  snapShapePoint,
} from "./features/measurement/snapping";
import { requestHitTestSession } from "./features/measurement/xr-session";
import { metersToCentimeters } from "./lib/format";

const VERSION = "react-vite-tier1-2026-05-17";
const PREVIEW_MODEL_DEPTH_METERS = 0.012;
type CapturePhase = "shape" | "height";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<MeasurementScene | null>(null);
  const sessionRef = useRef<XRSession | null>(null);
  const localSpaceRef = useRef<XRReferenceSpace | null>(null);
  const viewerSpaceRef = useRef<XRReferenceSpace | null>(null);
  const hitTestSourceRef = useRef<XRHitTestSource | null>(null);
  const currentHitPositionRef = useRef<THREE.Vector3 | null>(null);
  const currentHitNormalRef = useRef<THREE.Vector3 | null>(null);
  const shapePlaneNormalRef = useRef<THREE.Vector3 | null>(null);
  const confidenceRef = useRef<ReticleConfidence>("none");
  const selectedTypeRef = useRef<ObjectType>("other");
  const capturePhaseRef = useRef<CapturePhase>("shape");
  const ignorePlacementUntilRef = useRef(0);
  const lastPlacementAtRef = useRef(0);
  const lastPlacementPositionRef = useRef<THREE.Vector3 | null>(null);
  const hitStreakRef = useRef(0);
  const nextObjectIdRef = useRef(1);

  const [status, setStatus] = useState("Ready. Tap Start AR.");
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [confidence, setConfidence] = useState<ReticleConfidence>("none");
  const [capturePhase, setCapturePhase] = useState<CapturePhase>("shape");
  const [selectedObjectId, setSelectedObjectId] = useState<number | null>(null);
  const [points, setPoints] = useState<MeasurementPoint[]>([]);
  const pointsRef = useRef<MeasurementPoint[]>([]);
  const segmentsRef = useRef<MeasurementSegment[]>([]);
  const [objects, setObjects] = useState<MeasuredObject[]>([]);
  const objectsRef = useRef<MeasuredObject[]>([]);
  const [sessionPanelOpen, setSessionPanelOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [ocularConfirmed, setOcularConfirmed] = useState(false);

  const confidenceCopy = useMemo(() => {
    if (capturePhase === "height") return "Height point: tap the top/end of the vertical height.";
    if (confidence === "high") return "Surface locked. Tap to place a point.";
    if (confidence === "medium") return "Surface detected. Hold steady or tap.";
    if (confidence === "weak") return "Weak surface detection. Placement may be less accurate.";
    return "Shape points snap straight or 90-degree. Tap the outline, then press Finish Shape.";
  }, [capturePhase, confidence]);

  useEffect(() => {
    confidenceRef.current = confidence;
  }, [confidence]);

  useEffect(() => {
    capturePhaseRef.current = capturePhase;
  }, [capturePhase]);

  const log = useCallback((message: string) => {
    setDiagnostics((items) => [
      `${new Date().toLocaleTimeString()} - ${message}`,
      ...items.slice(0, 13),
    ]);
  }, []);

  const markUiInteraction = useCallback(() => {
    ignorePlacementUntilRef.current = performance.now() + 160;
  }, []);

  useEffect(() => {
    log(`app=${VERSION}`);
    log(`secure=${window.isSecureContext ? "yes" : "no"}`);
    log(`navigator.xr=${navigator.xr ? "yes" : "no"}`);
  }, [log]);

  useEffect(() => {
    const resize = () => resizeMeasurementScene(sceneRef.current);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const startSession = async () => {
    if (!canvasRef.current || sessionRef.current) return;

    try {
      setStatus("Requesting AR camera and hit testing...");
      log("requestSession immersive-ar hit-test");

      if (!sceneRef.current) {
        sceneRef.current = createMeasurementScene(canvasRef.current);
      }

      const measurementScene = sceneRef.current;
      const session = await requestHitTestSession(overlayRef.current);
      sessionRef.current = session;

      measurementScene.renderer.xr.setReferenceSpaceType("local");
      await measurementScene.renderer.xr.setSession(session);

      viewerSpaceRef.current = await session.requestReferenceSpace("viewer");
      localSpaceRef.current = await session.requestReferenceSpace("local");

      if (!session.requestHitTestSource) {
        throw new Error("Hit testing is not available in this browser session.");
      }

      const hitTestSource = await session.requestHitTestSource({
        space: viewerSpaceRef.current,
      });

      if (!hitTestSource) {
        throw new Error("Unable to create a hit-test source.");
      }

      hitTestSourceRef.current = hitTestSource;

      session.addEventListener("select", placePointFromHit);
      session.addEventListener("end", handleSessionEnd, { once: true });
      measurementScene.renderer.setAnimationLoop(renderFrame);

      setIsActive(true);
      setSessionPanelOpen(false);
      setSummaryOpen(false);
      setCapturePhase("shape");
      capturePhaseRef.current = "shape";
      setStatus("Item 1: tap the outline. Segments snap straight or 90-degree.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`start failed: ${message}`);
      setStatus(`AR could not start: ${message}`);
      cleanupSession();
    }
  };

  const endSession = async () => {
    await sessionRef.current?.end().catch(() => undefined);
  };

  const renderFrame = (_time: number, frame?: XRFrame) => {
    const measurementScene = sceneRef.current;
    const localSpace = localSpaceRef.current;
    const hitTestSource = hitTestSourceRef.current;
    if (!measurementScene || !frame || !localSpace || !hitTestSource) return;

    const results = frame.getHitTestResults(hitTestSource);
    if (results.length === 0) {
      hitStreakRef.current = 0;
      currentHitPositionRef.current = null;
      currentHitNormalRef.current = null;
      measurementScene.reticle.visible = false;
      confidenceRef.current = "none";
      setConfidence("none");
      measurementScene.renderer.render(measurementScene.scene, measurementScene.camera);
      return;
    }

    const pose = results[0].getPose(localSpace);
    if (!pose) {
      hitStreakRef.current = 0;
      currentHitPositionRef.current = null;
      currentHitNormalRef.current = null;
      measurementScene.reticle.visible = false;
      confidenceRef.current = "none";
      setConfidence("none");
      measurementScene.renderer.render(measurementScene.scene, measurementScene.camera);
      return;
    }

    hitStreakRef.current += 1;
    const matrix = new THREE.Matrix4().fromArray(pose.transform.matrix);
    currentHitPositionRef.current = new THREE.Vector3().setFromMatrixPosition(matrix);
    currentHitNormalRef.current = extractSurfaceNormal(matrix);
    measurementScene.reticle.matrix.copy(matrix);
    measurementScene.reticle.visible = true;

    const nextConfidence = getConfidence(hitStreakRef.current);
    confidenceRef.current = nextConfidence;
    setConfidence((previous) => (previous === nextConfidence ? previous : nextConfidence));
    setReticleColor(measurementScene.reticle, nextConfidence);
    measurementScene.renderer.render(measurementScene.scene, measurementScene.camera);
  };

  const placePointFromHit = () => {
    const now = performance.now();

    if (now < ignorePlacementUntilRef.current) {
      log("tap ignored: ui control");
      return;
    }

    const measurementScene = sceneRef.current;
    const position = currentHitPositionRef.current;
    const activeConfidence = confidenceRef.current;
    if (!measurementScene || !position || activeConfidence === "none") {
      setStatus("No surface detected yet. Move camera slowly.");
      log("tap ignored: no active hit-test surface");
      return;
    }

    const type = selectedTypeRef.current;
    const phase = capturePhaseRef.current;
    const objectType = OBJECT_TYPES[type];

    const stableNormal = shapePlaneNormalRef.current ?? currentHitNormalRef.current;
    const snappedPosition =
      phase === "height"
        ? snapHeightPoint(position, pointsRef.current, stableNormal)
        : snapShapePoint(position, pointsRef.current, stableNormal);
    const previous = pointsRef.current.at(-1);
    const lastPlacementPosition = lastPlacementPositionRef.current;

    if (
      lastPlacementPosition &&
      now - lastPlacementAtRef.current < 350 &&
      lastPlacementPosition.distanceTo(snappedPosition) < 0.025
    ) {
      log("tap ignored: duplicate placement");
      return;
    }

    if (
      previous &&
      previous.position.distanceTo(snappedPosition) < MIN_SEGMENT_LENGTH_METERS
    ) {
      setStatus("Point is too close to the previous point. Move a little farther.");
      log("tap ignored: snapped point too close");
      return;
    }

    lastPlacementAtRef.current = now;
    lastPlacementPositionRef.current = snappedPosition.clone();

    if (phase === "shape" && pointsRef.current.length === 0) {
      shapePlaneNormalRef.current = currentHitNormalRef.current?.clone() ?? null;
    }

    const pointNumber = pointsRef.current.length + 1;
    const marker = createMarker(snappedPosition.clone(), pointNumber, objectType.color);
    measurementScene.scene.add(marker);

    const point: MeasurementPoint = {
      id: pointNumber,
      position: snappedPosition.clone(),
      marker,
    };

    if (previous) {
      const distance = previous.position.distanceTo(point.position);
      const segment = createSegment(previous.position, point.position, objectType.color, distance);
      measurementScene.scene.add(segment.line);
      if (segment.label) {
        measurementScene.scene.add(segment.label);
      }
      segmentsRef.current = [...segmentsRef.current, segment];
    }

    pointsRef.current = [...pointsRef.current, point];
    setPoints(pointsRef.current);
    log(`point ${pointNumber} placed`);

    if (phase === "height") {
      completeCurrentObject();
      return;
    }

    setStatus(`Shape point ${pointNumber} placed. Next segments will stay straight or 90-degree.`);
  };

  const finishShape = () => {
    if (capturePhaseRef.current !== "shape") {
      setStatus("Next tap is the height point.");
      return;
    }

    if (pointsRef.current.length < 2) {
      setStatus("Place at least 2 shape points before finishing the shape.");
      return;
    }

    capturePhaseRef.current = "height";
    setCapturePhase("height");
    setStatus("Shape locked. Now tap the height point. Height will snap cleanly upright.");
  };

  const completeCurrentObject = () => {
    const measurementScene = sceneRef.current;
    if (!measurementScene || pointsRef.current.length < 3) {
      setStatus("Place at least 2 shape points and one height point.");
      return;
    }

    const id = nextObjectIdRef.current;
    nextObjectIdRef.current += 1;

    const dimensions = computeDimensions(pointsRef.current);
    const type = selectedTypeRef.current;
    const model = createGlassModel(pointsRef.current, OBJECT_TYPES[type].color);
    const label = createObjectLabel(id, type, pointsRef.current);
    measurementScene.scene.add(model);
    measurementScene.scene.add(label);

    const object: MeasuredObject = {
      id,
      type,
      points: pointsRef.current,
      segments: segmentsRef.current,
      dimensions,
      label,
      model,
    };

    objectsRef.current = [...objectsRef.current, object];
    setObjects(objectsRef.current);
    setSelectedObjectId(id);
    pointsRef.current = [];
    segmentsRef.current = [];
    shapePlaneNormalRef.current = null;
    lastPlacementPositionRef.current = null;
    setPoints([]);
    capturePhaseRef.current = "shape";
    setCapturePhase("shape");
    setStatus(`Item ${id} saved. Tap the next outline; it will snap straight or 90-degree.`);
  };

  const undoPoint = () => {
    const measurementScene = sceneRef.current;
    if (!measurementScene || pointsRef.current.length === 0) return;

    const point = pointsRef.current.at(-1);
    if (point) {
      measurementScene.scene.remove(point.marker);
      disposeObject(point.marker);
    }

    const segment = segmentsRef.current.at(-1);
    if (segment) {
      measurementScene.scene.remove(segment.line);
      if (segment.label) {
        measurementScene.scene.remove(segment.label);
      }
      disposeObject(segment.line);
      if (segment.label) {
        disposeObject(segment.label);
      }
      segmentsRef.current = segmentsRef.current.slice(0, -1);
    }

    pointsRef.current = pointsRef.current.slice(0, -1);
    if (pointsRef.current.length === 0) {
      shapePlaneNormalRef.current = null;
    }
    if (capturePhaseRef.current === "height") {
      capturePhaseRef.current = "shape";
      setCapturePhase("shape");
      setStatus("Back to shape editing. Add another outline point or press Finish Shape again.");
    } else {
      setStatus("Last point removed.");
    }
    lastPlacementPositionRef.current = null;
    setPoints(pointsRef.current);
  };

  const resetAll = () => {
    const measurementScene = sceneRef.current;
    if (!measurementScene) return;

    pointsRef.current.forEach((point) => {
      measurementScene.scene.remove(point.marker);
      disposeObject(point.marker);
    });

    segmentsRef.current.forEach((segment) => {
      measurementScene.scene.remove(segment.line);
      if (segment.label) {
        measurementScene.scene.remove(segment.label);
      }
      disposeObject(segment.line);
      if (segment.label) {
        disposeObject(segment.label);
      }
    });

    objectsRef.current.forEach((object) => {
      object.points.forEach((point) => {
        measurementScene.scene.remove(point.marker);
        disposeObject(point.marker);
      });
      object.segments.forEach((segment) => {
        measurementScene.scene.remove(segment.line);
        if (segment.label) {
          measurementScene.scene.remove(segment.label);
        }
        disposeObject(segment.line);
        if (segment.label) {
          disposeObject(segment.label);
        }
      });
      measurementScene.scene.remove(object.model);
      disposeObject(object.model);
      measurementScene.scene.remove(object.label);
      disposeObject(object.label);
    });

    pointsRef.current = [];
    segmentsRef.current = [];
    objectsRef.current = [];
    shapePlaneNormalRef.current = null;
    lastPlacementPositionRef.current = null;
    nextObjectIdRef.current = 1;
    setPoints([]);
    setObjects([]);
    setSelectedObjectId(null);
    capturePhaseRef.current = "shape";
    setCapturePhase("shape");
    setStatus("Session cleared.");
  };

  const openSummary = async () => {
    await endSession();
    setSessionPanelOpen(false);
    setOcularConfirmed(false);
    setSummaryOpen(true);
  };

  const handleSessionEnd = () => {
    cleanupSession();
    setIsActive(false);
    setSessionPanelOpen(false);
    setConfidence("none");
    setStatus("AR session ended. Tap Start AR to continue.");
  };

  const cleanupSession = () => {
    sceneRef.current?.renderer.setAnimationLoop(null);
    hitTestSourceRef.current?.cancel();
    hitTestSourceRef.current = null;
    viewerSpaceRef.current = null;
    localSpaceRef.current = null;
    sessionRef.current = null;
    currentHitPositionRef.current = null;
    currentHitNormalRef.current = null;
    lastPlacementPositionRef.current = null;
    hitStreakRef.current = 0;
    if (sceneRef.current) sceneRef.current.reticle.visible = false;
  };

  return (
    <main className={`ar-app ${isActive ? "is-ar-active" : ""}`}>
      <canvas ref={canvasRef} className="ar-canvas" />

      <div ref={overlayRef} className="ar-overlay-root">
        {isActive && (
          <div
            className="ar-tap-layer"
            aria-label="Place measurement point"
            onPointerUp={(event) => {
              if (event.target !== event.currentTarget) return;
              if (event.pointerType === "mouse" && event.button !== 0) return;
              placePointFromHit();
            }}
          />
        )}

        {isActive ? (
          <section className="ar-compact-panel" onPointerDown={markUiInteraction}>
            <div>
              <p className="eyebrow">SOG AR</p>
              <strong>
                {capturePhase === "shape"
                  ? "Tap outline points"
                  : "Tap height point"}
              </strong>
            </div>
            <span>{points.length} pts</span>
            <span>{objects.length} obj</span>
          </section>
        ) : (
          <section className="top-panel" onPointerDown={markUiInteraction}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">SOG AR Measure</p>
                <h1>Glass measurement</h1>
              </div>
              <span className="badge">Tier 1</span>
            </div>

            <p className="status">{status}</p>

            <div className="stats-grid">
              <span>
                Current points
                <strong>{points.length}</strong>
              </span>
              <span>
                Captured objects
                <strong>{objects.length}</strong>
              </span>
            </div>

            <div className="actions">
              <button type="button" className="primary" onClick={startSession}>
                Start AR
              </button>
              <button type="button" onClick={resetAll}>
                Reset
              </button>
              <button type="button" className="light" onClick={openSummary}>
                I&apos;m Done
              </button>
            </div>

            <details className="diagnostics">
              <summary>Diagnostics</summary>
              {diagnostics.map((entry) => (
                <p key={entry}>{entry}</p>
              ))}
            </details>
          </section>
        )}

        {isActive && (
          <div className={`reticle ${confidence}`}>
            <span />
            <p>{confidenceCopy}</p>
          </div>
        )}

        {isActive && (
          <div className="ar-action-bar" onPointerDown={markUiInteraction}>
            <button type="button" className="primary" onClick={finishShape}>
              {capturePhase === "shape" ? "Finish Shape" : "Tap Height"}
            </button>
            <button type="button" onClick={undoPoint}>
              Undo
            </button>
            <button type="button" onClick={() => setSessionPanelOpen((open) => !open)}>
              Objects {objects.length}
            </button>
            <button type="button" onClick={openSummary}>
              Done
            </button>
            <button type="button" onClick={endSession}>
              End
            </button>
          </div>
        )}

        {(!isActive || sessionPanelOpen) && (
          <aside
            className={`session-panel ${isActive ? "session-panel--compact" : ""}`}
            onPointerDown={markUiInteraction}
          >
            <div className="session-panel-header">
              <div>
                <h2>Session objects</h2>
                <p>{objects.length} captured</p>
              </div>
              {isActive && (
                <button type="button" onClick={() => setSessionPanelOpen(false)}>
                  Close
                </button>
              )}
            </div>
            <div className="object-list">
              {objects.length === 0 ? (
                <div className="empty">Finished objects will appear here.</div>
              ) : (
                objects.map((object) => (
                  <button
                    type="button"
                    key={object.id}
                  className={selectedObjectId === object.id ? "selected" : ""}
                  onClick={() => {
                    setSelectedObjectId(object.id);
                  }}
                >
                    <span>
                      <strong>{`Item ${object.id}`}</strong>
                      <small>{formatDimensions(object.dimensions)}</small>
                    </span>
                    <i style={{ background: OBJECT_TYPES[object.type].color }} />
                  </button>
                ))
              )}
            </div>
          </aside>
        )}

        {summaryOpen && (
          <section className="summary" onPointerDown={markUiInteraction}>
            <div className="summary-card">
              <p className="eyebrow">Measurement Summary</p>
              <h2>Captured objects</h2>
              <p className="summary-note">
                Measurements are field estimates and should be confirmed during the ocular visit.
              </p>

              <div className="summary-list">
                {objects.length === 0 ? (
                  <div className="summary-empty">No objects captured yet.</div>
                ) : (
                  objects.map((object) => (
                    <article key={object.id}>
                      <div>
                        <strong>{`Item ${object.id}`}</strong>
                        <p>{formatDimensions(object.dimensions)}</p>
                      </div>
                      <span style={{ background: OBJECT_TYPES[object.type].color }}>
                        Measured
                      </span>
                    </article>
                  ))
                )}
              </div>

              {ocularConfirmed && (
                <div className="confirmation">
                  Our team will contact you to schedule an ocular visit.
                </div>
              )}

              <div className="summary-actions">
                <input placeholder="Contact number or email" type="text" />
                <button type="button" onClick={() => setOcularConfirmed(true)}>
                  Proceed to Get Ocular Visit
                </button>
              </div>
              <button type="button" className="back-button" onClick={() => setSummaryOpen(false)}>
                Go Back
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function getConfidence(streak: number): ReticleConfidence {
  if (streak < 8) return "weak";
  if (streak < 24) return "medium";
  return "high";
}

function setReticleColor(reticle: THREE.Mesh, confidence: ReticleConfidence) {
  const material = reticle.material as THREE.MeshBasicMaterial;
  const color = {
    none: 0xff1744,
    weak: 0xf97316,
    medium: 0xfacc15,
    high: 0x34d399,
  }[confidence];
  material.color.setHex(color);
}

function createMarker(position: THREE.Vector3, index: number, color: string) {
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

function createSegment(
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

function createObjectLabel(id: number, type: ObjectType, points: MeasurementPoint[]) {
  const center = points
    .reduce((total, point) => total.add(point.position), new THREE.Vector3())
    .multiplyScalar(1 / points.length);

  const label = createLabel(`Item ${id}`, OBJECT_TYPES[type].color);
  label.position.copy(center);
  label.position.y += 0.12;

  return label;
}

function createGlassModel(points: MeasurementPoint[], color: string) {
  const dimensions = computeDimensions(points);
  const shapePoints = points.slice(0, -1);
  const heightStart = points[points.length - 2].position;
  const heightEnd = points[points.length - 1].position;
  const heightDir = new THREE.Vector3().subVectors(heightEnd, heightStart);
  if (heightDir.lengthSq() < 0.0001) heightDir.set(0, 1, 0);
  heightDir.normalize();
  const heightMeters = Math.max(0.05, dimensions.heightCm / 100);
  const group = new THREE.Group();

  shapePoints.slice(0, -1).forEach((point, index) => {
    const nextPoint = shapePoints[index + 1];
    const segmentDir = new THREE.Vector3().subVectors(
      nextPoint.position,
      point.position,
    );
    const segmentLength = segmentDir.length();

    if (segmentLength < MIN_SEGMENT_LENGTH_METERS) {
      return;
    }

    segmentDir.normalize();

    const normal = new THREE.Vector3().crossVectors(segmentDir, heightDir);
    if (normal.lengthSq() < 0.0001) normal.set(0, 0, 1);
    normal.normalize();

    const center = new THREE.Vector3()
      .addVectors(point.position, nextPoint.position)
      .multiplyScalar(0.5)
      .add(heightDir.clone().multiplyScalar(heightMeters / 2))
      .add(normal.clone().multiplyScalar(PREVIEW_MODEL_DEPTH_METERS / 2));
    const panel = createPanelMesh(
      segmentLength,
      heightMeters,
      segmentDir,
      heightDir,
      normal,
      center,
      color,
    );

    group.add(panel);
  });

  return group;
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
    opacity: 0.34,
    roughness: 0.15,
    metalness: 0.05,
  });
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(widthMeters, heightMeters, PREVIEW_MODEL_DEPTH_METERS),
    glassMaterial,
  );
  mesh.position.copy(center);
  mesh.setRotationFromMatrix(new THREE.Matrix4().makeBasis(widthDir, heightDir, normal));
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
