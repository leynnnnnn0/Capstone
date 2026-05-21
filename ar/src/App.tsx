import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { computeDimensions, formatDimensions } from "./features/measurement/dimensions";
import { createLabel } from "./features/measurement/labels";
import {
  DEFAULT_MODEL,
  getModelById,
  MODEL_CATALOG,
  MODEL_CATEGORIES,
  type ModelCategoryId,
  type ModelDefinition,
} from "./features/measurement/model-catalog";
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
  copyMeasurementPlane,
  createMeasurementPlane,
  createPlaneReticleMatrix,
  extractSurfaceNormal,
  type MeasurementPlane,
  MIN_SEGMENT_LENGTH_METERS,
  projectPointToPlane,
  snapHeightPoint,
  snapShapePoint,
} from "./features/measurement/snapping";
import { requestHitTestSession } from "./features/measurement/xr-session";
import { metersToCentimeters } from "./lib/format";

const VERSION = "react-vite-tier1-2026-05-17";
const PREVIEW_MODEL_DEPTH_METERS = 0.012;
type CapturePhase = "shape" | "height";
const gltfLoader = new GLTFLoader();
const modelCache = new Map<string, Promise<THREE.Group>>();

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
  const currentHitPlaneRef = useRef<MeasurementPlane | null>(null);
  const shapePlaneRef = useRef<MeasurementPlane | null>(null);
  const confidenceRef = useRef<ReticleConfidence>("none");
  const selectedTypeRef = useRef<ObjectType>(DEFAULT_MODEL.type);
  const selectedModelIdRef = useRef(DEFAULT_MODEL.id);
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<ModelCategoryId>(
    DEFAULT_MODEL.category,
  );
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODEL.id);
  const [reassignCategoryId, setReassignCategoryId] = useState<ModelCategoryId>(
    DEFAULT_MODEL.category,
  );
  const [selectedObjectId, setSelectedObjectId] = useState<number | null>(null);
  const [points, setPoints] = useState<MeasurementPoint[]>([]);
  const pointsRef = useRef<MeasurementPoint[]>([]);
  const segmentsRef = useRef<MeasurementSegment[]>([]);
  const [objects, setObjects] = useState<MeasuredObject[]>([]);
  const objectsRef = useRef<MeasuredObject[]>([]);
  const [sessionPanelOpen, setSessionPanelOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [ocularConfirmed, setOcularConfirmed] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const sessionPanelOpenRef = useRef(false);
  const summaryOpenRef = useRef(false);
  const catalogOpenRef = useRef(false);
  const selectedModel = getModelById(selectedModelId);
  const selectedObject = useMemo(
    () => objects.find((object) => object.id === selectedObjectId) ?? null,
    [objects, selectedObjectId],
  );

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

  useEffect(() => {
    sessionPanelOpenRef.current = sessionPanelOpen;
  }, [sessionPanelOpen]);

  useEffect(() => {
    summaryOpenRef.current = summaryOpen;
  }, [summaryOpen]);

  useEffect(() => {
    catalogOpenRef.current = catalogOpen;
  }, [catalogOpen]);

  const log = useCallback((message: string) => {
    setDiagnostics((items) => [
      `${new Date().toLocaleTimeString()} - ${message}`,
      ...items.slice(0, 13),
    ]);
  }, []);

  const markUiInteraction = useCallback(() => {
    ignorePlacementUntilRef.current = performance.now() + 900;
  }, []);

  const selectModel = useCallback(
    (model: ModelDefinition, closeCatalog = false) => {
      ignorePlacementUntilRef.current = performance.now() + 1200;
      selectedModelIdRef.current = model.id;
      selectedTypeRef.current = model.type;
      setSelectedModelId(model.id);
      setSelectedCategoryId(model.category);

      if (closeCatalog) {
        setCatalogOpen(false);
      }

      setStatus(`${model.label} selected. Measure the shape, then height.`);
    },
    [],
  );

  const selectCompletedObject = useCallback((object: MeasuredObject) => {
    const model = getModelById(object.modelId);
    ignorePlacementUntilRef.current = performance.now() + 1200;
    setSelectedObjectId(object.id);
    setReassignCategoryId(model.category);
  }, []);

  const changeCompletedObjectModel = useCallback(
    (objectId: number, model: ModelDefinition) => {
      const measurementScene = sceneRef.current;
      const currentObject = objectsRef.current.find((object) => object.id === objectId);

      if (!measurementScene || !currentObject) {
        return;
      }

      ignorePlacementUntilRef.current = performance.now() + 1400;

      currentObject.root.remove(currentObject.model);
      disposeObject(currentObject.model);
      currentObject.root.remove(currentObject.label);
      disposeObject(currentObject.label);

      recolorMeasurementGuides(currentObject, OBJECT_TYPES[model.type].color);

      const nextModel = createGlassModel(currentObject.points, model);
      const nextLabel = createObjectLabel(currentObject.id, model, currentObject.points);
      currentObject.root.add(nextModel);
      currentObject.root.add(nextLabel);

      const updatedObject: MeasuredObject = {
        ...currentObject,
        type: model.type,
        modelId: model.id,
        model: nextModel,
        label: nextLabel,
      };

      objectsRef.current = objectsRef.current.map((object) =>
        object.id === objectId ? updatedObject : object,
      );
      setObjects(objectsRef.current);
      setSelectedObjectId(objectId);
      setReassignCategoryId(model.category);
      setStatus(`Item ${objectId} changed to ${model.label}.`);
      log(`item ${objectId} model changed to ${model.label}`);
    },
    [log],
  );

  const deleteCompletedObject = useCallback(
    (objectId: number) => {
      const currentObject = objectsRef.current.find((object) => object.id === objectId);

      if (!currentObject) {
        return;
      }

      ignorePlacementUntilRef.current = performance.now() + 1400;
      sceneRef.current?.scene.remove(currentObject.root);
      disposeObject(currentObject.root);

      const nextObjects = objectsRef.current.filter((object) => object.id !== objectId);
      objectsRef.current = nextObjects;
      setObjects(nextObjects);

      setSelectedObjectId((currentId) => {
        if (currentId !== objectId) return currentId;

        const fallbackObject = nextObjects.at(-1) ?? null;
        if (fallbackObject) {
          setReassignCategoryId(getModelById(fallbackObject.modelId).category);
        } else {
          setReassignCategoryId(DEFAULT_MODEL.category);
        }

        return fallbackObject?.id ?? null;
      });

      setStatus(`Item ${objectId} deleted.`);
      log(`item ${objectId} deleted`);
    },
    [log],
  );

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

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const blockUiXrSelect = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-xr-ui='true']")) return;

      event.preventDefault();
      markUiInteraction();
    };

    overlay.addEventListener("beforexrselect", blockUiXrSelect);

    return () => {
      overlay.removeEventListener("beforexrselect", blockUiXrSelect);
    };
  }, [markUiInteraction]);

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
      currentHitPlaneRef.current = null;
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
      currentHitPlaneRef.current = null;
      measurementScene.reticle.visible = false;
      confidenceRef.current = "none";
      setConfidence("none");
      measurementScene.renderer.render(measurementScene.scene, measurementScene.camera);
      return;
    }

    hitStreakRef.current += 1;
    const matrix = new THREE.Matrix4().fromArray(pose.transform.matrix);
    const rawPosition = new THREE.Vector3().setFromMatrixPosition(matrix);
    const detectedPlane = createMeasurementPlane(
      rawPosition,
      extractSurfaceNormal(matrix),
      getPreferredPlaneKind(),
      getViewerForward(frame, localSpace),
    );
    const isHeightPhase = capturePhaseRef.current === "height";
    const activePlane =
      !isHeightPhase && shapePlaneRef.current ? shapePlaneRef.current : detectedPlane;
    const cleanPosition = projectPointToPlane(rawPosition, activePlane);

    currentHitPositionRef.current = cleanPosition;
    currentHitNormalRef.current = activePlane.normal;
    currentHitPlaneRef.current = activePlane;
    measurementScene.reticle.visible = true;
    measurementScene.reticle.matrix.copy(
      createPlaneReticleMatrix(cleanPosition, activePlane),
    );

    const nextConfidence = getConfidence(hitStreakRef.current, activePlane.quality);
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

    if (
      catalogOpenRef.current ||
      sessionPanelOpenRef.current ||
      summaryOpenRef.current
    ) {
      log("tap ignored: panel open");
      return;
    }

    if (now - lastPlacementAtRef.current < 650) {
      log("tap ignored: duplicate tap debounce");
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
    const hitPlane = currentHitPlaneRef.current;
    const activePlane =
      phase === "height"
        ? hitPlane ?? shapePlaneRef.current
        : shapePlaneRef.current ?? hitPlane;
    const snapPlane =
      phase === "height" ? shapePlaneRef.current ?? activePlane : activePlane;

    if (!activePlane || !snapPlane) {
      setStatus("No surface detected yet. Move camera slowly.");
      log("tap ignored: no active measurement plane");
      return;
    }

    const projectedPosition = projectPointToPlane(position, activePlane);
    const snappedPosition =
      phase === "height"
        ? snapHeightPoint(projectedPosition, pointsRef.current, snapPlane)
        : snapShapePoint(projectedPosition, pointsRef.current, snapPlane);
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
      shapePlaneRef.current = copyMeasurementPlane(activePlane, snappedPosition);
      const planeLabel = activePlane.kind === "floor" ? "floor" : "wall";
      log(`measurement plane locked: ${planeLabel}`);
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

    setStatus(
      `Shape point ${pointNumber} placed. Locked to a straight ${activePlane.kind} plane.`,
    );
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
    const selectedModel = getModelById(selectedModelIdRef.current);
    const type = selectedModel.type;
    const model = createGlassModel(pointsRef.current, selectedModel);
    const label = createObjectLabel(id, selectedModel, pointsRef.current);
    const root = new THREE.Group();
    root.name = `measured-object-${id}`;
    measurementScene.scene.add(root);

    pointsRef.current.forEach((point) => root.attach(point.marker));
    segmentsRef.current.forEach((segment) => {
      root.attach(segment.line);
      if (segment.label) {
        root.attach(segment.label);
      }
    });
    root.add(model);
    root.add(label);

    const object: MeasuredObject = {
      id,
      type,
      modelId: selectedModel.id,
      root,
      points: pointsRef.current,
      segments: segmentsRef.current,
      dimensions,
      label,
      model,
    };

    objectsRef.current = [...objectsRef.current, object];
    setObjects(objectsRef.current);
    setSelectedObjectId(id);
    setReassignCategoryId(selectedModel.category);
    pointsRef.current = [];
    segmentsRef.current = [];
    shapePlaneRef.current = null;
    currentHitPlaneRef.current = null;
    currentHitPositionRef.current = null;
    currentHitNormalRef.current = null;
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
      shapePlaneRef.current = null;
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
      measurementScene.scene.remove(object.root);
      disposeObject(object.root);
    });

    pointsRef.current = [];
    segmentsRef.current = [];
    objectsRef.current = [];
    shapePlaneRef.current = null;
    lastPlacementPositionRef.current = null;
    nextObjectIdRef.current = 1;
    setPoints([]);
    setObjects([]);
    setSelectedObjectId(null);
    setReassignCategoryId(DEFAULT_MODEL.category);
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
    currentHitPlaneRef.current = null;
    lastPlacementPositionRef.current = null;
    hitStreakRef.current = 0;
    if (sceneRef.current) sceneRef.current.reticle.visible = false;
  };

  return (
    <main className={`ar-app ${isActive ? "is-ar-active" : ""}`}>
      <canvas ref={canvasRef} className="ar-canvas" />

      <div
        ref={overlayRef}
        className="ar-overlay-root"
        onPointerDownCapture={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest("[data-xr-ui='true']")) {
            markUiInteraction();
          }
        }}
      >
        {isActive ? (
          <section
            className="ar-compact-panel"
            data-xr-ui="true"
            onPointerDown={markUiInteraction}
          >
            <div>
              <p className="eyebrow">SOG AR</p>
              <strong>
                {capturePhase === "shape"
                  ? "Tap outline points"
                  : "Tap height point"}
              </strong>
            </div>
            <span>{selectedModel.label}</span>
            <span>{points.length} pts</span>
            <span>{objects.length} obj</span>
          </section>
        ) : (
          <section
            className="top-panel"
            data-xr-ui="true"
            onPointerDown={markUiInteraction}
          >
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

            <ModelCatalogPanel
              activeCategoryId={selectedCategoryId}
              selectedModelId={selectedModelId}
              onCategoryChange={setSelectedCategoryId}
              onSelectModel={(model) => selectModel(model)}
            />

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
          <div
            className="ar-action-bar"
            data-xr-ui="true"
            onPointerDown={markUiInteraction}
          >
            <button type="button" className="primary" onClick={finishShape}>
              {capturePhase === "shape" ? "Finish Shape" : "Tap Height"}
            </button>
            <button type="button" onClick={undoPoint}>
              Undo
            </button>
            <button
              type="button"
              onClick={() => {
                setSessionPanelOpen((open) => {
                  const nextOpen = !open;
                  if (nextOpen) setCatalogOpen(false);
                  return nextOpen;
                });
              }}
            >
              Objects {objects.length}
            </button>
            <button
              type="button"
              onClick={() => {
                setCatalogOpen((open) => {
                  const nextOpen = !open;
                  if (nextOpen) setSessionPanelOpen(false);
                  return nextOpen;
                });
              }}
            >
              Models
            </button>
            <button type="button" onClick={openSummary}>
              Done
            </button>
            <button type="button" onClick={endSession}>
              End
            </button>
          </div>
        )}

        {isActive && catalogOpen && (
          <section
            className="model-catalog model-catalog--active"
            data-xr-ui="true"
            onPointerDown={markUiInteraction}
          >
            <div className="model-catalog-header">
              <div>
                <p className="eyebrow">Model Catalog</p>
                <h2>Choose a product</h2>
              </div>
              <button type="button" onClick={() => setCatalogOpen(false)}>
                Close
              </button>
            </div>
            <ModelCatalogPanel
              activeCategoryId={selectedCategoryId}
              selectedModelId={selectedModelId}
              onCategoryChange={setSelectedCategoryId}
              onSelectModel={(model) => selectModel(model, true)}
              compact
            />
          </section>
        )}

        {sessionPanelOpen && (
          <aside
            className={`session-panel ${isActive ? "session-panel--compact" : ""}`}
            data-xr-ui="true"
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
                  <article
                    key={object.id}
                    className={selectedObjectId === object.id ? "selected" : ""}
                  >
                    <button
                      type="button"
                      className="object-select-button"
                      onClick={() => selectCompletedObject(object)}
                    >
                      <span>
                        <strong>{`Item ${object.id}`}</strong>
                        <em>{getModelById(object.modelId).label}</em>
                        <small>{formatDimensions(object.dimensions)}</small>
                      </span>
                      <i style={{ background: OBJECT_TYPES[object.type].color }} />
                    </button>
                    <button
                      type="button"
                      className="object-delete-button"
                      onClick={() => deleteCompletedObject(object.id)}
                    >
                      Delete
                    </button>
                  </article>
                ))
              )}
            </div>

            {selectedObject && (
              <div className="object-model-editor">
                <div className="object-model-editor-header">
                  <div>
                    <p className="eyebrow">Change Displayed Model</p>
                    <strong>{`Item ${selectedObject.id}`}</strong>
                  </div>
                  <span>{getModelById(selectedObject.modelId).label}</span>
                </div>
                <ModelCatalogPanel
                  activeCategoryId={reassignCategoryId}
                  selectedModelId={selectedObject.modelId}
                  onCategoryChange={setReassignCategoryId}
                  onSelectModel={(model) =>
                    changeCompletedObjectModel(selectedObject.id, model)
                  }
                  compact
                />
              </div>
            )}
          </aside>
        )}

        {summaryOpen && (
          <section
            className="summary"
            data-xr-ui="true"
            onPointerDown={markUiInteraction}
          >
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
                        <small>{getModelById(object.modelId).label}</small>
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

function getConfidence(
  streak: number,
  planeQuality: MeasurementPlane["quality"] = "stable",
): ReticleConfidence {
  if (streak < 8) return "weak";
  if (planeQuality === "slanted") return "medium";
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

function recolorMeasurementGuides(object: MeasuredObject, color: string) {
  const nextColor = new THREE.Color(color);

  [...object.points.map((point) => point.marker), ...object.segments.map((segment) => segment.line)]
    .forEach((guide) => {
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

function getPreferredPlaneKind(): MeasurementPlane["kind"] | undefined {
  return undefined;
}

function getViewerForward(frame: XRFrame, referenceSpace: XRReferenceSpace) {
  const viewerPose = frame.getViewerPose(referenceSpace);
  const viewMatrix = viewerPose?.views[0]?.transform.matrix;

  if (!viewMatrix) {
    return null;
  }

  return new THREE.Vector3(0, 0, -1)
    .transformDirection(new THREE.Matrix4().fromArray(viewMatrix))
    .normalize();
}

interface ModelCatalogPanelProps {
  activeCategoryId: ModelCategoryId;
  selectedModelId: string;
  onCategoryChange: (category: ModelCategoryId) => void;
  onSelectModel: (model: ModelDefinition) => void;
  compact?: boolean;
}

function ModelCatalogPanel({
  activeCategoryId,
  selectedModelId,
  onCategoryChange,
  onSelectModel,
  compact = false,
}: ModelCatalogPanelProps) {
  const visibleModels = MODEL_CATALOG.filter(
    (model) => model.category === activeCategoryId,
  );

  return (
    <div className={`model-catalog-panel ${compact ? "compact" : ""}`}>
      <div className="model-category-tabs" aria-label="Model categories">
        {MODEL_CATEGORIES.map((category) => (
          <button
            type="button"
            key={category.id}
            className={category.id === activeCategoryId ? "active" : ""}
            onClick={() => onCategoryChange(category.id)}
          >
            <strong>{category.label}</strong>
            {!compact && <span>{category.description}</span>}
          </button>
        ))}
      </div>

      <div className="model-card-row">
        {visibleModels.map((model) => {
          const isSelected = model.id === selectedModelId;
          const color = OBJECT_TYPES[model.type].color;

          return (
            <button
              type="button"
              key={model.id}
              className={`model-card ${isSelected ? "active" : ""}`}
              onClick={() => onSelectModel(model)}
            >
              <span className="model-card-preview" style={{ borderColor: color }}>
                {model.thumbnail ? (
                  <img src={model.thumbnail} alt="" />
                ) : (
                  <i style={{ background: color }} />
                )}
              </span>
              <span className="model-card-copy">
                <strong>{model.label}</strong>
                <small>{model.description}</small>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
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

function createObjectLabel(
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

function createGlassModel(points: MeasurementPoint[], model: ModelDefinition) {
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

  const frame = createModelFrame(points, model, heightDir, heightMeters);
  loadCatalogModel(model.file)
    .then((catalogModel) => {
      const fittedModel = fitCatalogModel(catalogModel, frame);
      group.add(fittedModel);
    })
    .catch((error) => {
      console.warn(`Unable to load model ${model.file}`, error);
    });

  return group;
}

interface ModelFrame {
  center: THREE.Vector3;
  widthDir: THREE.Vector3;
  heightDir: THREE.Vector3;
  depthDir: THREE.Vector3;
  width: number;
  height: number;
  depth: number;
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
    return {
      x: relative.dot(widthDir),
      z: relative.dot(depthDir),
    };
  });

  const minX = Math.min(...projected.map((point) => point.x), 0);
  const maxX = Math.max(...projected.map((point) => point.x), 0);
  const minZ = Math.min(...projected.map((point) => point.z), 0);
  const maxZ = Math.max(...projected.map((point) => point.z), 0);

  const width = Math.max(maxX - minX, MIN_SEGMENT_LENGTH_METERS);
  const measuredDepth = maxZ - minZ;
  const fallbackDepth =
    model.type === "cabinet" ? Math.max(width * 0.42, 0.28) : PREVIEW_MODEL_DEPTH_METERS * 4;
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
      if (Math.abs(widthDir.dot(heightDir)) < 0.94) {
        return widthDir;
      }
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

    if (candidate.lengthSq() > 0.04) {
      return candidate.normalize();
    }
  }

  const fallback = new THREE.Vector3().crossVectors(widthDir, heightDir);
  if (fallback.lengthSq() < 0.0001) {
    fallback.set(0, 0, 1);
  }

  return fallback.normalize();
}

function fitCatalogModel(source: THREE.Group, frame: ModelFrame) {
  const wrapper = new THREE.Group();
  const model = cloneModel(source);

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
