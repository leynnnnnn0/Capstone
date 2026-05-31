import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Box,
  CheckCircle2,
  ChevronsDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUp,
  CircleHelp,
  ClipboardList,
  Grid3X3,
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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "./components/ui/drawer";
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
  type ModelVariantDefinition,
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

// V2/V3 placement uses a thin 3D panel/frame fitted to real-world centimeter
// dimensions. These constants keep the generated preview usable before the user
// starts adjusting height, width, rotation, or position.
const PREVIEW_MODEL_DEPTH_METERS = 0.012;
const V2_DEFAULT_WIDTH_CM = 120;
const V2_DEFAULT_HEIGHT_CM = 210;
const V2_DEFAULT_DEPTH_CM = 12;
const V2_NUDGE_METERS = 0.05;
const V2_ROTATE_RADIANS = THREE.MathUtils.degToRad(7.5);
const V2_WALL_BACK_OFFSET_METERS = 0.0762;
const V2_MAX_WALL_NORMAL_Y = 0.18;
const SAVED_AR_QUOTE_KEY = "sog-ar-saved-quote";
type CapturePhase = "shape" | "height";
type FlowVersion = "v1" | "v2" | "v3";
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
  // Refs hold WebXR and Three.js objects that must survive React renders without
  // causing rerenders every animation frame.
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const placementGestureLayerRef = useRef<HTMLDivElement | null>(null);
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

  // The AR route decides which measuring flow is active: v1 is point-to-point,
  // v2 is wall scan + placement, and v3 is the simplified placement experiment.
  const [flowVersion, setFlowVersionState] = useState<FlowVersion>(() =>
    flowVersionFromPath(window.location.pathname),
  );
  const [directArEntry] = useState(
    () => new URLSearchParams(window.location.search).get("direct") === "ar",
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
  const selectedV2ObjectIdRef = useRef<number | null>(null);
  const [v2WallLocked, setV2WallLocked] = useState(false);
  const [v2Mode, setV2ModeState] = useState<V2Mode>("scanWall");
  const [sessionPanelOpen, setSessionPanelOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [exitPromptOpen, setExitPromptOpen] = useState(false);
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
  const v3AutoPlacePendingRef = useRef(false);
  const v3PinchRef = useRef<{
    distance: number;
    widthCm: number;
    heightCm: number;
  } | null>(null);
  const v3DragRef = useRef<{
    startX: number;
    startY: number;
    moved: boolean;
    anchor: THREE.Vector3;
    anchorOffset: THREE.Vector3;
  } | null>(null);
  const selectedModel = getModelById(modelCatalog, selectedModelId);
  const isV2 = flowVersion === "v2";
  const isV3 = flowVersion === "v3";
  const isPlacementFlow = isV2 || isV3;
  const activeObjectCount = isPlacementFlow ? v2Objects.length : objects.length;
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

  useEffect(() => {
    const savedItems = readSavedArQuoteItems();

    if (savedItems.length > 0) {
      setManualQuoteItems(savedItems);
    }
  }, []);

  const confidenceCopy = useMemo(() => {
    if (isV2 && v2Mode === "scanWall") return "Scan the reference wall, then tap or press Lock Wall.";
    if (isV2 && v2Mode === "place") return "Wall locked. Tap any detected floor or wall area to place the model.";
    if (isV3 && v2Mode === "place") return "Tap a wall or floor to place the next model.";
    if (isPlacementFlow && v2Mode === "edit") return "Pinch to resize. Tap a wall or floor to move the model.";
    if (capturePhase === "height") return "Height point: tap the top/end of the vertical height.";
    if (confidence === "high") return "Surface locked. Tap to place a point.";
    if (confidence === "medium") return "Surface detected. Hold steady or tap.";
    if (confidence === "weak") return "Weak surface detection. Placement may be less accurate.";
    return "Shape points snap straight or 90-degree. Tap the outline, then press Finish Shape.";
  }, [capturePhase, confidence, isPlacementFlow, isV2, isV3, v2Mode]);

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
    selectedV2ObjectIdRef.current = selectedV2ObjectId;
  }, [selectedV2ObjectId]);

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

  // Quote summary items are derived from actual AR objects in the scene.
  // Manual quote items are separate because saved/catalog-selected products may
  // not have an active 3D object yet.
  const measuredQuoteItems = useMemo<SummaryQuoteItem[]>(() => {
    if (isPlacementFlow) {
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
  }, [findModel, isPlacementFlow, objects, v2Objects]);

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

  // Any tap on UI should temporarily block AR placement. Without this guard,
  // tapping a drawer/button could accidentally place or move a model behind it.
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
        flowVersionRef.current === "v2" || flowVersionRef.current === "v3"
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

  useEffect(() => {
    const targets = [canvasRef.current, placementGestureLayerRef.current].filter(
      (target): target is HTMLCanvasElement | HTMLDivElement => Boolean(target),
    );
    if (targets.length === 0) return;

    const startTouchGesture = (event: TouchEvent) => {
      if (
        flowVersionRef.current !== "v2" ||
        v2ModeRef.current !== "edit" ||
        !selectedV2Object ||
        event.touches.length !== 1
      ) {
        return;
      }

      const touch = event.touches.item(0);
      if (!touch) return;

      v3DragRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        moved: false,
        anchor: selectedV2Object.anchor.clone(),
        anchorOffset: selectedV2Object.anchorOffset.clone(),
      };
      v3PinchRef.current = null;
      markUiInteraction();
    };

    const moveTouchGesture = (event: TouchEvent) => {
      const drag = v3DragRef.current;
      if (
        flowVersionRef.current !== "v2" ||
        v2ModeRef.current !== "edit" ||
        !selectedV2Object ||
        event.touches.length !== 1 ||
        !drag
      ) {
        return;
      }

      const touch = event.touches.item(0);
      if (!touch) return;

      event.preventDefault();
      const dx = touch.clientX - drag.startX;
      const dy = touch.clientY - drag.startY;
      drag.moved = drag.moved || Math.hypot(dx, dy) > 6;
      const distancePerPixel = v3DragDistancePerPixel(selectedV2Object);
      const horizontalMove = selectedV2Object.widthDir
        .clone()
        .normalize()
        .multiplyScalar(dx * distancePerPixel);
      const verticalMove = selectedV2Object.heightDir
        .clone()
        .normalize()
        .multiplyScalar(-dy * distancePerPixel);
      const nextOffset = horizontalMove.add(verticalMove);

      updateV2ObjectTransform(selectedV2Object.id, (object) =>
        object.xrAnchor
          ? {
              anchorOffset: drag.anchorOffset.clone().add(nextOffset),
            }
          : {
              anchor: drag.anchor.clone().add(nextOffset),
            },
      );
    };

    const endTouchGesture = () => {
      v3PinchRef.current = null;
      v3DragRef.current = null;
    };

    const startTouchListener: EventListener = (event) =>
      startTouchGesture(event as TouchEvent);
    const moveTouchListener: EventListener = (event) =>
      moveTouchGesture(event as TouchEvent);

    targets.forEach((target) => {
      target.addEventListener("touchstart", startTouchListener, { passive: true });
      target.addEventListener("touchmove", moveTouchListener, { passive: false });
      target.addEventListener("touchend", endTouchGesture);
      target.addEventListener("touchcancel", endTouchGesture);
    });

    return () => {
      targets.forEach((target) => {
        target.removeEventListener("touchstart", startTouchListener);
        target.removeEventListener("touchmove", moveTouchListener);
        target.removeEventListener("touchend", endTouchGesture);
        target.removeEventListener("touchcancel", endTouchGesture);
      });
    };
  }, [isActive, isV2, markUiInteraction, selectedV2Object]);

  /**
   * Start the browser WebXR immersive-ar session.
   *
   * This initializes the renderer, hit testing, surface reticle, and flow-specific
   * placement state before the frame loop begins.
   */
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
      v3AutoPlacePendingRef.current = flowVersionRef.current === "v3";
      setV2Mode(flowVersionRef.current === "v3" ? "place" : "scanWall");
      setArGuideVisible(true);
      setMovementCoachVisible(false);
      noSurfaceSinceRef.current = null;
      lastViewerPositionRef.current = null;
      lastViewerMovementAtRef.current = performance.now();
      movementCoachCooldownUntilRef.current = performance.now() + 2500;
      setStatus(
        flowVersionRef.current === "v3"
          ? "V3: model will appear in front of you. Pinch to resize or tap a wall/floor to move it."
          : flowVersionRef.current === "v2"
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

  /**
   * End the active WebXR session. The session end event performs cleanup.
   */
  const endSession = async () => {
    await sessionRef.current?.end().catch(() => undefined);
  };

  const navigateToFrontendHome = () => {
    window.location.assign(new URL("/", frontendQuoteBaseUrl()).toString());
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
    if (
      (flowVersionRef.current === "v2" || flowVersionRef.current === "v3") &&
      v2ModeRef.current === "edit"
    ) {
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

  /**
   * Main AR animation loop.
   *
   * Every XR frame updates anchors, hit-test reticle state, coaching messages,
   * and then renders the Three.js scene through the WebXR camera.
   */
  const renderFrame = (_time: number, frame?: XRFrame) => {
    const measurementScene = sceneRef.current;
    const localSpace = localSpaceRef.current;
    const hitTestSource = hitTestSourceRef.current;
    if (!measurementScene || !frame || !localSpace || !hitTestSource) return;

    const now = performance.now();
    trackViewerMotion(frame, localSpace, now);
    placeV3InitialObjectIfNeeded();

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

  /**
   * V1 measurement tap handler. It records outline points and a height point.
   */
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

    if (flowVersionRef.current === "v3") {
      void placeV3ObjectFromHit(position);
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

  /**
   * V2 wall scan step. The wall plane becomes the reference for straight doors
   * and windows, while the next tap chooses where the model is placed.
   */
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

  /**
   * Prepare the next item. Each new product starts by asking for a wall again so
   * a previous wall scan is not accidentally reused in another location.
   */
  const doAnotherV2Object = () => {
    markUiInteraction();

    if (flowVersionRef.current === "v3") {
      setV2Mode("place");
      selectedV2ObjectIdRef.current = null;
      setSelectedV2ObjectId(null);
      v3AutoPlacePendingRef.current = true;
      setSessionPanelOpen(false);
      setCatalogOpen(false);
      setSummaryOpen(false);
      setStatus("Ready for another item. Tap a wall or floor, or wait for it to appear in front of you.");
      return;
    }

    v2LockedWallRef.current = null;
    setV2WallLocked(false);
    selectedV2ObjectIdRef.current = null;
    setSelectedV2ObjectId(null);
    setV2Mode("scanWall");
    setSessionPanelOpen(false);
    setShopDetailModel(null);
    setCatalogOpen(true);
    setSummaryOpen(false);
    setStatus("Choose the next product, then scan and lock its reference wall.");
  };

  /**
   * Create the Three.js object used by V2/V3 placement.
   *
   * It fits the product GLB into a centimeter-sized frame, adds a label, applies
   * world-space axes, and attempts to attach an XR anchor for better stability.
   */
  const createPlacedObject = async (
    anchor: THREE.Vector3,
    axes: V2PlacementAxes,
    hitResult?: XRHitTestResultWithAnchor | null,
  ) => {
    const measurementScene = sceneRef.current;
    const localSpace = localSpaceRef.current;
    if (!measurementScene) return null;

    const selectedModel = findModel(selectedModelIdRef.current);
    const dimensions = defaultV2DimensionsForModel(selectedModel);
    const root = new THREE.Group();
    const model = createV2ObjectModel(dimensions, selectedModel);
    const label = createV2ObjectLabel(nextV2ObjectIdRef.current, selectedModel, dimensions);
    const anchorOffset =
      flowVersionRef.current === "v2"
        ? axes.depthDir.clone().multiplyScalar(-V2_WALL_BACK_OFFSET_METERS)
        : new THREE.Vector3();

    setV2RootTransform(root, anchor.clone().add(anchorOffset), axes);
    root.name = `${flowVersionRef.current}-placed-object-${nextV2ObjectIdRef.current}`;
    root.add(model);
    root.add(label);
    measurementScene.scene.add(root);

    const xrAnchor =
      localSpace && hitResult?.createAnchor
        ? await createV2XrAnchor(hitResult).catch((error) => {
            log(`anchor unavailable: ${error instanceof Error ? error.message : String(error)}`);
            return null;
          })
        : null;

    const object: V2PlacedObject = {
      id: nextV2ObjectIdRef.current,
      type: selectedModel.type,
      modelId: selectedModel.id,
      root,
      model,
      label,
      anchor: anchor.clone(),
      anchorOffset,
      xrAnchor,
      widthDir: axes.widthDir,
      heightDir: axes.heightDir,
      depthDir: axes.depthDir,
      dimensions,
    };

    nextV2ObjectIdRef.current += 1;
    v2ObjectsRef.current = [...v2ObjectsRef.current, object];
    setV2Objects(v2ObjectsRef.current);
    selectedV2ObjectIdRef.current = object.id;
    setSelectedV2ObjectId(object.id);
    setV2Mode("edit");
    setStatus(`Item ${object.id} placed. Pinch or use controls to resize.`);
    return object;
  };

  const placeV3InitialObjectIfNeeded = () => {
    const measurementScene = sceneRef.current;
    if (
      flowVersionRef.current !== "v3" ||
      !v3AutoPlacePendingRef.current ||
      !measurementScene
    ) {
      return;
    }

    const anchor = getPointInFrontOfCamera(measurementScene.camera, 1.25);
    const axes = createCameraFacingPlacementAxes(measurementScene.camera);
    v3AutoPlacePendingRef.current = false;
    void createPlacedObject(anchor, axes);
  };

  const placeV3ObjectFromHit = async (position: THREE.Vector3) => {
    const measurementScene = sceneRef.current;
    const hitPlane = currentHitPlaneRef.current;
    const hitResult = currentHitResultRef.current;

    if (!measurementScene || !hitPlane) {
      setStatus("No surface detected yet. Move camera slowly.");
      return;
    }

    const placementPlane =
      hitPlane.kind === "floor"
        ? copyMeasurementPlane(hitPlane, position)
        : createCleanV2WallPlane(hitPlane, position) ?? copyMeasurementPlane(hitPlane, position);
    const anchor = projectPointToPlane(position, placementPlane);
    const axes = createPlacementAxes(placementPlane, measurementScene.camera);

    const selectedObjectId = selectedV2ObjectIdRef.current;

    if (v2ModeRef.current === "edit" && selectedObjectId != null) {
      updateV2ObjectTransform(selectedObjectId, (object) => ({
        anchor,
        anchorOffset: new THREE.Vector3(),
        widthDir: axes.widthDir,
        heightDir: axes.heightDir,
        depthDir: axes.depthDir,
      }));
      setStatus("Item moved to the detected surface.");
      return;
    }

    await createPlacedObject(anchor, axes, hitResult);
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
    selectedV2ObjectIdRef.current = object.id;
    setSelectedV2ObjectId(object.id);
    setV2Mode("edit");
    setStatus(
      xrAnchor
        ? `Item ${object.id} anchored. Adjust it, or tap Do Another.`
        : `Item ${object.id} placed. Adjust it, or tap Do Another.`,
    );
    log(`v2 item ${object.id} placed`);
  };

  /**
   * Update height/width/depth for a placed object and rebuild its visual frame.
   */
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

  /**
   * Move or rotate a placed object while keeping its local axes consistent.
   */
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

  /**
   * Refit the GLB and generated frame after dimension/model changes.
   */
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
    selectedV2ObjectIdRef.current = object.id;
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
    selectedV2ObjectIdRef.current = objectId;
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
    selectedV2ObjectIdRef.current =
      selectedV2ObjectIdRef.current === objectId
        ? nextObjects.at(-1)?.id ?? null
        : selectedV2ObjectIdRef.current;
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
    v3AutoPlacePendingRef.current = false;
    v3PinchRef.current = null;
    v3DragRef.current = null;
    lastPlacementPositionRef.current = null;
    nextObjectIdRef.current = 1;
    nextV2ObjectIdRef.current = 1;
    setPoints([]);
    setObjects([]);
    setV2Objects([]);
    setSelectedObjectId(null);
    selectedV2ObjectIdRef.current = null;
    setSelectedV2ObjectId(null);
    setV2WallLocked(false);
    setV2Mode("scanWall");
    setReassignCategoryId(DEFAULT_MODEL.category);
    capturePhaseRef.current = "shape";
    setCapturePhase("shape");
    setStatus("Session cleared.");
  };

  const openSummary = () => {
    markUiInteraction();
    setSessionPanelOpen(false);
    setCatalogOpen(false);
    setExitPromptOpen(false);
    setSummaryOpen(true);
  };

  const getQuoteTransferItems = () =>
      flowVersionRef.current === "v2" || flowVersionRef.current === "v3"
        ? [
            ...manualQuoteItems,
            ...v2ObjectsRef.current
              .map((object) => v2ObjectToQuoteTransferItem(object, findModel(object.modelId)))
              .filter((item): item is ArQuoteTransferItem => Boolean(item)),
          ]
        : objectsRef.current
            .map((object) => objectToQuoteTransferItem(object, findModel(object.modelId)))
            .filter((item): item is ArQuoteTransferItem => Boolean(item));

  const requestExitSession = () => {
    markUiInteraction();

    if (summaryQuoteItems.length > 0) {
      setSessionPanelOpen(false);
      setCatalogOpen(false);
      setSummaryOpen(false);
      setExitPromptOpen(true);
      return;
    }

    void endSession().then(navigateToFrontendHome);
  };

  const saveQuoteForLaterAndExit = () => {
    markUiInteraction();

    const items = getQuoteTransferItems();
    if (items.length > 0) {
      try {
        localStorage.setItem(
          SAVED_AR_QUOTE_KEY,
          JSON.stringify({
            source: "sog-ar",
            version: 1,
            createdAt: new Date().toISOString(),
            items,
          } satisfies ArQuoteTransferPayload),
        );
      } catch {
        setStatus("Could not save quote items on this device.");
      }
    }

    setExitPromptOpen(false);
    void endSession().then(navigateToFrontendHome);
  };

  const discardQuoteAndExit = () => {
    markUiInteraction();
    try {
      localStorage.removeItem(SAVED_AR_QUOTE_KEY);
    } catch {
      void 0;
    }
    setManualQuoteItems([]);
    setExitPromptOpen(false);
    void endSession().then(navigateToFrontendHome);
  };

  /**
   * Send AR measurements to the Next.js quote page.
   *
   * The payload is base64url JSON so it can pass through the query string without
   * losing measurement arrays or product IDs.
   */
  const proceedToQuoteRequest = () => {
    markUiInteraction();

    const items = getQuoteTransferItems();

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
        {isActive && isV2 && v2Mode === "edit" && selectedV2Object && (
          <div
            ref={placementGestureLayerRef}
            className="placement-gesture-layer"
            aria-hidden="true"
          />
        )}

        {isActive ? (
          <header
            className="ar-mobile-header"
            data-xr-ui="true"
            onPointerDown={markUiInteraction}
          >
            <button type="button" aria-label="End AR session" onClick={requestExitSession}>
              <ArrowLeft className="size-5" />
            </button>
            <div>
              <strong>{selectedV2Object ? findModel(selectedV2Object.modelId).label : selectedModel.label}</strong>
              <span>Current item. Tap to change.</span>
            </div>
            <button type="button" aria-label="Open guide" onClick={() => setArGuideVisible(true)}>
              <CircleHelp className="size-5" />
            </button>
          </header>
        ) : directArEntry ? (
          <DirectArEntry
            selectedModel={selectedModel}
            catalogStatus={catalogStatus}
            onStartSession={startSession}
          />
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
                          <strong>{isV3 ? "Place naturally" : isV2 ? "Lock the wall" : "Tap the outline"}</strong>
                          {isV3
                            ? "The model appears in front first. Tap a wall or floor to move and orient it."
                            : isV2
                            ? "Aim at the reference wall first, then tap or press Lock Wall."
                            : "Place points along the shape. Lines will snap straight or 90-degree where possible."}
                        </span>
                      </article>
                      <article>
                        <Ruler className="size-5" />
                        <span>
                          <strong>{isPlacementFlow ? "Adjust size" : "Finish, then height"}</strong>
                          {isV3
                            ? "Pinch the screen to resize. Width and height labels update with the model."
                            : isV2
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
                      {isV3
                        ? "Tip: tap any detected wall or floor to move the selected model. Use Do Another for multiple items."
                        : isV2
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

        {isActive && isPlacementFlow && v2Mode === "edit" && selectedV2Object && (
          <p className="ar-move-hint">Hold and move the item if needed</p>
        )}

        {isActive && (!isV2 || v2Mode !== "edit") && (
          <div className={`reticle ${confidence}`}>
            <span />
            <p>{confidenceCopy}</p>
          </div>
        )}

        {isActive && (
          <div
            className="ar-bottom-nav"
            data-xr-ui="true"
            onPointerDown={markUiInteraction}
          >
            <button
              type="button"
              onClick={() => {
                if (isPlacementFlow) {
                  if (selectedV2Object) deleteV2Object(selectedV2Object.id);
                  return;
                }
                undoPoint();
              }}
            >
              <Undo2 className="size-5" />
              <span>Undo</span>
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
              <Grid3X3 className="size-5" />
              <span>Products</span>
            </button>
            <button
              type="button"
              className="ar-capture-button"
              onClick={() => {
                if (!isPlacementFlow) {
                  finishShape();
                  return;
                }

                if (isV3 || v2Mode === "edit") {
                  doAnotherV2Object();
                  return;
                }

                if (v2WallLocked) {
                  rescanV2Wall();
                  return;
                }

                lockV2WallFromHit();
              }}
            >
              <span />
            </button>
            <button type="button" onClick={openSummary}>
              <ClipboardList className="size-5" />
              <span>Quote Items</span>
              {activeObjectCount > 0 && <i>{activeObjectCount}</i>}
            </button>
            <button type="button" onClick={resetAll}>
              <Trash2 className="size-5" />
              <span>Reset</span>
            </button>
          </div>
        )}

        {isActive &&
          isPlacementFlow &&
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
              <div className="v2-size-panel-actions">
                <button type="button" onClick={() => setSelectedV2ObjectId(null)}>
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShopDetailModel(null);
                    setCatalogOpen(true);
                  }}
                >
                  Change Model
                </button>
                <button type="button" onClick={doAnotherV2Object}>
                  Add New Product
                </button>
              </div>
              <div className="v2-size-panel-header">
                <div>
                  <small>Glass</small>
                  <strong>{findModel(selectedV2Object.modelId).label}</strong>
                </div>
                <span>
                  {selectedV2Object.dimensions.segmentsCm[0]}x{selectedV2Object.dimensions.heightCm}
                </span>
              </div>
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
              label="Width"
              value={selectedV2Object.dimensions.segmentsCm[0] ?? V2_DEFAULT_WIDTH_CM}
              onChange={(value) =>
                updateV2ObjectDimensions(selectedV2Object.id, {
                  segmentsCm: [value],
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
                Rotate L
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
                Rotate R
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

        <Drawer open={isActive && catalogOpen} onOpenChange={setCatalogOpen}>
          <DrawerContent
            className="grid gap-4 ar-product-drawer"
            data-xr-ui="true"
            onPointerDown={markUiInteraction}
          >
            <DrawerHeader>
              <div>
                <DrawerTitle>
                  {shopDetailModel ? shopDetailModel.label : "Discover products"}
                </DrawerTitle>
                <DrawerDescription>
                  {shopDetailModel
                    ? "Review details, variants, then select it for AR."
                    : "Pick the model before placing it."}
                </DrawerDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full text-slate-500"
                onClick={() => {
                  if (shopDetailModel) {
                    setShopDetailModel(null);
                    return;
                  }
                  setCatalogOpen(false);
                }}
              >
                {shopDetailModel ? (
                  <ArrowLeft className="size-5" />
                ) : (
                  <X className="size-5" />
                )}
              </Button>
            </DrawerHeader>
            {shopDetailModel ? (
              <ArProductDrawerDetail
                model={shopDetailModel}
                relatedModels={relatedShopModels}
                onSelect={(model) => {
                  if (selectedV2Object) {
                    changeV2ObjectModel(selectedV2Object.id, model);
                    setCatalogOpen(false);
                  } else {
                    selectModel(model, true);
                  }
                  setShopDetailModel(null);
                }}
                onOpenDetail={(model) => setShopDetailModel(model)}
              />
            ) : (
              <>
                <label className="ar-drawer-search">
                  <ScanLine className="size-5" />
                  <input
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                    placeholder="Search for product"
                  />
                </label>
                <ModelCatalogPanel
                  categories={modelCategories}
                  models={modelCatalog}
                  activeCategoryId={selectedCategoryId}
                  selectedModelId={selectedModelId}
                  onCategoryChange={setSelectedCategoryId}
                  onSelectModel={(model) => {
                    if (selectedV2Object) {
                      changeV2ObjectModel(selectedV2Object.id, model);
                      setCatalogOpen(false);
                      setShopDetailModel(null);
                    } else {
                      selectModel(model);
                      setShopDetailModel(model);
                    }
                  }}
                  searchQuery={productSearch}
                  compact
                  shop
                />
              </>
            )}
          </DrawerContent>
        </Drawer>

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
              ) : isPlacementFlow ? (
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

            {isPlacementFlow && selectedV2Object && (
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

        <Drawer open={summaryOpen} onOpenChange={setSummaryOpen}>
          <DrawerContent
            className="grid gap-4 ar-quote-drawer"
            data-xr-ui="true"
            onPointerDown={markUiInteraction}
          >
            <DrawerHeader>
              <div>
                <DrawerTitle>Quote Summary</DrawerTitle>
                <DrawerDescription>
                  Tap an AR item to go back and modify it.
                </DrawerDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full text-slate-500"
                onClick={() => setSummaryOpen(false)}
              >
                <X className="size-5" />
              </Button>
            </DrawerHeader>

            <div className="summary-card">
              <div className="summary-list">
                {summaryQuoteItems.length === 0 ? (
                  <div className="summary-empty">No objects captured yet.</div>
                ) : (
                  summaryQuoteItems.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className="summary-item-button"
                      onClick={() => {
                        if (item.id > 0 && isPlacementFlow) {
                          const object = v2ObjectsRef.current.find(
                            (candidate) => candidate.id === item.id,
                          );
                          if (object) {
                            selectV2Object(object);
                            setSummaryOpen(false);
                          }
                          return;
                        }

                        if (item.id > 0) {
                          const object = objectsRef.current.find(
                            (candidate) => candidate.id === item.id,
                          );
                          if (object) {
                            selectCompletedObject(object);
                            setSummaryOpen(false);
                          }
                        }
                      }}
                    >
                      <span className="summary-item-copy">
                        <strong>{item.label}</strong>
                        <small>{item.id > 0 ? "AR measured item" : "Selected product"}</small>
                        <p>{item.dimensionsText}</p>
                        <p>1 pc</p>
                      </span>
                      <strong className="summary-item-price">
                        {item.price == null
                          ? "Price pending"
                          : formatQuoteCurrency(item.price)}
                      </strong>
                    </button>
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
            </div>
          </DrawerContent>
        </Drawer>

        <Drawer open={exitPromptOpen} onOpenChange={setExitPromptOpen}>
          <DrawerContent
            className="grid gap-4 ar-exit-drawer"
            data-xr-ui="true"
            onPointerDown={markUiInteraction}
          >
            <DrawerHeader>
              <div>
                <DrawerTitle>Keep your quote items?</DrawerTitle>
                <DrawerDescription>
                  You have {summaryQuoteItems.length} item
                  {summaryQuoteItems.length === 1 ? "" : "s"} in this AR session.
                </DrawerDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full text-slate-500"
                onClick={() => setExitPromptOpen(false)}
              >
                <X className="size-5" />
              </Button>
            </DrawerHeader>

            <div className="ar-exit-card">
              <div>
                <strong>Save for later</strong>
                <p>
                  Keep these AR quote items on this device and return to the main site.
                </p>
              </div>
              <div className="ar-exit-actions">
                <Button type="button" onClick={saveQuoteForLaterAndExit}>
                  Save for later
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={discardQuoteAndExit}
                >
                  Discard and Exit
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
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
    const cameraPosition = new THREE.Vector3();
    camera.getWorldPosition(cameraPosition);
    const cameraDirection = cameraPosition.sub(plane.anchor);
    if (normal.dot(cameraDirection) < 0) {
      normal.multiplyScalar(-1);
    }

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

function v3DragDistancePerPixel(object: V2PlacedObject) {
  const widthMeters = (object.dimensions.segmentsCm[0] ?? V2_DEFAULT_WIDTH_CM) / 100;
  const heightMeters = object.dimensions.heightCm / 100;
  const sizeFactor = Math.max(widthMeters, heightMeters, 1);

  return THREE.MathUtils.clamp(sizeFactor / 650, 0.0015, 0.006);
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
          onClick={() => onChange(Math.max(5, value - 5))}
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

function DirectArEntry({
  selectedModel,
  catalogStatus,
  onStartSession,
}: {
  selectedModel: ModelDefinition;
  catalogStatus: string;
  onStartSession: () => void;
}) {
  return (
    <section className="direct-ar-entry">
      <div className="direct-ar-card">
        <span className="direct-ar-eyebrow">SOG AR preview</span>
        <h1>Place products in your space.</h1>
        <p>
          Start AR now. Products, quote items, and adjustments are available inside
          the AR toolbar.
        </p>
        <div className="direct-ar-selected">
          <Box className="size-5" />
          <span>{selectedModel.label}</span>
        </div>
        <button type="button" onClick={onStartSession}>
          <Play className="size-5" />
          Start AR
        </button>
        <small>{catalogStatus}</small>
      </div>
    </section>
  );
}

function ArProductDrawerDetail({
  model,
  relatedModels,
  onSelect,
  onOpenDetail,
}: {
  model: ModelDefinition;
  relatedModels: ModelDefinition[];
  onSelect: (model: ModelDefinition) => void;
  onOpenDetail: (model: ModelDefinition) => void;
}) {
  const images = drawerProductImages(model);
  const [selectedImage, setSelectedImage] = useState(images[0] ?? null);

  useEffect(() => {
    setSelectedImage(images[0] ?? null);
  }, [model.id, images[0]]);

  return (
    <div className="ar-product-detail">
      <div className="ar-product-hero">
        {selectedImage ? (
          <img src={normalizeCatalogAssetUrl(selectedImage)} alt="" />
        ) : (
          <Box className="size-14 text-slate-400" />
        )}
      </div>

      {images.length > 1 && (
        <div className="ar-product-thumbs">
          {images.slice(0, 5).map((image) => (
            <button
              type="button"
              key={normalizeCatalogAssetUrl(image)}
              className={image === selectedImage ? "selected" : ""}
              onClick={() => setSelectedImage(image)}
            >
              <img src={normalizeCatalogAssetUrl(image)} alt="" />
            </button>
          ))}
        </div>
      )}

      <div className="ar-product-copy">
        <div>
          <p>{OBJECT_TYPES[model.type].label}</p>
          <h3>{model.label}</h3>
        </div>
        {model.defaultWidthCm && model.defaultHeightCm && (
          <strong>{model.defaultWidthCm}x{model.defaultHeightCm}</strong>
        )}
      </div>
      <p className="ar-product-description">{model.description}</p>

      {model.variants?.length ? (
        <div className="ar-product-section">
          <h4>Variants</h4>
          <div className="ar-variant-list">
            {model.variants.slice(0, 6).map((variant) => {
              const variantModel = variantToModel(model, variant);

              return (
                <button
                  type="button"
                  key={variant.id}
                  onClick={() => onOpenDetail(variantModel)}
                >
                  {variant.thumbnail ? (
                    <img src={normalizeCatalogAssetUrl(variant.thumbnail)} alt="" />
                  ) : (
                    <Box className="size-7 text-white" />
                  )}
                  <span>
                    <strong>{variant.label}</strong>
                    <small>
                      {[variant.widthCm, variant.heightCm].filter(Boolean).join("x")}
                    </small>
                  </span>
                  <ChevronsRight className="size-5" />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {relatedModels.length > 0 && (
        <div className="ar-product-section">
          <h4>Related products</h4>
          <div className="ar-related-list">
            {relatedModels.map((relatedModel) => (
              <button
                type="button"
                key={relatedModel.id}
                onClick={() => onOpenDetail(relatedModel)}
              >
                {relatedModel.thumbnail ? (
                  <img src={normalizeCatalogAssetUrl(relatedModel.thumbnail)} alt="" />
                ) : (
                  <Box className="size-9 text-slate-400" />
                )}
                <strong>{relatedModel.label}</strong>
              </button>
            ))}
          </div>
        </div>
      )}

      <Button
        type="button"
        size="lg"
        className="h-14 rounded-full bg-[#91abeb] text-base font-black text-white hover:bg-[#7f9ce2]"
        onClick={() => onSelect(model)}
      >
        Select
      </Button>
    </div>
  );
}

function drawerProductImages(model: ModelDefinition) {
  const images = [
    model.thumbnail,
    ...(model.images ?? []),
    ...(model.variants?.map((variant) => variant.thumbnail) ?? []),
  ].filter((image): image is string => Boolean(image));

  return [...new Map(images.map((image) => [normalizeCatalogAssetUrl(image), image])).values()];
}

function variantToModel(
  parent: ModelDefinition,
  variant: ModelVariantDefinition,
): ModelDefinition {
  return {
    ...parent,
    id: `${parent.id}-${variant.id}`,
    label: variant.label || parent.label,
    description:
      variant.widthCm && variant.heightCm
        ? `${parent.label} variant sized ${variant.widthCm} x ${variant.heightCm} cm.`
        : parent.description,
    thumbnail: variant.thumbnail ?? parent.thumbnail ?? null,
    images: variant.thumbnail ? [variant.thumbnail] : parent.images,
    variants: [],
    defaultWidthCm: variant.widthCm ?? parent.defaultWidthCm ?? null,
    defaultHeightCm: variant.heightCm ?? parent.defaultHeightCm ?? null,
    price: variant.price ?? parent.price ?? null,
    unit: variant.price == null ? parent.unit : null,
  };
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

function readSavedArQuoteItems() {
  try {
    const raw = localStorage.getItem(SAVED_AR_QUOTE_KEY);
    if (!raw) return [];

    const payload = JSON.parse(raw) as Partial<ArQuoteTransferPayload>;
    if (payload.source !== "sog-ar" || !Array.isArray(payload.items)) return [];

    return payload.items.filter(isArQuoteTransferItem);
  } catch {
    return [];
  }
}

function isArQuoteTransferItem(item: unknown): item is ArQuoteTransferItem {
  if (!item || typeof item !== "object") return false;

  const value = item as Record<string, unknown>;
  return (
    typeof value.productId === "number" &&
    typeof value.modelId === "string" &&
    typeof value.label === "string" &&
    typeof value.description === "string" &&
    Array.isArray(value.segmentsCm) &&
    value.segmentsCm.every((segment) => typeof segment === "number") &&
    typeof value.widthCm === "number" &&
    typeof value.heightCm === "number"
  );
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
      <div
        className={cn(
          "flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          shop && "gap-3 py-1",
        )}
        aria-label="Model categories"
      >
        {categories.map((category) => (
          <Button
            type="button"
            key={category.id}
            variant={shop ? "ghost" : category.id === activeCategoryId ? "secondary" : "dark"}
            size={compact ? "sm" : "default"}
            className={cn(
              "h-auto shrink-0 rounded-full px-4 py-2 text-left",
              shop && "min-h-12 px-5 text-base shadow-sm",
              category.id !== activeCategoryId &&
                (shop
                  ? "border border-slate-100 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  : "border border-white/10 bg-slate-950/60 text-slate-200"),
              category.id === activeCategoryId &&
                shop &&
                "bg-[#608db9] text-white hover:bg-[#527fa9]",
            )}
            onClick={() => onCategoryChange(category.id)}
          >
            <span className="grid gap-0.5">
              <strong className={cn("text-xs leading-none", shop && "text-base")}>
                {category.label}
              </strong>
              {!compact && (
                <span className="text-[10px] font-medium text-current/70">
                  {category.description}
                </span>
              )}
            </span>
          </Button>
        ))}
      </div>

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
                        shop
                          ? "h-40 place-items-center bg-muted"
                          : "h-24 place-items-center bg-white/10",
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
                          shop && "text-lg",
                          shop ? "text-foreground" : "text-white",
                        )}
                      >
                        {model.label}
                      </strong>
                      <small
                        className={cn(
                          "line-clamp-2 min-h-9 text-xs leading-snug",
                          shop && "text-sm",
                          shop ? "text-muted-foreground" : "text-slate-300",
                        )}
                      >
                        {model.description}
                      </small>
                      {model.price != null && (
                        <b className={cn("mt-1 text-sm font-black text-primary", shop && "text-base")}>
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
      const fittedModel = fitCatalogModel(catalogModel, frame, model);
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
      const fittedModel = fitCatalogModel(catalogModel, frame, model);
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

function flowVersionFromPath(pathname: string): FlowVersion {
  if (pathname === "/v1" || pathname.endsWith("/v1")) return "v1";
  if (pathname === "/v3" || pathname.endsWith("/v3")) return "v3";
  return "v2";
}

function flowPath(version: FlowVersion) {
  const prefix = window.location.pathname.startsWith("/ar") ? "/ar" : "";

  return `${prefix}/${version}`;
}

function getPointInFrontOfCamera(camera: THREE.Camera, distance: number) {
  const position = new THREE.Vector3();
  const forward = new THREE.Vector3();
  camera.getWorldPosition(position);
  camera.getWorldDirection(forward);

  if (forward.lengthSq() < 0.0001) {
    forward.set(0, 0, -1);
  }

  return position.add(forward.normalize().multiplyScalar(distance));
}

function createCameraFacingPlacementAxes(camera: THREE.Camera): V2PlacementAxes {
  const worldUp = new THREE.Vector3(0, 1, 0);
  const cameraForward = new THREE.Vector3();
  camera.getWorldDirection(cameraForward);

  const depthDir = cameraForward.clone().setY(0).multiplyScalar(-1);
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
  if (definition.type !== "window") {
    return;
  }

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
      size,
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
