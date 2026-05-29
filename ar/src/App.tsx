import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  CheckCircle2,
  ChevronsDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUp,
  Layers3,
  Minus,
  MousePointerClick,
  Move3D,
  PanelRightOpen,
  Play,
  Plus,
  Ruler,
  ScanLine,
  RotateCcwSquare,
  RotateCwSquare,
  Smartphone,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ArShop } from "./components/shop/ArShop";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { computeDimensions, formatDimensions } from "./features/measurement/dimensions";
import { createLabel } from "./features/measurement/labels";
import {
  DEFAULT_MODEL,
  fetchProductModelCatalog,
  getModelById,
  MODEL_CATALOG,
  MODEL_CATEGORIES,
  normalizeCatalogAssetUrl,
  type ModelCategoryId,
  type ModelCategory,
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
  MeasurementDimensions,
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
import { cn } from "./lib/utils";

const VERSION = "react-vite-tier1-2026-05-17";
const PREVIEW_MODEL_DEPTH_METERS = 0.012;
const V2_DEFAULT_WIDTH_CM = 120;
const V2_DEFAULT_HEIGHT_CM = 210;
const V2_DEFAULT_DEPTH_CM = 12;
const V2_NUDGE_METERS = 0.05;
const V2_ROTATE_RADIANS = THREE.MathUtils.degToRad(7.5);
const V2_WALL_BACK_OFFSET_METERS = 0.0762;
const V2_MAX_WALL_NORMAL_Y = 0.18;
type CapturePhase = "shape" | "height";
type FlowVersion = "v1" | "v2";
type V2Mode = "scanWall" | "place" | "edit";
const gltfLoader = new GLTFLoader();
const modelCache = new Map<string, Promise<THREE.Group>>();

type XRAnchorLike = {
  anchorSpace: XRSpace;
  delete?: () => void;
};

type XRHitTestResultWithAnchor = XRHitTestResult & {
  createAnchor?: () => Promise<XRAnchorLike>;
};

interface ArQuoteTransferItem {
  productId: number;
  modelId: string;
  label: string;
  description: string;
  segmentsCm: number[];
  widthCm: number;
  heightCm: number;
  price?: number | null;
}

interface ArQuoteTransferPayload {
  source: "sog-ar";
  version: 1;
  createdAt: string;
  items: ArQuoteTransferItem[];
}

interface SummaryQuoteItem {
  id: number;
  label: string;
  description: string;
  dimensionsText: string;
  price: number | null;
}

interface V2PlacedObject {
  id: number;
  type: ObjectType;
  modelId: string;
  root: THREE.Group;
  model: THREE.Object3D;
  label: THREE.Sprite;
  anchor: THREE.Vector3;
  anchorOffset: THREE.Vector3;
  xrAnchor: XRAnchorLike | null;
  widthDir: THREE.Vector3;
  heightDir: THREE.Vector3;
  depthDir: THREE.Vector3;
  dimensions: MeasurementDimensions & { depthCm: number };
}

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
  const currentHitResultRef = useRef<XRHitTestResultWithAnchor | null>(null);
  const shapePlaneRef = useRef<MeasurementPlane | null>(null);
  const v2LockedWallRef = useRef<MeasurementPlane | null>(null);
  const confidenceRef = useRef<ReticleConfidence>("none");
  const noSurfaceSinceRef = useRef<number | null>(null);
  const lastViewerPositionRef = useRef<THREE.Vector3 | null>(null);
  const lastViewerMovementAtRef = useRef(0);
  const movementCoachCooldownUntilRef = useRef(0);
  const selectedTypeRef = useRef<ObjectType>(DEFAULT_MODEL.type);
  const selectedModelIdRef = useRef(DEFAULT_MODEL.id);
  const capturePhaseRef = useRef<CapturePhase>("shape");
  const ignorePlacementUntilRef = useRef(0);
  const lastPlacementAtRef = useRef(0);
  const lastPlacementPositionRef = useRef<THREE.Vector3 | null>(null);
  const hitStreakRef = useRef(0);
  const nextObjectIdRef = useRef(1);
  const nextV2ObjectIdRef = useRef(1);

  const [flowVersion, setFlowVersionState] = useState<FlowVersion>(() =>
    isV1Path(window.location.pathname) ? "v1" : "v2",
  );
  const [status, setStatus] = useState("Ready. Tap Start AR.");
  const [catalogStatus, setCatalogStatus] = useState("Loading products...");
  const [isActive, setIsActive] = useState(false);
  const [confidence, setConfidence] = useState<ReticleConfidence>("none");
  const [showArGuide, setShowArGuide] = useState(false);
  const [showMovementCoach, setShowMovementCoach] = useState(false);
  const [capturePhase, setCapturePhase] = useState<CapturePhase>("shape");
  const [modelCategories, setModelCategories] =
    useState<ModelCategory[]>(MODEL_CATEGORIES);
  const [modelCatalog, setModelCatalog] =
    useState<ModelDefinition[]>(MODEL_CATALOG);
  const [selectedCategoryId, setSelectedCategoryId] = useState<ModelCategoryId>(
    DEFAULT_MODEL.category,
  );
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODEL.id);
  const [reassignCategoryId, setReassignCategoryId] = useState<ModelCategoryId>(
    DEFAULT_MODEL.category,
  );
  const [selectedObjectId, setSelectedObjectId] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [shopDetailModel, setShopDetailModel] = useState<ModelDefinition | null>(null);
  const [points, setPoints] = useState<MeasurementPoint[]>([]);
  const pointsRef = useRef<MeasurementPoint[]>([]);
  const segmentsRef = useRef<MeasurementSegment[]>([]);
  const [objects, setObjects] = useState<MeasuredObject[]>([]);
  const objectsRef = useRef<MeasuredObject[]>([]);
  const [v2Objects, setV2Objects] = useState<V2PlacedObject[]>([]);
  const v2ObjectsRef = useRef<V2PlacedObject[]>([]);
  const [selectedV2ObjectId, setSelectedV2ObjectId] = useState<number | null>(null);
  const [v2WallLocked, setV2WallLocked] = useState(false);
  const [v2Mode, setV2ModeState] = useState<V2Mode>("scanWall");
  const [sessionPanelOpen, setSessionPanelOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [manualQuoteItems, setManualQuoteItems] = useState<ArQuoteTransferItem[]>([]);
  const sessionPanelOpenRef = useRef(false);
  const summaryOpenRef = useRef(false);
  const catalogOpenRef = useRef(false);
  const showArGuideRef = useRef(false);
  const showMovementCoachRef = useRef(false);
  const modelCatalogRef = useRef<ModelDefinition[]>(MODEL_CATALOG);
  const flowVersionRef = useRef<FlowVersion>(flowVersion);
  const v2ModeRef = useRef<V2Mode>("scanWall");
  const selectedModel = getModelById(modelCatalog, selectedModelId);
  const isV2 = flowVersion === "v2";
  const activeObjectCount = isV2 ? v2Objects.length : objects.length;
  const relatedShopModels = useMemo(() => {
    const activeModel = shopDetailModel ?? selectedModel;
    const sameCategoryModels = modelCatalog.filter(
      (model) =>
        model.id !== activeModel.id &&
        (model.category === activeModel.category || model.type === activeModel.type),
    );

    return (sameCategoryModels.length
      ? sameCategoryModels
      : modelCatalog.filter((model) => model.id !== activeModel.id)
    ).slice(0, 4);
  }, [modelCatalog, selectedModel, shopDetailModel]);
  const selectedObject = useMemo(
    () => objects.find((object) => object.id === selectedObjectId) ?? null,
    [objects, selectedObjectId],
  );
  const selectedV2Object = useMemo(
    () => v2Objects.find((object) => object.id === selectedV2ObjectId) ?? null,
    [selectedV2ObjectId, v2Objects],
  );

  useEffect(() => {
    modelCatalogRef.current = modelCatalog;
  }, [modelCatalog]);

  useEffect(() => {
    let cancelled = false;

    fetchProductModelCatalog()
      .then(({ categories, models }) => {
        if (cancelled) return;

        if (models.length === 0) {
          setCatalogStatus("No uploaded product 3D models yet. Showing local samples.");
          return;
        }

        const firstModel = models[0];
        setModelCatalog(models);
        setModelCategories(categories);
        setSelectedCategoryId(firstModel.category);
        setReassignCategoryId(firstModel.category);
        setSelectedModelId(firstModel.id);
        selectedModelIdRef.current = firstModel.id;
        selectedTypeRef.current = firstModel.type;
        setCatalogStatus(`${models.length} product model${models.length === 1 ? "" : "s"} loaded.`);
        setStatus(`${firstModel.label} selected. Tap Start AR to measure.`);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Product models unavailable.";
        setCatalogStatus(`${message} Showing local samples.`);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const confidenceCopy = useMemo(() => {
    if (isV2 && v2Mode === "scanWall") return "Scan the reference wall, then tap or press Lock Wall.";
    if (isV2 && v2Mode === "place") return "Wall locked. Tap any detected floor or wall area to place the model.";
    if (isV2 && v2Mode === "edit") return "Model placed. Use controls or tap Do Another.";
    if (capturePhase === "height") return "Height point: tap the top/end of the vertical height.";
    if (confidence === "high") return "Surface locked. Tap to place a point.";
    if (confidence === "medium") return "Surface detected. Hold steady or tap.";
    if (confidence === "weak") return "Weak surface detection. Placement may be less accurate.";
    return "Shape points snap straight or 90-degree. Tap the outline, then press Finish Shape.";
  }, [capturePhase, confidence, isV2, v2Mode]);

  useEffect(() => {
    confidenceRef.current = confidence;
  }, [confidence]);

  useEffect(() => {
    showArGuideRef.current = showArGuide;
  }, [showArGuide]);

  useEffect(() => {
    showMovementCoachRef.current = showMovementCoach;
  }, [showMovementCoach]);

  useEffect(() => {
    capturePhaseRef.current = capturePhase;
  }, [capturePhase]);

  useEffect(() => {
    flowVersionRef.current = flowVersion;
  }, [flowVersion]);

  useEffect(() => {
    v2ModeRef.current = v2Mode;
  }, [v2Mode]);

  useEffect(() => {
    sessionPanelOpenRef.current = sessionPanelOpen;
  }, [sessionPanelOpen]);

  useEffect(() => {
    summaryOpenRef.current = summaryOpen;
  }, [summaryOpen]);

  useEffect(() => {
    catalogOpenRef.current = catalogOpen;
  }, [catalogOpen]);

  const findModel = useCallback(
    (id: string) => getModelById(modelCatalogRef.current, id),
    [],
  );

  const measuredQuoteItems = useMemo<SummaryQuoteItem[]>(() => {
    if (isV2) {
      return v2Objects.map((object) => {
        const model = findModel(object.modelId);

        return {
          id: object.id,
          label: model.label,
          description: model.description,
          dimensionsText: formatQuoteDimensions(
            object.dimensions.segmentsCm[0] ?? 0,
            object.dimensions.heightCm,
          ),
          price: estimateQuotePrice(
            object.dimensions.segmentsCm[0] ?? 0,
            object.dimensions.heightCm,
            model,
          ),
        };
      });
    }

    return objects.map((object) => {
      const model = findModel(object.modelId);
      const widthCm = object.dimensions.segmentsCm.reduce(
        (sum, segment) => sum + segment,
        0,
      );

      return {
        id: object.id,
        label: model.label,
        description: model.description,
        dimensionsText: formatQuoteDimensions(widthCm, object.dimensions.heightCm),
        price: estimateQuotePrice(widthCm, object.dimensions.heightCm, model),
      };
    });
  }, [findModel, isV2, objects, v2Objects]);

  const summaryQuoteItems = useMemo(
    () => [
      ...manualQuoteItems.map((item, index) => transferItemToSummaryQuoteItem(item, index)),
      ...measuredQuoteItems,
    ],
    [manualQuoteItems, measuredQuoteItems],
  );

  const summaryEstimatedTotal = useMemo(
    () =>
      summaryQuoteItems.reduce(
        (total, item) => total + (item.price == null ? 0 : item.price),
        0,
      ),
    [summaryQuoteItems],
  );

  const log = useCallback((message: string) => {
    console.debug(`[SOG AR] ${message}`);
  }, []);

  const markUiInteraction = useCallback(() => {
    ignorePlacementUntilRef.current = performance.now() + 900;
  }, []);

  const setFlowVersion = useCallback(
    (version: FlowVersion) => {
      markUiInteraction();
      flowVersionRef.current = version;
      setFlowVersionState(version);
      window.history.replaceState(null, "", flowPath(version));
      setSessionPanelOpen(false);
      setCatalogOpen(false);
      setSummaryOpen(false);
      setStatus(
        version === "v2"
          ? "V2 ready. Tap Start AR, then tap once to place the selected model."
          : "V1 ready. Tap Start AR to measure with points.",
      );
    },
    [markUiInteraction],
  );

  const setV2Mode = useCallback((mode: V2Mode) => {
    v2ModeRef.current = mode;
    setV2ModeState(mode);
  }, []);

  const addModelToQuote = useCallback((model: ModelDefinition) => {
    markUiInteraction();
    const productId = model.productId;

    if (!productId) {
      setStatus("Choose an uploaded product before adding it to quote.");
      return;
    }

    const dimensions = defaultV2DimensionsForModel(model);
    const widthCm = dimensions.segmentsCm[0] ?? 0;

    setManualQuoteItems((items) => [
      ...items,
      {
        productId,
        modelId: model.id,
        label: model.label,
        description: model.description,
        segmentsCm: dimensions.segmentsCm,
        widthCm,
        heightCm: dimensions.heightCm,
        price: estimateQuotePrice(widthCm, dimensions.heightCm, model),
      },
    ]);
    setStatus(`${model.label} added to quote.`);
  }, [markUiInteraction]);

  const setArGuideVisible = useCallback((visible: boolean) => {
    showArGuideRef.current = visible;
    setShowArGuide(visible);
  }, []);

  const setMovementCoachVisible = useCallback((visible: boolean) => {
    showMovementCoachRef.current = visible;
    setShowMovementCoach(visible);
  }, []);

  const dismissArGuide = useCallback(() => {
    markUiInteraction();
    setArGuideVisible(false);
    noSurfaceSinceRef.current = null;
    movementCoachCooldownUntilRef.current = performance.now() + 1800;
    setStatus("Move the phone slowly until the reticle turns yellow or green.");
  }, [markUiInteraction, setArGuideVisible]);

  const selectModel = useCallback(
    (model: ModelDefinition, closeCatalog = false) => {
      ignorePlacementUntilRef.current = performance.now() + 1200;
      if (!modelCatalogRef.current.some((catalogModel) => catalogModel.id === model.id)) {
        modelCatalogRef.current = [...modelCatalogRef.current, model];
      }
      selectedModelIdRef.current = model.id;
      selectedTypeRef.current = model.type;
      setSelectedModelId(model.id);
      setSelectedCategoryId(model.category);

      if (closeCatalog) {
        setCatalogOpen(false);
      }

      setStatus(
        flowVersionRef.current === "v2"
          ? `${model.label} selected. Tap once in AR to place it.`
          : `${model.label} selected. Measure the shape, then height.`,
      );
    },
    [],
  );

  const selectCompletedObject = useCallback(
    (object: MeasuredObject) => {
      const model = findModel(object.modelId);
      ignorePlacementUntilRef.current = performance.now() + 1200;
      setSelectedObjectId(object.id);
      setReassignCategoryId(model.category);
    },
    [findModel],
  );

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
    [findModel, log],
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
          setReassignCategoryId(findModel(fallbackObject.modelId).category);
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
      v2LockedWallRef.current = null;
      setV2WallLocked(false);
      setV2Mode("scanWall");
      setArGuideVisible(true);
      setMovementCoachVisible(false);
      noSurfaceSinceRef.current = null;
      lastViewerPositionRef.current = null;
      lastViewerMovementAtRef.current = performance.now();
      movementCoachCooldownUntilRef.current = performance.now() + 2500;
      setStatus(
        flowVersionRef.current === "v2"
          ? "V2: scan the reference wall first. Tap or press Lock Wall when the reticle is steady."
          : "Item 1: tap the outline. Segments snap straight or 90-degree.",
      );
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

  const trackViewerMotion = (
    frame: XRFrame,
    localSpace: XRReferenceSpace,
    now: number,
  ) => {
    const viewerPose = frame.getViewerPose(localSpace);
    const matrix = viewerPose?.views[0]?.transform.matrix;

    if (!matrix) return;

    const viewerPosition = new THREE.Vector3().setFromMatrixPosition(
      new THREE.Matrix4().fromArray(matrix),
    );
    const previousPosition = lastViewerPositionRef.current;

    if (previousPosition && previousPosition.distanceTo(viewerPosition) > 0.018) {
      lastViewerMovementAtRef.current = now;
      noSurfaceSinceRef.current = null;
      movementCoachCooldownUntilRef.current = now + 1700;

      if (showMovementCoachRef.current) {
        setMovementCoachVisible(false);
      }
    }

    lastViewerPositionRef.current = viewerPosition;
  };

  const noteNoSurfaceFrame = (now: number) => {
    if (flowVersionRef.current === "v2" && v2ModeRef.current === "edit") {
      noSurfaceSinceRef.current = null;
      if (showMovementCoachRef.current) {
        setMovementCoachVisible(false);
      }
      return;
    }

    if (showArGuideRef.current || now < movementCoachCooldownUntilRef.current) {
      noSurfaceSinceRef.current = null;
      return;
    }

    noSurfaceSinceRef.current ??= now;

    if (
      now - noSurfaceSinceRef.current > 3200 &&
      now - lastViewerMovementAtRef.current > 900 &&
      !showMovementCoachRef.current
    ) {
      setMovementCoachVisible(true);
    }
  };

  const noteSurfaceFrame = () => {
    noSurfaceSinceRef.current = null;

    if (showMovementCoachRef.current) {
      setMovementCoachVisible(false);
    }
  };

  const updateV2Anchors = (frame: XRFrame, referenceSpace: XRReferenceSpace) => {
    for (const object of v2ObjectsRef.current) {
      if (!object.xrAnchor) continue;

      const anchorPose = frame.getPose(object.xrAnchor.anchorSpace, referenceSpace);
      if (!anchorPose) continue;

      object.anchor.copy(
        new THREE.Vector3().setFromMatrixPosition(
          new THREE.Matrix4().fromArray(anchorPose.transform.matrix),
        ),
      );
      setV2RootTransform(object.root, object.anchor.clone().add(object.anchorOffset), {
        widthDir: object.widthDir,
        heightDir: object.heightDir,
        depthDir: object.depthDir,
      });
    }
  };

  const renderFrame = (_time: number, frame?: XRFrame) => {
    const measurementScene = sceneRef.current;
    const localSpace = localSpaceRef.current;
    const hitTestSource = hitTestSourceRef.current;
    if (!measurementScene || !frame || !localSpace || !hitTestSource) return;

    const now = performance.now();
    trackViewerMotion(frame, localSpace, now);

    const results = frame.getHitTestResults(hitTestSource);
    const shouldShowPlacementReticle =
      flowVersionRef.current !== "v2" || v2ModeRef.current !== "edit";

    if (results.length === 0) {
      hitStreakRef.current = 0;
      currentHitPositionRef.current = null;
      currentHitNormalRef.current = null;
      currentHitPlaneRef.current = null;
      currentHitResultRef.current = null;
      measurementScene.reticle.visible = false;
      confidenceRef.current = "none";
      setConfidence("none");
      noteNoSurfaceFrame(now);
      updateV2Anchors(frame, localSpace);
      measurementScene.renderer.render(measurementScene.scene, measurementScene.camera);
      return;
    }

    const pose = results[0].getPose(localSpace);
    if (!pose) {
      hitStreakRef.current = 0;
      currentHitPositionRef.current = null;
      currentHitNormalRef.current = null;
      currentHitPlaneRef.current = null;
      currentHitResultRef.current = null;
      measurementScene.reticle.visible = false;
      confidenceRef.current = "none";
      setConfidence("none");
      noteNoSurfaceFrame(now);
      updateV2Anchors(frame, localSpace);
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
    currentHitResultRef.current = results[0] as XRHitTestResultWithAnchor;
    measurementScene.reticle.visible = shouldShowPlacementReticle;
    measurementScene.reticle.matrix.copy(
      createPlaneReticleMatrix(cleanPosition, activePlane),
    );

    const nextConfidence = getConfidence(hitStreakRef.current, activePlane.quality);
    confidenceRef.current = nextConfidence;
    setConfidence((previous) => (previous === nextConfidence ? previous : nextConfidence));
    setReticleColor(measurementScene.reticle, nextConfidence);
    noteSurfaceFrame();
    updateV2Anchors(frame, localSpace);
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

    if (flowVersionRef.current === "v2") {
      if (v2ModeRef.current === "edit") {
        setStatus("Model placed. Tap Do Another before placing another item.");
        return;
      }

      if (v2ModeRef.current === "scanWall" || !v2LockedWallRef.current) {
        lockV2WallFromHit();
        return;
      }

      void placeV2ObjectFromHit(position);
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

  const lockV2WallFromHit = () => {
    const activePlane = currentHitPlaneRef.current;
    const position = currentHitPositionRef.current;

    if (!activePlane || !position) {
      setStatus("No wall detected yet. Move the phone slowly across the reference wall.");
      return;
    }

    if (activePlane.kind !== "wall") {
      setStatus("Lock a wall first. After that you can place on the floor or wall.");
      return;
    }

    const cleanPlane = createCleanV2WallPlane(activePlane, position);
    if (!cleanPlane) {
      setStatus("Wall looks too slanted. Aim straight at a vertical wall edge and try again.");
      return;
    }

    v2LockedWallRef.current = cleanPlane;
    setV2WallLocked(true);
    setV2Mode("place");
    setStatus("Reference wall locked. Now tap the floor or wall where the model should go.");
  };

  const rescanV2Wall = () => {
    markUiInteraction();
    v2LockedWallRef.current = null;
    setV2WallLocked(false);
    setV2Mode("scanWall");
    setStatus("Wall scan reset. Aim at the reference wall and lock it again.");
  };

  const doAnotherV2Object = () => {
    markUiInteraction();

    if (!v2LockedWallRef.current) {
      setV2Mode("scanWall");
      setStatus("Scan and lock a reference wall before placing another item.");
      return;
    }

    setV2Mode("place");
    setSessionPanelOpen(false);
    setCatalogOpen(false);
    setSummaryOpen(false);
    setStatus("Ready for another item. Tap the floor or wall to place it.");
  };

  const placeV2ObjectFromHit = async (position: THREE.Vector3) => {
    const measurementScene = sceneRef.current;
    const hitPlane = currentHitPlaneRef.current;
    const localSpace = localSpaceRef.current;
    const hitResult = currentHitResultRef.current;

    if (!measurementScene || !hitPlane) {
      setStatus("No surface detected yet. Move camera slowly.");
      return;
    }

    const lockedWall = v2LockedWallRef.current;
    if (!lockedWall) {
      setStatus("Lock a reference wall first.");
      return;
    }

    const placementPlane = createCleanV2PlacementPlane(hitPlane, position);
    if (!placementPlane) {
      setStatus("Wall looks too slanted. Aim at a straighter wall area or tap the floor.");
      return;
    }

    const selectedModel = findModel(selectedModelIdRef.current);
    const type = selectedModel.type;
    const axes = createPlacementAxes(lockedWall, measurementScene.camera);
    const dimensions = defaultV2DimensionsForModel(selectedModel);
    const root = new THREE.Group();
    const wallPosition = projectPointToPlane(position, placementPlane);
    const placementOffset = axes.depthDir.clone().multiplyScalar(-V2_WALL_BACK_OFFSET_METERS);
    setV2RootTransform(root, wallPosition.clone().add(placementOffset), axes);
    const model = createV2ObjectModel(dimensions, selectedModel);
    const label = createV2ObjectLabel(nextV2ObjectIdRef.current, selectedModel, dimensions);

    root.name = `v2-placed-object-${nextV2ObjectIdRef.current}`;
    root.add(model);
    root.add(label);
    measurementScene.scene.add(root);

    const xrAnchor =
      localSpace && hitResult?.createAnchor
        ? await createV2XrAnchor(hitResult).catch((error) => {
            log(`v2 anchor unavailable: ${error instanceof Error ? error.message : String(error)}`);
            return null;
          })
        : null;

    const object: V2PlacedObject = {
      id: nextV2ObjectIdRef.current,
      type,
      modelId: selectedModel.id,
      root,
      model,
      label,
      anchor: wallPosition.clone(),
      anchorOffset: placementOffset,
      xrAnchor,
      widthDir: axes.widthDir,
      heightDir: axes.heightDir,
      depthDir: axes.depthDir,
      dimensions,
    };

    nextV2ObjectIdRef.current += 1;
    v2ObjectsRef.current = [...v2ObjectsRef.current, object];
    setV2Objects(v2ObjectsRef.current);
    setSelectedV2ObjectId(object.id);
    setV2Mode("edit");
    setStatus(
      xrAnchor
        ? `Item ${object.id} anchored. Adjust it, or tap Do Another.`
        : `Item ${object.id} placed. Adjust it, or tap Do Another.`,
    );
    log(`v2 item ${object.id} placed`);
  };

  const updateV2ObjectDimensions = (
    objectId: number,
    patch: Partial<V2PlacedObject["dimensions"]>,
  ) => {
    const measurementScene = sceneRef.current;
    const currentObject = v2ObjectsRef.current.find((object) => object.id === objectId);

    if (!measurementScene || !currentObject) return;

    ignorePlacementUntilRef.current = performance.now() + 700;
    const nextDimensions = normalizeV2Dimensions({
      ...currentObject.dimensions,
      ...patch,
    });
    const selectedModel = findModel(currentObject.modelId);

    currentObject.root.remove(currentObject.model);
    disposeObject(currentObject.model);
    currentObject.root.remove(currentObject.label);
    disposeObject(currentObject.label);

    const nextModel = createV2ObjectModel(nextDimensions, selectedModel);
    const nextLabel = createV2ObjectLabel(
      currentObject.id,
      selectedModel,
      nextDimensions,
    );
    currentObject.root.add(nextModel);
    currentObject.root.add(nextLabel);

    const updatedObject: V2PlacedObject = {
      ...currentObject,
      model: nextModel,
      label: nextLabel,
      dimensions: nextDimensions,
    };

    v2ObjectsRef.current = v2ObjectsRef.current.map((object) =>
      object.id === objectId ? updatedObject : object,
    );
    setV2Objects(v2ObjectsRef.current);
    setStatus(`Item ${objectId}: ${formatV2Dimensions(nextDimensions)}.`);
  };

  const updateV2ObjectTransform = (
    objectId: number,
    transform: (object: V2PlacedObject) => Partial<
      Pick<V2PlacedObject, "anchor" | "anchorOffset" | "widthDir" | "heightDir" | "depthDir">
    >,
  ) => {
    const currentObject = v2ObjectsRef.current.find((object) => object.id === objectId);
    if (!currentObject) return;

    ignorePlacementUntilRef.current = performance.now() + 700;
    const nextTransform = transform(currentObject);
    const updatedObject: V2PlacedObject = {
      ...currentObject,
      ...nextTransform,
    };

    rebuildV2ObjectVisuals(updatedObject);

    v2ObjectsRef.current = v2ObjectsRef.current.map((object) =>
      object.id === objectId ? updatedObject : object,
    );
    setV2Objects(v2ObjectsRef.current);
    setStatus(`Item ${objectId} adjusted.`);
  };

  const rebuildV2ObjectVisuals = (object: V2PlacedObject) => {
    object.root.remove(object.model);
    disposeObject(object.model);
    object.root.remove(object.label);
    disposeObject(object.label);

    const selectedModel = findModel(object.modelId);
    const axes: V2PlacementAxes = {
      widthDir: object.widthDir,
      heightDir: object.heightDir,
      depthDir: object.depthDir,
    };
    setV2RootTransform(object.root, object.anchor.clone().add(object.anchorOffset), axes);
    const nextModel = createV2ObjectModel(object.dimensions, selectedModel);
    const nextLabel = createV2ObjectLabel(
      object.id,
      selectedModel,
      object.dimensions,
    );

    object.root.add(nextModel);
    object.root.add(nextLabel);
    object.model = nextModel;
    object.label = nextLabel;
  };

  const selectV2Object = (object: V2PlacedObject) => {
    ignorePlacementUntilRef.current = performance.now() + 900;
    setSelectedV2ObjectId(object.id);
    setReassignCategoryId(findModel(object.modelId).category);
    setStatus(`Item ${object.id} selected. Adjust width, height, or depth.`);
  };

  const changeV2ObjectModel = (objectId: number, model: ModelDefinition) => {
    const currentObject = v2ObjectsRef.current.find((object) => object.id === objectId);
    if (!currentObject) return;

    ignorePlacementUntilRef.current = performance.now() + 900;

    const updatedObject: V2PlacedObject = {
      ...currentObject,
      type: model.type,
      modelId: model.id,
      dimensions: normalizeV2Dimensions({
        ...currentObject.dimensions,
        depthCm: defaultV2DimensionsForModel(model).depthCm,
      }),
    };

    rebuildV2ObjectVisuals(updatedObject);

    v2ObjectsRef.current = v2ObjectsRef.current.map((object) =>
      object.id === objectId ? updatedObject : object,
    );
    setV2Objects(v2ObjectsRef.current);
    setSelectedV2ObjectId(objectId);
    setReassignCategoryId(model.category);
    setStatus(`Item ${objectId} changed to ${model.label}.`);
  };

  const deleteV2Object = (objectId: number) => {
    const currentObject = v2ObjectsRef.current.find((object) => object.id === objectId);
    if (!currentObject) return;

    ignorePlacementUntilRef.current = performance.now() + 900;
    sceneRef.current?.scene.remove(currentObject.root);
    disposeObject(currentObject.root);

    const nextObjects = v2ObjectsRef.current.filter((object) => object.id !== objectId);
    currentObject.xrAnchor?.delete?.();
    v2ObjectsRef.current = nextObjects;
    setV2Objects(nextObjects);
    setSelectedV2ObjectId((currentId) =>
      currentId === objectId ? nextObjects.at(-1)?.id ?? null : currentId,
    );
    setStatus(`Item ${objectId} deleted.`);
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
    const selectedModel = findModel(selectedModelIdRef.current);
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
    v2ObjectsRef.current.forEach((object) => {
      object.xrAnchor?.delete?.();
      measurementScene.scene.remove(object.root);
      disposeObject(object.root);
    });
    v2ObjectsRef.current = [];
    shapePlaneRef.current = null;
    v2LockedWallRef.current = null;
    lastPlacementPositionRef.current = null;
    nextObjectIdRef.current = 1;
    nextV2ObjectIdRef.current = 1;
    setPoints([]);
    setObjects([]);
    setV2Objects([]);
    setSelectedObjectId(null);
    setSelectedV2ObjectId(null);
    setV2WallLocked(false);
    setV2Mode("scanWall");
    setReassignCategoryId(DEFAULT_MODEL.category);
    capturePhaseRef.current = "shape";
    setCapturePhase("shape");
    setStatus("Session cleared.");
  };

  const openSummary = async () => {
    await endSession();
    setSessionPanelOpen(false);
    setSummaryOpen(true);
  };

  const proceedToQuoteRequest = () => {
    markUiInteraction();

    const items =
      flowVersionRef.current === "v2"
        ? [
            ...manualQuoteItems,
            ...v2ObjectsRef.current
              .map((object) => v2ObjectToQuoteTransferItem(object, findModel(object.modelId)))
              .filter((item): item is ArQuoteTransferItem => Boolean(item)),
          ]
        : objectsRef.current
            .map((object) => objectToQuoteTransferItem(object, findModel(object.modelId)))
            .filter((item): item is ArQuoteTransferItem => Boolean(item));

    if (items.length === 0) {
      setStatus("Choose an uploaded product model before sending measurements to quote.");
      return;
    }

    const payload = encodeArQuoteTransfer({
      source: "sog-ar",
      version: 1,
      createdAt: new Date().toISOString(),
      items,
    });
    const url = new URL("/get-quote", frontendQuoteBaseUrl());
    url.searchParams.set("checkout", "1");
    url.searchParams.set("source", "ar");
    url.searchParams.set("ar_items", payload);
    window.location.assign(url.toString());
  };

  const handleSessionEnd = () => {
    cleanupSession();
    setIsActive(false);
    setSessionPanelOpen(false);
    setConfidence("none");
    setArGuideVisible(false);
    setMovementCoachVisible(false);
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
    currentHitResultRef.current = null;
    lastPlacementPositionRef.current = null;
    noSurfaceSinceRef.current = null;
    lastViewerPositionRef.current = null;
    lastViewerMovementAtRef.current = 0;
    movementCoachCooldownUntilRef.current = 0;
    showArGuideRef.current = false;
    showMovementCoachRef.current = false;
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
                {isV2
                  ? v2Mode === "edit"
                    ? "Edit item"
                    : v2Mode === "place"
                      ? "Tap to place"
                      : "Scan wall"
                  : capturePhase === "shape"
                    ? "Tap outline points"
                    : "Tap height point"}
              </strong>
            </div>
            <span>{selectedModel.label}</span>
            <span>{isV2 ? "V2" : `${points.length} pts`}</span>
            <span>{activeObjectCount} obj</span>
          </section>
        ) : (
          <ArShop
            categories={modelCategories}
            models={modelCatalog}
            activeCategoryId={selectedCategoryId}
            selectedModel={selectedModel}
            selectedModelId={selectedModelId}
            searchQuery={productSearch}
            isV2={isV2}
            catalogStatus={catalogStatus}
            activeObjectCount={activeObjectCount}
            relatedModels={relatedShopModels}
            detailModel={shopDetailModel}
            onCategoryChange={setSelectedCategoryId}
            onSearchChange={setProductSearch}
            onSelectModel={selectModel}
            onOpenDetail={(model) => {
              selectModel(model);
              setShopDetailModel(model);
            }}
            onCloseDetail={() => setShopDetailModel(null)}
            onStartSession={startSession}
            onOpenSummary={openSummary}
            onAddToQuote={addModelToQuote}
          />
        )}

        {isActive && (
          <>
            {showArGuide && (
              <section
                className="ar-guide-backdrop"
                data-xr-ui="true"
                onPointerDown={markUiInteraction}
              >
                <Card className="ar-guide-card">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="eyebrow">Quick guide</p>
                        <h2 className="mt-2 text-2xl font-semibold text-white">
                          How to measure
                        </h2>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-white hover:bg-white/10"
                        aria-label="Close guide"
                        onClick={dismissArGuide}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>

                    <div className="guide-step-list">
                      <article>
                        <Move3D className="size-5" />
                        <span>
                          <strong>Scan slowly</strong>
                          Move the phone side to side until the reticle turns yellow
                          or green.
                        </span>
                      </article>
                      <article>
                        <ScanLine className="size-5" />
                        <span>
                          <strong>{isV2 ? "Lock the wall" : "Tap the outline"}</strong>
                          {isV2
                            ? "Aim at the reference wall first, then tap or press Lock Wall."
                            : "Place points along the shape. Lines will snap straight or 90-degree where possible."}
                        </span>
                      </article>
                      <article>
                        <Ruler className="size-5" />
                        <span>
                          <strong>{isV2 ? "Adjust size" : "Finish, then height"}</strong>
                          {isV2
                            ? "After the wall is locked, tap to place and use the size controls."
                            : "Press Finish Shape, then tap the height point for the item."}
                        </span>
                      </article>
                      <article>
                        <MousePointerClick className="size-5" />
                        <span>
                          <strong>Keep controls separate</strong>
                          Use the bottom buttons for undo, models, objects, and done.
                        </span>
                      </article>
                    </div>

                    <div className="ar-guide-note">
                      {isV2
                        ? "Tip: the wall is only the reference. After locking it, tap the floor or wall where the model should sit."
                        : "Tip: start with the bottom edge, then trace the remaining outline. For best results, keep the phone moving gently until the surface locks."}
                    </div>

                    <Button
                      type="button"
                      size="lg"
                      className="w-full rounded-2xl"
                      onClick={dismissArGuide}
                    >
                      Start scanning
                    </Button>
                  </CardContent>
                </Card>
              </section>
            )}

            {showMovementCoach && !showArGuide && (
              <section
                className="movement-coach"
                data-xr-ui="true"
                onPointerDown={markUiInteraction}
              >
                <div className="movement-phone" aria-hidden="true">
                  <span className="movement-arrow movement-arrow--left" />
                  <Smartphone className="movement-phone-icon" />
                  <span className="movement-arrow movement-arrow--right" />
                </div>
                <div>
                  <p className="eyebrow">Need a surface</p>
                  <h2>Move your phone slowly</h2>
                  <p>
                    Pan side to side and slightly up or down. This disappears as
                    soon as movement is detected.
                  </p>
                </div>
              </section>
            )}
          </>
        )}

        {isActive && (!isV2 || v2Mode !== "edit") && (
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
            {!isV2 && (
              <>
                <Button type="button" className="primary" onClick={finishShape}>
                  <CheckCircle2 className="size-4" />
                  {capturePhase === "shape" ? "Finish Shape" : "Tap Height"}
                </Button>
                <Button type="button" onClick={undoPoint}>
                  <Undo2 className="size-4" />
                  Undo
                </Button>
              </>
            )}
            {isV2 && (
              <Button
                type="button"
                className="primary"
                onClick={
                  v2Mode === "edit"
                    ? doAnotherV2Object
                    : v2WallLocked
                      ? rescanV2Wall
                      : lockV2WallFromHit
                }
              >
                {v2Mode === "edit" ? (
                  <Plus className="size-4" />
                ) : (
                  <ScanLine className="size-4" />
                )}
                {v2Mode === "edit" ? "Do Another" : v2WallLocked ? "Rescan Wall" : "Lock Wall"}
              </Button>
            )}
            <Button
              type="button"
              onClick={() => {
                setSessionPanelOpen((open) => {
                  const nextOpen = !open;
                  if (nextOpen) setCatalogOpen(false);
                  return nextOpen;
                });
              }}
            >
              <Layers3 className="size-4" />
              Objects {activeObjectCount}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setCatalogOpen((open) => {
                  const nextOpen = !open;
                  if (nextOpen) setSessionPanelOpen(false);
                  return nextOpen;
                });
              }}
            >
              <PanelRightOpen className="size-4" />
              Models
            </Button>
            <Button type="button" onClick={openSummary}>
              Done
            </Button>
            <Button type="button" onClick={endSession}>
              End
            </Button>
          </div>
        )}

        {isActive &&
          isV2 &&
          selectedV2Object &&
          !sessionPanelOpen &&
          !catalogOpen &&
          !summaryOpen &&
          !showArGuide &&
          !showMovementCoach && (
          <section
            className="v2-size-panel"
            data-xr-ui="true"
            onPointerDown={markUiInteraction}
          >
            <div className="v2-size-panel-header">
              <div>
                <p className="eyebrow">Item {selectedV2Object.id}</p>
                <strong>{findModel(selectedV2Object.modelId).label}</strong>
              </div>
              <span>{formatV2Dimensions(selectedV2Object.dimensions)}</span>
            </div>
            <V2DimensionControl
              label="Width"
              value={selectedV2Object.dimensions.segmentsCm[0] ?? V2_DEFAULT_WIDTH_CM}
              onChange={(value) =>
                updateV2ObjectDimensions(selectedV2Object.id, {
                  segmentsCm: [value],
                })
              }
            />
            <V2DimensionControl
              label="Height"
              value={selectedV2Object.dimensions.heightCm}
              onChange={(value) =>
                updateV2ObjectDimensions(selectedV2Object.id, {
                  heightCm: value,
                })
              }
            />
            <V2DimensionControl
              label="Depth"
              value={selectedV2Object.dimensions.depthCm}
              onChange={(value) =>
                updateV2ObjectDimensions(selectedV2Object.id, {
                  depthCm: value,
                })
              }
            />
            <div className="v2-transform-grid">
              <Button
                type="button"
                variant="ghost"
                aria-label="Rotate left"
                onClick={() =>
                  updateV2ObjectTransform(selectedV2Object.id, (object) =>
                    rotateV2ObjectAxes(object, V2_ROTATE_RADIANS),
                  )
                }
              >
                <RotateCcwSquare className="size-4" />
                Rotate
              </Button>
              <Button
                type="button"
                variant="ghost"
                aria-label="Rotate right"
                onClick={() =>
                  updateV2ObjectTransform(selectedV2Object.id, (object) =>
                    rotateV2ObjectAxes(object, -V2_ROTATE_RADIANS),
                  )
                }
              >
                <RotateCwSquare className="size-4" />
                Rotate
              </Button>
              <Button
                type="button"
                variant="ghost"
                aria-label="Move left"
                onClick={() =>
                  updateV2ObjectTransform(selectedV2Object.id, (object) =>
                    nudgeV2Object(object, object.widthDir, -V2_NUDGE_METERS),
                  )
                }
              >
                <ChevronsLeft className="size-4" />
                Left
              </Button>
              <Button
                type="button"
                variant="ghost"
                aria-label="Move right"
                onClick={() =>
                  updateV2ObjectTransform(selectedV2Object.id, (object) =>
                    nudgeV2Object(object, object.widthDir, V2_NUDGE_METERS),
                  )
                }
              >
                <ChevronsRight className="size-4" />
                Right
              </Button>
              <Button
                type="button"
                variant="ghost"
                aria-label="Move up"
                onClick={() =>
                  updateV2ObjectTransform(selectedV2Object.id, (object) =>
                    nudgeV2Object(object, object.heightDir, V2_NUDGE_METERS),
                  )
                }
              >
                <ChevronsUp className="size-4" />
                Up
              </Button>
              <Button
                type="button"
                variant="ghost"
                aria-label="Move down"
                onClick={() =>
                  updateV2ObjectTransform(selectedV2Object.id, (object) =>
                    nudgeV2Object(object, object.heightDir, -V2_NUDGE_METERS),
                  )
                }
              >
                <ChevronsDown className="size-4" />
                Down
              </Button>
              <Button
                type="button"
                variant="ghost"
                aria-label="Move inward"
                onClick={() =>
                  updateV2ObjectTransform(selectedV2Object.id, (object) =>
                    nudgeV2Object(object, object.depthDir, -V2_NUDGE_METERS),
                  )
                }
              >
                <Minus className="size-4" />
                In
              </Button>
              <Button
                type="button"
                variant="ghost"
                aria-label="Move outward"
                onClick={() =>
                  updateV2ObjectTransform(selectedV2Object.id, (object) =>
                    nudgeV2Object(object, object.depthDir, V2_NUDGE_METERS),
                  )
                }
              >
                <Plus className="size-4" />
                Out
              </Button>
            </div>
          </section>
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full text-slate-100"
                onClick={() => setCatalogOpen(false)}
              >
                <X className="size-4" />
                Close
              </Button>
            </div>
            <ModelCatalogPanel
              categories={modelCategories}
              models={modelCatalog}
              activeCategoryId={selectedCategoryId}
              selectedModelId={selectedModelId}
              onCategoryChange={setSelectedCategoryId}
              onSelectModel={(model) => selectModel(model, true)}
              compact
            />
          </section>
        )}

        {isActive && sessionPanelOpen && (
          <aside
            className={`session-panel ${isActive ? "session-panel--compact" : ""}`}
            data-xr-ui="true"
            onPointerDown={markUiInteraction}
          >
            <div className="session-panel-header">
              <div>
                <h2>Session objects</h2>
                <p>{activeObjectCount} captured</p>
              </div>
              {isActive && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-slate-100"
                  onClick={() => setSessionPanelOpen(false)}
                >
                  <X className="size-4" />
                  Close
                </Button>
              )}
            </div>
            <div className="object-list">
              {activeObjectCount === 0 ? (
                <div className="empty">Finished objects will appear here.</div>
              ) : isV2 ? (
                v2Objects.map((object) => (
                  <article
                    key={object.id}
                    className={selectedV2ObjectId === object.id ? "selected" : ""}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      className="object-select-button"
                      onClick={() => selectV2Object(object)}
                    >
                      <span>
                        <strong>{`Item ${object.id}`}</strong>
                        <em>{findModel(object.modelId).label}</em>
                        <small>{formatV2Dimensions(object.dimensions)}</small>
                      </span>
                      <i style={{ background: OBJECT_TYPES[object.type].color }} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="object-delete-button"
                      onClick={() => deleteV2Object(object.id)}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  </article>
                ))
              ) : (
                objects.map((object) => (
                  <article
                    key={object.id}
                    className={selectedObjectId === object.id ? "selected" : ""}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      className="object-select-button"
                      onClick={() => selectCompletedObject(object)}
                    >
                      <span>
                        <strong>{`Item ${object.id}`}</strong>
                        <em>{findModel(object.modelId).label}</em>
                        <small>{formatDimensions(object.dimensions)}</small>
                      </span>
                      <i style={{ background: OBJECT_TYPES[object.type].color }} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="object-delete-button"
                      onClick={() => deleteCompletedObject(object.id)}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  </article>
                ))
              )}
            </div>

            {isV2 && selectedV2Object && (
              <div className="object-model-editor">
                <div className="object-model-editor-header">
                  <div>
                    <p className="eyebrow">Change Displayed Model</p>
                    <strong>{`Item ${selectedV2Object.id}`}</strong>
                  </div>
                  <span>{findModel(selectedV2Object.modelId).label}</span>
                </div>
                <ModelCatalogPanel
                  categories={modelCategories}
                  models={modelCatalog}
                  activeCategoryId={reassignCategoryId}
                  selectedModelId={selectedV2Object.modelId}
                  onCategoryChange={setReassignCategoryId}
                  onSelectModel={(model) =>
                    changeV2ObjectModel(selectedV2Object.id, model)
                  }
                  compact
                />
              </div>
            )}

            {selectedObject && (
              <div className="object-model-editor">
                <div className="object-model-editor-header">
                  <div>
                    <p className="eyebrow">Change Displayed Model</p>
                    <strong>{`Item ${selectedObject.id}`}</strong>
                  </div>
                  <span>{findModel(selectedObject.modelId).label}</span>
                </div>
                <ModelCatalogPanel
                  categories={modelCategories}
                  models={modelCatalog}
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
              <p className="eyebrow">Quote Summary</p>

              <div className="summary-list">
                {summaryQuoteItems.length === 0 ? (
                  <div className="summary-empty">No objects captured yet.</div>
                ) : (
                  summaryQuoteItems.map((item) => (
                    <article key={item.id}>
                      <div className="summary-item-copy">
                        <strong>{item.label}</strong>
                        <small>AR measured item</small>
                        <p>{item.dimensionsText}</p>
                        <p>1 pc</p>
                      </div>
                      <strong className="summary-item-price">
                        {item.price == null
                          ? "Price pending"
                          : formatQuoteCurrency(item.price)}
                      </strong>
                    </article>
                  ))
                )}
              </div>

              <div className="summary-total">
                <strong>Estimated Total</strong>
                <span>{formatQuoteCurrency(summaryEstimatedTotal)}</span>
              </div>

              <div className="summary-actions">
                <Button
                  type="button"
                  onClick={proceedToQuoteRequest}
                  disabled={summaryQuoteItems.length === 0}
                >
                  Book an ocular visit
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                className="back-button"
                onClick={() => setSummaryOpen(false)}
              >
                Go Back
              </Button>
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

interface V2PlacementAxes {
  widthDir: THREE.Vector3;
  heightDir: THREE.Vector3;
  depthDir: THREE.Vector3;
}

function createPlacementAxes(
  plane: MeasurementPlane,
  camera: THREE.Camera,
): V2PlacementAxes {
  const worldUp = new THREE.Vector3(0, 1, 0);
  const normal = plane.normal
    .clone()
    .addScaledVector(worldUp, -plane.normal.dot(worldUp))
    .normalize();

  if (plane.kind === "wall" && normal.lengthSq() > 0.0001) {
    const heightDir = worldUp.clone();
    const widthDir = new THREE.Vector3().crossVectors(heightDir, normal).normalize();
    return {
      widthDir,
      heightDir,
      depthDir: normal,
    };
  }

  const cameraForward = new THREE.Vector3();
  camera.getWorldDirection(cameraForward);
  const depthDir = cameraForward
    .clone()
    .setY(0)
    .multiplyScalar(-1);

  if (depthDir.lengthSq() < 0.0001) {
    depthDir.set(0, 0, 1);
  }

  depthDir.normalize();
  const widthDir = new THREE.Vector3().crossVectors(worldUp, depthDir).normalize();

  return {
    widthDir,
    heightDir: worldUp,
    depthDir,
  };
}

function createCleanV2WallPlane(
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

function createCleanV2PlacementPlane(
  plane: MeasurementPlane,
  anchor: THREE.Vector3,
): MeasurementPlane | null {
  if (plane.kind === "floor") {
    return copyMeasurementPlane(plane, anchor);
  }

  return createCleanV2WallPlane(plane, anchor);
}

function setV2RootTransform(
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

async function createV2XrAnchor(
  hitResult: XRHitTestResultWithAnchor,
) {
  return hitResult.createAnchor?.() ?? null;
}

function defaultV2DimensionsForModel(
  model: ModelDefinition,
): V2PlacedObject["dimensions"] {
  const depth =
    model.type === "cabinet"
      ? 45
      : model.type === "door" || model.type === "window"
        ? 8
        : V2_DEFAULT_DEPTH_CM;

  return normalizeV2Dimensions({
    segmentsCm: [model.defaultWidthCm ?? (model.type === "door" ? 80 : V2_DEFAULT_WIDTH_CM)],
    heightCm:
      model.defaultHeightCm ??
      (model.type === "door" ? 200 : model.type === "window" ? 120 : V2_DEFAULT_HEIGHT_CM),
    depthCm: depth,
  });
}

function normalizeV2Dimensions(
  dimensions: V2PlacedObject["dimensions"],
): V2PlacedObject["dimensions"] {
  return {
    segmentsCm: [clampDimension(dimensions.segmentsCm[0] ?? V2_DEFAULT_WIDTH_CM, 20, 600)],
    heightCm: clampDimension(dimensions.heightCm, 20, 400),
    depthCm: clampDimension(dimensions.depthCm, 2, 180),
  };
}

function clampDimension(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function formatV2Dimensions(dimensions: V2PlacedObject["dimensions"]) {
  return `${dimensions.segmentsCm[0]} x ${dimensions.heightCm} x ${dimensions.depthCm} cm`;
}

function formatQuoteDimensions(widthCm: number, heightCm: number) {
  return `${formatMeters(widthCm)} x ${formatMeters(heightCm)}`;
}

function transferItemToSummaryQuoteItem(
  item: ArQuoteTransferItem,
  index: number,
): SummaryQuoteItem {
  return {
    id: -index - 1,
    label: item.label,
    description: item.description,
    dimensionsText: formatQuoteDimensions(item.widthCm, item.heightCm),
    price: item.price ?? null,
  };
}

function formatMeters(valueCm: number) {
  const meters = valueCm / 100;
  const formatted = new Intl.NumberFormat("en-PH", {
    maximumFractionDigits: 2,
  }).format(meters);

  return `${formatted}m`;
}

function estimateQuotePrice(
  widthCm: number,
  heightCm: number,
  model: ModelDefinition,
) {
  if (model.price == null) return null;

  const unit = model.unit?.toLowerCase() ?? "";
  if (unit.includes("sqm") || unit.includes("sq m")) {
    return Math.round((widthCm / 100) * (heightCm / 100) * model.price);
  }

  return Math.round(model.price);
}

function formatQuoteCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
}

function nudgeV2Object(
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

function rotateV2ObjectAxes(object: V2PlacedObject, radians: number) {
  const rotation = new THREE.Quaternion().setFromAxisAngle(
    object.heightDir.clone().normalize(),
    radians,
  );

  return {
    widthDir: object.widthDir.clone().applyQuaternion(rotation).normalize(),
    depthDir: object.depthDir.clone().applyQuaternion(rotation).normalize(),
  };
}

function V2DimensionControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="v2-dimension-control">
      <span>{label}</span>
      <div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(value - 5)}
        >
          <Minus className="size-4" />
        </Button>
        <strong>{value} cm</strong>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(value + 5)}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function v2ObjectToQuoteTransferItem(
  object: V2PlacedObject,
  model: ModelDefinition,
): ArQuoteTransferItem | null {
  if (!model.productId) return null;

  return {
    productId: model.productId,
    modelId: model.id,
    label: model.label,
    description: model.description,
    segmentsCm: object.dimensions.segmentsCm,
    widthCm: object.dimensions.segmentsCm[0] ?? 0,
    heightCm: object.dimensions.heightCm,
  };
}

function objectToQuoteTransferItem(
  object: MeasuredObject,
  model: ModelDefinition,
): ArQuoteTransferItem | null {
  if (!model.productId) return null;

  const widthCm = object.dimensions.segmentsCm.reduce(
    (sum, segment) => sum + segment,
    0,
  );

  return {
    productId: model.productId,
    modelId: model.id,
    label: model.label,
    description: model.description,
    segmentsCm: object.dimensions.segmentsCm,
    widthCm,
    heightCm: object.dimensions.heightCm,
  };
}

function encodeArQuoteTransfer(payload: ArQuoteTransferPayload) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function frontendQuoteBaseUrl() {
  const env = (import.meta as unknown as { env?: { VITE_FRONTEND_URL?: string } }).env;
  const configured = env?.VITE_FRONTEND_URL?.trim();

  if (configured) return configured.replace(/\/+$/, "");

  const url = new URL(window.location.href);
  if ((url.hostname === "localhost" || url.hostname === "127.0.0.1") && url.port === "5173") {
    url.port = "3000";
    return url.origin;
  }

  return window.location.origin;
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
  categories: ModelCategory[];
  models: ModelDefinition[];
  activeCategoryId: ModelCategoryId;
  selectedModelId: string;
  onCategoryChange: (category: ModelCategoryId) => void;
  onSelectModel: (model: ModelDefinition) => void;
  searchQuery?: string;
  compact?: boolean;
  shop?: boolean;
}

function ModelCatalogPanel({
  categories,
  models,
  activeCategoryId,
  selectedModelId,
  onCategoryChange,
  onSelectModel,
  searchQuery = "",
  compact = false,
  shop = false,
}: ModelCatalogPanelProps) {
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const categoryModels =
    activeCategoryId === "all"
      ? models
      : models.filter((model) => model.category === activeCategoryId);
  const visibleModels = normalizedSearch
    ? categoryModels.filter((model) =>
        [model.label, model.description, model.category]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch),
      )
    : categoryModels;

  return (
    <div className={cn("grid gap-3", compact && "gap-2")}>
      {!shop && (
        <div
          className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Model categories"
        >
          {categories.map((category) => (
            <Button
              type="button"
              key={category.id}
              variant={category.id === activeCategoryId ? "secondary" : "dark"}
              size={compact ? "sm" : "default"}
              className={cn(
                "h-auto shrink-0 rounded-full px-4 py-2 text-left",
                category.id !== activeCategoryId &&
                  "border border-white/10 bg-slate-950/60 text-slate-200",
              )}
              onClick={() => onCategoryChange(category.id)}
            >
              <span className="grid gap-0.5">
                <strong className="text-xs leading-none">{category.label}</strong>
                {!compact && (
                  <span className="text-[10px] font-medium text-current/70">
                    {category.description}
                  </span>
                )}
              </span>
            </Button>
          ))}
        </div>
      )}

      <div
        className={cn(
          shop
            ? "grid grid-cols-2 gap-3"
            : "grid grid-flow-col auto-cols-[minmax(10.5rem,12.5rem)] gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [overscroll-behavior-x:contain] [&::-webkit-scrollbar]:hidden",
          compact && !shop && "auto-cols-[minmax(9.5rem,11rem)]",
        )}
      >
        {visibleModels.length === 0 ? (
          <Card
            className={cn(
              "grid min-h-28 place-items-center border-dashed p-4 text-center text-sm text-muted-foreground",
              shop ? "col-span-2 bg-card" : "bg-slate-950/50 text-slate-300",
            )}
          >
            No AR-ready models match this selection yet.
          </Card>
        ) : (
          visibleModels.map((model) => {
            const isSelected = model.id === selectedModelId;
            const color = OBJECT_TYPES[model.type].color;

            return (
              <Button
                type="button"
                key={model.id}
                variant="ghost"
                className="group h-auto min-w-0 justify-start p-0 text-left hover:bg-transparent"
                onClick={() => onSelectModel(model)}
              >
                <Card
                  className={cn(
                    "h-full overflow-hidden transition duration-200 group-active:scale-[0.98]",
                    shop
                      ? "border-border bg-card shadow-lg shadow-slate-200/60"
                      : "border-white/10 bg-white/10 text-white shadow-xl shadow-black/20 backdrop-blur-xl",
                    isSelected &&
                      (shop
                        ? "border-secondary ring-2 ring-secondary/30"
                        : "border-secondary bg-secondary/15 ring-2 ring-secondary/25"),
                  )}
                >
                  <CardContent className="p-2">
                    <div
                      className={cn(
                        "relative grid overflow-hidden rounded-xl",
                        shop ? "h-32 place-items-center bg-muted" : "h-24 place-items-center bg-white/10",
                      )}
                      style={{ border: `1px solid ${isSelected ? color : "transparent"}` }}
                    >
                      {model.thumbnail ? (
                        <img
                          src={normalizeCatalogAssetUrl(model.thumbnail)}
                          alt=""
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <Box className="size-10" style={{ color }} />
                      )}
                      {isSelected && (
                        <Badge
                          variant="secondary"
                          className="absolute right-2 top-2 gap-1 px-2"
                        >
                          <CheckCircle2 className="size-3" />
                          Selected
                        </Badge>
                      )}
                    </div>
                    <div className="mt-3 grid gap-1">
                      <strong
                        className={cn(
                          "truncate text-sm font-bold",
                          shop ? "text-foreground" : "text-white",
                        )}
                      >
                        {model.label}
                      </strong>
                      <small
                        className={cn(
                          "line-clamp-2 min-h-9 text-xs leading-snug",
                          shop ? "text-muted-foreground" : "text-slate-300",
                        )}
                      >
                        {model.description}
                      </small>
                      {model.price != null && (
                        <b className="mt-1 text-sm font-black text-primary">
                          {formatModelPrice(model.price, model.unit)}
                        </b>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Button>
            );
          })
        )}
      </div>
    </div>
  );
}

function formatModelPrice(price: number, unit?: string | null) {
  const formatted = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(price);

  return unit ? `${formatted} / ${unit}` : formatted;
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

function createV2ObjectLabel(
  id: number,
  model: ModelDefinition,
  dimensions: V2PlacedObject["dimensions"],
) {
  const label = createLabel(`${model.label} ${id}`, OBJECT_TYPES[model.type].color);
  label.position.set(0, dimensions.heightCm / 100 + 0.12, 0);

  return label;
}

function createV2ObjectModel(
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
      const fittedModel = fitCatalogModel(catalogModel, frame);
      group.add(fittedModel);
    })
    .catch((error) => {
      console.warn(`Unable to load model ${modelFile}`, error);
    });

  return group;
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
  const modelFile = normalizeCatalogAssetUrl(model.file);

  loadCatalogModel(modelFile)
    .then((catalogModel) => {
      const fittedModel = fitCatalogModel(catalogModel, frame);
      group.add(fittedModel);
    })
    .catch((error) => {
      console.warn(`Unable to load model ${modelFile}`, error);
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

function isV1Path(pathname: string) {
  return pathname === "/v1" || pathname.endsWith("/v1");
}

function flowPath(version: FlowVersion) {
  const prefix = window.location.pathname.startsWith("/ar") ? "/ar" : "";

  return `${prefix}/${version}`;
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
    depthWrite: false,
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
