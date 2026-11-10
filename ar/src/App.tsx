import { v2Guidance } from "./features/measurement/v2-guidance";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Grid3X3,
  ScanLine,
  Trash2,
  Undo2,
} from "lucide-react";
import * as THREE from "three";
import { ArShop } from "./components/shop/ArShop";
import { computeDimensions } from "./features/measurement/dimensions";
import {
  DEFAULT_MODEL,
  fetchProductModelCatalog,
  getModelById,
  MODEL_CATALOG,
  MODEL_CATEGORIES,
  type ModelCategoryId,
  type ModelCategory,
  type ModelDefinition,
} from "./features/measurement/model-catalog";
import {
  createGlassModel,
  createMarker,
  createObjectLabel,
  createSegment,
  createV2ObjectLabel,
  createV2ObjectModel,
  getPreferredPlaneKind,
  getViewerForward,
  loadV2DefaultDimensions,
  recolorMeasurementGuides,
  setReticleColor,
} from "./features/measurement/model-visuals";
import { OBJECT_TYPES } from "./features/measurement/object-types";
import {
  appendSurfaceSample,
  applyAnchorPoseToObject,
  createAnchorRelativeMatrix,
  createCleanV2WallPlane,
  createV2XrAnchor,
  defaultV2DimensionsForModel,
  formatV2Dimensions,
  normalizeV2Dimensions,
  stabilizeSurface,
  syncObjectAnchorRelativeMatrix,
  v3DragDistancePerPixel,
} from "./features/measurement/placement-helpers";
import {
  createPlacementAxes,
  setV2RootTransform,
} from "./features/measurement/wall-placement";
import {
  encodeArQuoteTransfer,
  flowVersionFromPath,
  frontendQuoteBaseUrl,
} from "./features/measurement/quote-handoff";
import {
  createMeasurementScene,
  disposeObject,
  resizeMeasurementScene,
  type MeasurementScene,
} from "./features/measurement/scene";
import { useQuoteWorkspace } from "./features/measurement/use-quote-workspace";
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
import { getCenterDepthMeters, requestHitTestSession } from "./features/measurement/xr-session";
import {
  VERSION,
  type AnchorTrackingState,
  type CapturePhase,
  type FlowVersion,
  type SurfaceSample,
  type V2Mode,
  type V2PlacedObject,
  type V2PlacementAxes,
  type XRHitTestResultWithAnchor,
} from "./features/measurement/workspace-types";
import {
  DirectArEntry,
  SessionObjectsPanel,
} from "./features/measurement/workspace-components";
import {
  ExitPromptDrawer,
  ProductCatalogDrawer,
  QuoteSummaryDrawer,
} from "./features/measurement/workspace-drawers";
import {
  ArGuidanceOverlays,
  PlacementEditor,
} from "./features/measurement/workspace-overlays";
import {
  arStageName,
  confidenceInstruction,
  primaryArAction,
  relatedCatalogModels,
  selectedById,
} from "./features/measurement/workspace-selectors";

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
  const currentHitPoseMatrixRef = useRef<THREE.Matrix4 | null>(null);
  const shapePlaneRef = useRef<MeasurementPlane | null>(null);
  const v2PreviewRef = useRef<{ model: THREE.Group; height: number; width: number } | null>(null);
  const v2WallReadyRef = useRef(false);
  const v2PlacementRequestedRef = useRef(false);
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
  const anchoredPlacementPendingRef = useRef(false);
  const missedHitFramesRef = useRef(0);
  const surfaceSamplesRef = useRef<SurfaceSample[]>([]);
  const anchorTrackingStateRef = useRef<AnchorTrackingState>("idle");
  const nextObjectIdRef = useRef(1);
  const nextV2ObjectIdRef = useRef(1);

  // The AR route decides which measuring flow is active: v1 is point-to-point,
  // v2 previews and places products on walls, and v3 is a placement experiment.
  const [flowVersion] = useState<FlowVersion>(() =>
    flowVersionFromPath(window.location.pathname),
  );
  const [directArEntry] = useState(
    () => new URLSearchParams(window.location.search).get("direct") === "ar",
  );
  const [requestedProductId] = useState<number | null>(() => {
    const value = Number(
      new URLSearchParams(window.location.search).get("product"),
    );

    return Number.isSafeInteger(value) && value > 0 ? value : null;
  });
  const [feedback, setFeedback] = useState<{ message: string } | null>(null);
  const setStatus = useCallback((message: string) => setFeedback({ message }), []);
  const [isStarting, setIsStarting] = useState(false);
  const startingRef = useRef(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [scanSeconds, setScanSeconds] = useState(0);
  const [wallEligible, setWallEligible] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [catalogStatus, setCatalogStatus] = useState("Loading products...");
  const [catalogReady, setCatalogReady] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [confidence, setConfidence] = useState<ReticleConfidence>("none");
  const [anchorTrackingState, setAnchorTrackingState] =
    useState<AnchorTrackingState>("idle");
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
  const [, setPoints] = useState<MeasurementPoint[]>([]);
  const pointsRef = useRef<MeasurementPoint[]>([]);
  const segmentsRef = useRef<MeasurementSegment[]>([]);
  const [objects, setObjects] = useState<MeasuredObject[]>([]);
  const objectsRef = useRef<MeasuredObject[]>([]);
  const [v2Objects, setV2Objects] = useState<V2PlacedObject[]>([]);
  const v2ObjectsRef = useRef<V2PlacedObject[]>([]);
  const [selectedV2ObjectId, setSelectedV2ObjectId] = useState<number | null>(null);
  const selectedV2ObjectIdRef = useRef<number | null>(null);
  const [v2Mode, setV2ModeState] = useState<V2Mode>("place");
  const [sessionPanelOpen, setSessionPanelOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [exitPromptOpen, setExitPromptOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const clearDialogRef = useRef<HTMLElement | null>(null);
  const confirmClearRef = useRef(false);
  confirmClearRef.current = confirmClear;
  const sessionPanelOpenRef = useRef(false);
  const summaryOpenRef = useRef(false);
  const catalogOpenRef = useRef(false);
  const showArGuideRef = useRef(false);
  const showMovementCoachRef = useRef(false);
  const modelCatalogRef = useRef<ModelDefinition[]>(MODEL_CATALOG);
  const flowVersionRef = useRef<FlowVersion>(flowVersion);
  const v2ModeRef = useRef<V2Mode>("place");
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
  const relatedShopModels = relatedCatalogModels(
    modelCatalog,
    selectedModel,
    shopDetailModel,
  );
  const selectedObject = useMemo(
    () => selectedById(objects, selectedObjectId),
    [objects, selectedObjectId],
  );
  const selectedV2Object = useMemo(
    () => selectedById(v2Objects, selectedV2ObjectId),
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
          setCatalogReady(true);
          return;
        }

        const firstModel =
          models.find((model) => model.productId === requestedProductId) ??
          models[0];
        setModelCatalog(models);
        setModelCategories(categories);
        setSelectedCategoryId(firstModel.category);
        setReassignCategoryId(firstModel.category);
        setSelectedModelId(firstModel.id);
        selectedModelIdRef.current = firstModel.id;
        selectedTypeRef.current = firstModel.type;
        setCatalogStatus(`${models.length} product model${models.length === 1 ? "" : "s"} loaded.`);
        setCatalogReady(true);
        setStatus(`${firstModel.label} selected. Tap Start AR to measure.`);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Product models unavailable.";
        setCatalogStatus(`${message} Showing local samples.`);
        setCatalogReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [requestedProductId, setStatus]);

  const copyContext = {
    capturePhase,
    confidence,
    isPlacementFlow,
    isV2,
    isV3,
    mode: v2Mode,
  };
  const confidenceCopy = confidenceInstruction(copyContext);
  const arStageLabel = arStageName(copyContext);
  const arPrimaryActionLabel = primaryArAction({
    ...copyContext,
  });

  const guidance = v2Guidance(confidence, wallEligible, scanSeconds, isPlacing);
  const guidanceVisible = isV2 && isActive && !showArGuide && !catalogOpen &&
    !sessionPanelOpen && !summaryOpen && !exitPromptOpen && !confirmClear;
  const showV2PreviewRef = useRef(false);
  showV2PreviewRef.current = guidanceVisible;

  useEffect(() => {
    const scene = sceneRef.current?.scene;
    if (!isV2 || !isActive || v2Mode !== "place" || !scene) return;

    const setPreview = (dimensions: V2PlacedObject["dimensions"]) => {
      const previous = v2PreviewRef.current?.model;
      const model = createV2ObjectModel(dimensions, selectedModel);
      model.visible = false;
      scene.add(model);
      v2PreviewRef.current = {
        model,
        height: dimensions.heightCm / 100,
        width: dimensions.segmentsCm[0] / 100,
      };
      if (previous) {
        previous.removeFromParent();
        disposeObject(previous);
      }
    };
    const defaults = defaultV2DimensionsForModel(selectedModel);
    setPreview(defaults);

    let cancelled = false;
    void loadV2DefaultDimensions(selectedModel).then((dimensions) => {
      if (cancelled) return;
      if (
        dimensions.segmentsCm[0] !== defaults.segmentsCm[0] ||
        dimensions.heightCm !== defaults.heightCm ||
        dimensions.depthCm !== defaults.depthCm
      ) {
        setPreview(dimensions);
      }
    });

    return () => {
      cancelled = true;
      const preview = v2PreviewRef.current?.model;
      v2PreviewRef.current = null;
      if (preview) {
        preview.removeFromParent();
        disposeObject(preview);
      }
    };
  }, [isV2, isActive, v2Mode, selectedModel]);

  useEffect(() => {
    if (!confirmClear) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = clearDialogRef.current;
    const buttons = dialog?.querySelectorAll<HTMLButtonElement>("button");
    buttons?.[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setConfirmClear(false); }
      if (event.key === "Tab" && buttons?.length) {
        event.preventDefault();
        const index = Array.from(buttons).indexOf(document.activeElement as HTMLButtonElement);
        buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
      }
    };
    dialog?.addEventListener("keydown", onKeyDown);
    return () => { dialog?.removeEventListener("keydown", onKeyDown); previousFocus?.focus(); };
  }, [confirmClear]);

  useEffect(() => {
    if (!feedback || !isActive) return;
    const timeout = window.setTimeout(() => setFeedback(null), 6500);
    return () => window.clearTimeout(timeout);
  }, [feedback, isActive]);

  useEffect(() => {
    setScanSeconds(0);
    if (!guidanceVisible || v2Mode === "edit") return;
    let waitingSince = performance.now();
    const timer = window.setInterval(() => {
      if (v2WallReadyRef.current) {
        waitingSince = performance.now();
        setScanSeconds(0);
      } else {
        setScanSeconds(Math.floor((performance.now() - waitingSince) / 1000));
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [guidanceVisible, v2Mode]);

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

  const {
    summaryItems: summaryQuoteItems,
    estimatedTotal: summaryEstimatedTotal,
    addModel: addQuoteModel,
    transferItems: getQuoteTransferItems,
    draftState: quoteDraftState,
    saveDraft: saveQuoteDraft,
    clearDraft: clearQuoteDraft,
    removeManualItem: removeManualQuoteItem,
  } = useQuoteWorkspace({
    flowVersion,
    objects,
    placementObjects: v2Objects,
    models: modelCatalog,
    findModel,
    onStatus: setStatus,
  });

  const log = useCallback((message: string) => {
    console.debug(`[SOG AR] ${message}`);
  }, []);

  // Any tap on UI should temporarily block AR placement. Without this guard,
  // tapping a drawer/button could accidentally place or move a model behind it.
  const markUiInteraction = useCallback(() => {
    ignorePlacementUntilRef.current = performance.now() + 900;
  }, []);

  const resetSurfaceTracking = useCallback(() => {
    surfaceSamplesRef.current = [];
    missedHitFramesRef.current = 0;
    v2WallReadyRef.current = false;
    setWallEligible(false);
    currentHitPositionRef.current = null;
    currentHitNormalRef.current = null;
    currentHitPlaneRef.current = null;
    currentHitResultRef.current = null;
    currentHitPoseMatrixRef.current = null;
    confidenceRef.current = "none";
    setConfidence("none");
  }, []);

  const setV2Mode = useCallback(
    (mode: V2Mode) => {
      v2ModeRef.current = mode;
      setV2ModeState(mode);
      resetSurfaceTracking();
    },
    [resetSurfaceTracking],
  );

  const addModelToQuote = useCallback((model: ModelDefinition) => {
    markUiInteraction();
    addQuoteModel(model);
  }, [addQuoteModel, markUiInteraction]);

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
    setFeedback(null);
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
          ? `${model.label} selected. Aim at the wall, then tap Place product.`
          : flowVersionRef.current === "v3"
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
    if (!canvasRef.current || sessionRef.current || startingRef.current) return;
    startingRef.current = true;
    setIsStarting(true);

    try {
      setStatus("Requesting AR camera and hit testing...");
      log("requestSession immersive-ar hit-test");

      if (!sceneRef.current) {
        sceneRef.current = createMeasurementScene(canvasRef.current);
      }

      const measurementScene = sceneRef.current;
      const session = await requestHitTestSession(overlayRef.current, flowVersionRef.current === "v2");
      sessionRef.current = session;

      measurementScene.renderer.xr.setReferenceSpaceType("local");
      await measurementScene.renderer.xr.setSession(session);

      viewerSpaceRef.current = await session.requestReferenceSpace("viewer");
      localSpaceRef.current = await session.requestReferenceSpace("local");

      if (!session.requestHitTestSource) {
        throw new DOMException("Hit testing is not available in this browser session.", "NotSupportedError");
      }

      const hitTestSource = await session.requestHitTestSource({
        space: viewerSpaceRef.current,
      });

      if (!hitTestSource) {
        throw new DOMException("Unable to create a hit-test source.", "NotSupportedError");
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
      setV2Mode("place");
      setArGuideVisible(flowVersionRef.current !== "v2");
      setMovementCoachVisible(false);
      noSurfaceSinceRef.current = null;
      lastViewerPositionRef.current = null;
      lastViewerMovementAtRef.current = performance.now();
      movementCoachCooldownUntilRef.current = performance.now() + 2500;
      anchorTrackingStateRef.current = "idle";
      setAnchorTrackingState("idle");
      setStatus(
        flowVersionRef.current === "v3"
          ? "Point where the product should go. Move slowly, wait for green, then tap."
          : flowVersionRef.current === "v2"
          ? "Aim at the wall to preview your product."
          : "Move slowly until the circle turns green, then tap the first outline point.",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`start failed: ${message}`);
      setStatus(`AR could not start: ${message}`);
      await sessionRef.current?.end().catch(() => undefined);
      cleanupSession();
      const productId = requestedProductId ?? findModel(selectedModelIdRef.current).productId;
      if (productId && error instanceof DOMException && error.name === "NotSupportedError") {
        const fallback = new URL(`/products/${productId}?viewer=3d&ar=unavailable`, frontendQuoteBaseUrl());
        window.location.replace(fallback.toString());
      }
    } finally {
      startingRef.current = false;
      setIsStarting(false);
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

  const updateAnchorTrackingState = (
    nextState: AnchorTrackingState,
    message?: string,
  ) => {
    if (anchorTrackingStateRef.current === nextState) return;

    anchorTrackingStateRef.current = nextState;
    setAnchorTrackingState(nextState);
    if (message) setStatus(message);
  };

  const updateV2Anchors = (frame: XRFrame, referenceSpace: XRReferenceSpace) => {
    let anchoredObjectCount = 0;
    let missingPoseCount = 0;

    for (const object of v2ObjectsRef.current) {
      if (!object.xrAnchor) continue;
      anchoredObjectCount += 1;

      const anchorPose = frame.getPose(object.xrAnchor.anchorSpace, referenceSpace);
      if (!anchorPose || !object.anchorRelativeMatrix) {
        object.missedAnchorPoseFrames += 1;
        if (object.missedAnchorPoseFrames > 8) missingPoseCount += 1;
        continue;
      }

      object.missedAnchorPoseFrames = 0;
      const anchorPoseMatrix = new THREE.Matrix4().fromArray(
        anchorPose.transform.matrix,
      );
      object.lastAnchorPoseMatrix = anchorPoseMatrix.clone();
      applyAnchorPoseToObject(object, anchorPoseMatrix);
    }

    if (anchoredObjectCount === 0) {
      if (anchorTrackingStateRef.current !== "unavailable") {
        updateAnchorTrackingState("idle");
      }
      return;
    }

    if (missingPoseCount > 0) {
      updateAnchorTrackingState(
        "recovering",
        "Tracking paused. Move slowly and point back toward the placed product.",
      );
      return;
    }

    updateAnchorTrackingState(
      "anchored",
      anchorTrackingStateRef.current === "recovering"
        ? "Tracking restored. The product is anchored again."
        : undefined,
    );
  };

  const updateV2Preview = (
    frame: XRFrame,
    referenceSpace: XRReferenceSpace,
    measurementScene: MeasurementScene,
  ) => {
    const hitPlane = currentHitPlaneRef.current;
    const hitPosition = currentHitPositionRef.current;
    const view = frame.getViewerPose(referenceSpace)?.views[0];
    const visible = !!view && showV2PreviewRef.current && v2ModeRef.current === "place";
    const sensedDepth = visible && view ? getCenterDepthMeters(frame, view) : null;
    const hitDepth = visible && view && hitPosition
      ? -hitPosition.clone().applyMatrix4(new THREE.Matrix4().fromArray(view.transform.inverse.matrix)).z
      : null;
    const depthAgrees = sensedDepth == null || (hitDepth != null &&
      Math.abs(hitDepth - sensedDepth) <= Math.max(0.25, sensedDepth * 0.2));
    const wall = hitDepth != null && hitDepth > 0 && depthAgrees &&
      hitPlane?.kind === "wall" && hitPosition && confidenceRef.current === "high"
      ? createCleanV2WallPlane(hitPlane, hitPosition)
      : null;
    if (v2WallReadyRef.current !== !!wall) {
      v2WallReadyRef.current = !!wall;
      setWallEligible(!!wall);
    }

    const preview = v2PreviewRef.current;
    if (preview) preview.model.visible = visible;
    if (!view || !visible || !preview) {
      if (v2PlacementRequestedRef.current) {
        v2PlacementRequestedRef.current = false;
        anchoredPlacementPendingRef.current = false;
        setIsPlacing(false);
        setStatus("Camera tracking paused. Move your phone slowly and try again.");
      }
      return;
    }

    let position: THREE.Vector3;
    let axes: V2PlacementAxes;
    if (wall) {
      position = wall.anchor.clone();
      axes = createPlacementAxes(wall, measurementScene.renderer.xr.getCamera());
    } else {
      // Depth can give us the distance even when the surface has no reliable hit.
      const viewMatrix = new THREE.Matrix4().fromArray(view.transform.matrix);
      const framingDistance = Math.max(
        1,
        preview.width * view.projectionMatrix[0],
        preview.height * view.projectionMatrix[5],
      );
      const distance = sensedDepth ?? Math.min(8, framingDistance);
      position = new THREE.Vector3(0, 0, -distance).applyMatrix4(viewMatrix);
      const depthDir = new THREE.Vector3(0, 0, 1).transformDirection(viewMatrix);
      depthDir.y = 0;
      if (depthDir.lengthSq() < 0.0001) depthDir.set(0, 0, 1);
      depthDir.normalize();
      const heightDir = new THREE.Vector3(0, 1, 0);
      axes = {
        widthDir: new THREE.Vector3().crossVectors(heightDir, depthDir),
        heightDir,
        depthDir,
      };
    }
    // The crosshair marks the model's center; its root sits at the bottom edge.
    const previewBase = position.clone().addScaledVector(axes.heightDir, -preview.height / 2);
    setV2RootTransform(preview.model, previewBase, axes);

    if (v2PlacementRequestedRef.current) {
      v2PlacementRequestedRef.current = false;
      const session = sessionRef.current;
      // A surface anchor needs the frame that produced the hit. Without a hit,
      // keep the estimated position in the session's local space.
      const hitResult = wall ? currentHitResultRef.current : null;
      void createPlacedObject(position, axes, hitResult).finally(() => {
        if (session !== sessionRef.current) return;
        anchoredPlacementPendingRef.current = false;
        setIsPlacing(false);
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

    const finishFrame = () => {
      if (flowVersionRef.current === "v2") updateV2Preview(frame, localSpace, measurementScene);
      updateV2Anchors(frame, localSpace);
      measurementScene.renderer.render(measurementScene.scene, measurementScene.camera);
    };

    const now = performance.now();
    trackViewerMotion(frame, localSpace, now);
    const results = frame.getHitTestResults(hitTestSource);
    const shouldShowPlacementReticle =
      flowVersionRef.current !== "v2";

    if (results.length === 0) {
      missedHitFramesRef.current += 1;
      if (
        missedHitFramesRef.current <= 3 &&
        surfaceSamplesRef.current.length > 0
      ) {
        confidenceRef.current = "medium";
        setConfidence((previous) =>
          previous === "medium" ? previous : "medium",
        );
        setReticleColor(measurementScene.reticle, "medium");
        finishFrame();
        return;
      }

      currentHitPositionRef.current = null;
      currentHitNormalRef.current = null;
      currentHitPlaneRef.current = null;
      currentHitResultRef.current = null;
      currentHitPoseMatrixRef.current = null;
      surfaceSamplesRef.current = [];
      measurementScene.reticle.visible = false;
      confidenceRef.current = "none";
      setConfidence((previous) => (previous === "none" ? previous : "none"));
      noteNoSurfaceFrame(now);
      finishFrame();
      return;
    }

    const pose = results[0].getPose(localSpace);
    if (!pose) {
      missedHitFramesRef.current += 1;
      if (
        missedHitFramesRef.current <= 3 &&
        surfaceSamplesRef.current.length > 0
      ) {
        confidenceRef.current = "medium";
        setConfidence((previous) =>
          previous === "medium" ? previous : "medium",
        );
        setReticleColor(measurementScene.reticle, "medium");
        finishFrame();
        return;
      }

      currentHitPositionRef.current = null;
      currentHitNormalRef.current = null;
      currentHitPlaneRef.current = null;
      currentHitResultRef.current = null;
      currentHitPoseMatrixRef.current = null;
      surfaceSamplesRef.current = [];
      measurementScene.reticle.visible = false;
      confidenceRef.current = "none";
      setConfidence((previous) => (previous === "none" ? previous : "none"));
      noteNoSurfaceFrame(now);
      finishFrame();
      return;
    }

    missedHitFramesRef.current = 0;
    const matrix = new THREE.Matrix4().fromArray(pose.transform.matrix);
    const rawPosition = new THREE.Vector3().setFromMatrixPosition(matrix);
    const detectedPlane = createMeasurementPlane(
      rawPosition,
      extractSurfaceNormal(matrix),
      getPreferredPlaneKind(),
      getViewerForward(frame, localSpace),
    );
    surfaceSamplesRef.current = appendSurfaceSample(
      surfaceSamplesRef.current,
      {
        kind: detectedPlane.kind,
        normal: detectedPlane.normal.clone(),
        position: rawPosition.clone(),
        quality: detectedPlane.quality,
      },
    );
    const stabilizedSurface = stabilizeSurface(surfaceSamplesRef.current);
    const isHeightPhase = capturePhaseRef.current === "height";
    const stabilizedPlane: MeasurementPlane = {
      anchor: stabilizedSurface.position,
      kind: detectedPlane.kind,
      normal: stabilizedSurface.normal,
      quality: stabilizedSurface.quality,
    };
    const activePlane =
      !isHeightPhase && shapePlaneRef.current
        ? shapePlaneRef.current
        : stabilizedPlane;
    const cleanPosition = projectPointToPlane(
      stabilizedSurface.position,
      activePlane,
    );

    currentHitPositionRef.current = cleanPosition;
    currentHitNormalRef.current = activePlane.normal;
    currentHitPlaneRef.current = activePlane;
    currentHitResultRef.current = results[0] as XRHitTestResultWithAnchor;
    currentHitPoseMatrixRef.current = matrix.clone();
    measurementScene.reticle.visible = shouldShowPlacementReticle;
    measurementScene.reticle.matrix.copy(
      createPlaneReticleMatrix(cleanPosition, activePlane),
    );

    const nextConfidence = stabilizedSurface.confidence;
    confidenceRef.current = nextConfidence;
    setConfidence((previous) => (previous === nextConfidence ? previous : nextConfidence));
    setReticleColor(measurementScene.reticle, nextConfidence);
    noteSurfaceFrame();
    finishFrame();
  };

  /**
   * V1 measurement tap handler. It records outline points and a height point.
   */
  const placePointFromHit = (source?: XRInputSourceEvent | "button") => {
    const now = performance.now();

    if (source !== "button" && now < ignorePlacementUntilRef.current) {
      log("tap ignored: ui control");
      return;
    }

    if (
      catalogOpenRef.current ||
      sessionPanelOpenRef.current ||
      summaryOpenRef.current || showArGuideRef.current || confirmClearRef.current
    ) {
      log("tap ignored: panel open");
      return;
    }

    if (now - lastPlacementAtRef.current < 650) {
      log("tap ignored: duplicate tap debounce");
      return;
    }

    if (flowVersionRef.current === "v2") {
      if (source !== "button" || v2ModeRef.current !== "place" || anchoredPlacementPendingRef.current) return;
      anchoredPlacementPendingRef.current = true;
      v2PlacementRequestedRef.current = true;
      setIsPlacing(true);
      return;
    }

    const measurementScene = sceneRef.current;
    const position = currentHitPositionRef.current;
    const activeConfidence = confidenceRef.current;
    if (!measurementScene || !position || activeConfidence === "none") {
      setStatus("No surface yet. Point at the wall or floor and move your phone slowly.");
      log("tap ignored: no active hit-test surface");
      return;
    }

    if (activeConfidence !== "high") {
      setStatus("Almost ready. Keep moving slowly and wait for the circle to turn green.");
      log(`tap ignored: surface confidence ${activeConfidence}`);
      return;
    }

    if (flowVersionRef.current === "v3") {
      if (anchoredPlacementPendingRef.current) return;
      anchoredPlacementPendingRef.current = true;
      void placeV3ObjectFromHit(position).finally(() => {
        anchoredPlacementPendingRef.current = false;
      });
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

  const doAnotherV2Object = () => {
    markUiInteraction();
    setV2Mode("place");
    selectedV2ObjectIdRef.current = null;
    setSelectedV2ObjectId(null);
    setSessionPanelOpen(false);
    setSummaryOpen(false);

    if (flowVersionRef.current === "v3") {
      setCatalogOpen(false);
      setStatus("Ready for another item. Move slowly, wait for green, then tap.");
      return;
    }

    setShopDetailModel(null);
    setCatalogOpen(true);
    setStatus("Choose the next product to preview.");
  };

  /**
   * Create the Three.js object used by V2/V3 placement.
   *
   * It fits the product GLB into a centimeter-sized frame, adds a label, applies
   * world-space axes, and uses a surface anchor when available.
   */
  const createPlacedObject = async (
    placementPosition: THREE.Vector3,
    axes: V2PlacementAxes,
    hitResult?: XRHitTestResultWithAnchor | null,
  ) => {
    const measurementScene = sceneRef.current;
    const session = sessionRef.current;
    const localSpace = localSpaceRef.current;
    const captureConfidence = confidenceRef.current;
    const selectedModel = findModel(selectedModelIdRef.current);
    const allowEstimate = flowVersionRef.current === "v2";
    if (!measurementScene || !session || !localSpace) return null;

    const hitPoseMatrix = hitResult?.createAnchor
      ? currentHitPoseMatrixRef.current?.clone()
      : null;
    const xrAnchor = hitResult && hitPoseMatrix
      ? await createV2XrAnchor(hitResult).catch((error) => {
          log(`anchor unavailable: ${error instanceof Error ? error.message : String(error)}`);
          return null;
        })
      : null;

    if (!xrAnchor && !allowEstimate) {
      if (session === sessionRef.current) {
        updateAnchorTrackingState("unavailable");
        setStatus("Android could not create a stable anchor. Keep the surface visible and try again.");
      }
      return null;
    }
    const initialAnchorPoseMatrix = xrAnchor ? hitPoseMatrix ?? null : null;
    const dimensions = await loadV2DefaultDimensions(selectedModel);

    if (session !== sessionRef.current) {
      xrAnchor?.delete?.();
      return null;
    }
    const anchor = allowEstimate
      ? placementPosition.clone().addScaledVector(axes.heightDir, -dimensions.heightCm / 200)
      : placementPosition;
    const root = new THREE.Group();
    const model = createV2ObjectModel(dimensions, selectedModel);
    const label = createV2ObjectLabel(nextV2ObjectIdRef.current, selectedModel, dimensions, !xrAnchor);
    // The model is authored with its back face at local Z=0. Keeping the root
    // directly on the reference plane makes the product sit flush on the wall.
    const anchorOffset = new THREE.Vector3();

    setV2RootTransform(root, anchor.clone().add(anchorOffset), axes);
    root.name = `${flowVersionRef.current}-placed-object-${nextV2ObjectIdRef.current}`;
    root.add(model);
    root.add(label);
    measurementScene.scene.add(root);
    root.updateMatrix();

    const object: V2PlacedObject = {
      id: nextV2ObjectIdRef.current,
      type: selectedModel.type,
      modelId: selectedModel.id,
      captureConfidence: xrAnchor ? captureConfidence : "none",
      root,
      model,
      label,
      anchor: anchor.clone(),
      anchorOffset,
      xrAnchor,
      anchorRelativeMatrix: initialAnchorPoseMatrix
        ? createAnchorRelativeMatrix(initialAnchorPoseMatrix, root.matrix)
        : null,
      lastAnchorPoseMatrix: initialAnchorPoseMatrix,
      missedAnchorPoseFrames: 0,
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
    if (xrAnchor) {
      updateAnchorTrackingState("anchored");
      setStatus(`Item ${object.id} anchored. You can now walk around it.`);
    } else {
      setStatus(`Item ${object.id} placed at an estimated distance.`);
    }
    return object;
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
      const currentObject = v2ObjectsRef.current.find(
        (object) => object.id === selectedObjectId,
      );
      const nextAnchorPoseMatrix = currentHitPoseMatrixRef.current?.clone() ?? null;

      if (!currentObject || !hitResult?.createAnchor || !nextAnchorPoseMatrix) {
        updateAnchorTrackingState("unavailable");
        setStatus("A stable anchor could not be created here. Keep scanning and try again.");
        return;
      }

      const nextXrAnchor = await createV2XrAnchor(hitResult).catch((error) => {
        log(`re-anchor unavailable: ${error instanceof Error ? error.message : String(error)}`);
        return null;
      });

      if (!nextXrAnchor) {
        updateAnchorTrackingState("unavailable");
        setStatus("The product could not be anchored at that spot. Keep scanning and try again.");
        return;
      }

      currentObject.xrAnchor?.delete?.();
      const updatedObject: V2PlacedObject = {
        ...currentObject,
        anchor,
        anchorOffset: new THREE.Vector3(),
        xrAnchor: nextXrAnchor,
        anchorRelativeMatrix: null,
        lastAnchorPoseMatrix: nextAnchorPoseMatrix,
        missedAnchorPoseFrames: 0,
        widthDir: axes.widthDir,
        heightDir: axes.heightDir,
        depthDir: axes.depthDir,
      };
      rebuildV2ObjectVisuals(updatedObject);
      updatedObject.root.updateMatrix();
      updatedObject.anchorRelativeMatrix = createAnchorRelativeMatrix(
        nextAnchorPoseMatrix,
        updatedObject.root.matrix,
      );
      v2ObjectsRef.current = v2ObjectsRef.current.map((object) =>
        object.id === selectedObjectId ? updatedObject : object,
      );
      setV2Objects(v2ObjectsRef.current);
      updateAnchorTrackingState("anchored");
      setStatus("Item moved and anchored to the new surface.");
      return;
    }

    await createPlacedObject(anchor, axes, hitResult);
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
    const edited = normalizeV2Dimensions({ ...currentObject.dimensions, ...patch });
    const nextDimensions = {
      segmentsCm: patch.segmentsCm ? edited.segmentsCm : currentObject.dimensions.segmentsCm,
      heightCm: patch.heightCm == null ? currentObject.dimensions.heightCm : edited.heightCm,
      depthCm: patch.depthCm == null ? currentObject.dimensions.depthCm : edited.depthCm,
    };
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
      currentObject.captureConfidence === "none",
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

    setV2RootTransform(
      updatedObject.root,
      updatedObject.anchor.clone().add(updatedObject.anchorOffset),
      updatedObject,
    );
    syncObjectAnchorRelativeMatrix(updatedObject);

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
    syncObjectAnchorRelativeMatrix(object);
    const nextModel = createV2ObjectModel(object.dimensions, selectedModel);
    const nextLabel = createV2ObjectLabel(
      object.id,
      selectedModel,
      object.dimensions,
      object.captureConfidence === "none",
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
    if (!nextObjects.some((object) => object.xrAnchor)) {
      updateAnchorTrackingState("idle");
    }
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
      captureConfidence: confidenceRef.current,
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
    v2WallReadyRef.current = false;
    setWallEligible(false);
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
    v3PinchRef.current = null;
    v3DragRef.current = null;
    anchoredPlacementPendingRef.current = false;
    lastPlacementPositionRef.current = null;
    nextObjectIdRef.current = 1;
    nextV2ObjectIdRef.current = 1;
    setPoints([]);
    setObjects([]);
    setV2Objects([]);
    setSelectedObjectId(null);
    selectedV2ObjectIdRef.current = null;
    setSelectedV2ObjectId(null);
    setV2Mode("place");
    anchorTrackingStateRef.current = "idle";
    setAnchorTrackingState("idle");
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
    if (!saveQuoteDraft()) return;

    setExitPromptOpen(false);
    void endSession().then(navigateToFrontendHome);
  };

  const discardQuoteAndExit = () => {
    markUiInteraction();
    clearQuoteDraft();
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
    setIsPlacing(false);
    setConfirmClear(false);
    sceneRef.current?.renderer.setAnimationLoop(null);
    hitTestSourceRef.current?.cancel();
    hitTestSourceRef.current = null;
    viewerSpaceRef.current = null;
    localSpaceRef.current = null;
    sessionRef.current = null;
    v2PlacementRequestedRef.current = false;
    v2WallReadyRef.current = false;
    setWallEligible(false);
    currentHitPositionRef.current = null;
    currentHitNormalRef.current = null;
    currentHitPlaneRef.current = null;
    currentHitResultRef.current = null;
    currentHitPoseMatrixRef.current = null;
    anchoredPlacementPendingRef.current = false;
    lastPlacementPositionRef.current = null;
    noSurfaceSinceRef.current = null;
    lastViewerPositionRef.current = null;
    lastViewerMovementAtRef.current = 0;
    movementCoachCooldownUntilRef.current = 0;
    showArGuideRef.current = false;
    showMovementCoachRef.current = false;
    missedHitFramesRef.current = 0;
    surfaceSamplesRef.current = [];
    anchorTrackingStateRef.current = "idle";
    setAnchorTrackingState("idle");
    if (sceneRef.current) sceneRef.current.reticle.visible = false;
  };

  const editSummaryItem = (id: number) => {
    if (id <= 0) return;

    if (isPlacementFlow) {
      const object = v2ObjectsRef.current.find((candidate) => candidate.id === id);
      if (object) {
        selectV2Object(object);
        setSummaryOpen(false);
      }
      return;
    }

    const object = objectsRef.current.find((candidate) => candidate.id === id);
    if (object) {
      selectCompletedObject(object);
      setSummaryOpen(false);
    }
  };

  const removeSummaryItem = (id: number) => {
    markUiInteraction();

    if (id < 0) {
      removeManualQuoteItem(id);
      return;
    }

    if (isPlacementFlow) {
      deleteV2Object(id);
      return;
    }

    deleteCompletedObject(id);
  };

  return (
    <main className={`ar-app ${isV2 ? "is-v2" : ""} ${isActive ? "is-ar-active" : ""}`}>
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
            <button
              type="button"
              className="ar-product-switcher"
              aria-label="Change current product"
              onClick={() => {
                setSessionPanelOpen(false);
                setCatalogOpen(true);
              }}
            >
              <span>Current product</span>
              <strong>{selectedV2Object ? findModel(selectedV2Object.modelId).label : selectedModel.label}</strong>
              <ChevronDown aria-hidden="true" />
            </button>
            <button type="button" aria-label="Open guide" onClick={() => setArGuideVisible(true)}>
              <CircleHelp className="size-5" />
            </button>
          </header>
        ) : directArEntry ? (
          <DirectArEntry
            selectedModel={selectedModel}
            productId={requestedProductId ?? selectedModel.productId}
            catalogReady={catalogReady}
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
          <ArGuidanceOverlays
            isV2={isV2}
            showGuide={showArGuide}
            showMovementCoach={!isV2 && showMovementCoach}
            anchorTrackingState={isV2 && feedback ? "idle" : anchorTrackingState}
            onPointerDown={markUiInteraction}
            onDismissGuide={dismissArGuide}
          />
        )}

        {isActive && !isV2 && isPlacementFlow && v2Mode === "edit" && selectedV2Object && (
          <p className="ar-move-hint">Hold and move the item if needed</p>
        )}

        {isActive && !isV2 && (
          <>
            <div className={`reticle ${confidence}`} aria-hidden="true">
              <span className="reticle-center" />
            </div>
            <p
              className={`ar-surface-status ${confidence}`}
              role="status"
              aria-live="polite"
            >
              <small>{arStageLabel}</small>
              <strong>{confidenceCopy}</strong>
            </p>
          </>
        )}

        {isV2 && feedback && isActive && guidanceVisible && (
          <div className="ar-feedback" role="status" aria-live="polite" aria-atomic="true">
            {feedback.message}
          </div>
        )}
        {isV2 && isStarting && <div className="ar-starting" role="status">Opening AR camera…</div>}
        {guidanceVisible && v2Mode !== "edit" && (
          <>
            <div className={`reticle ${guidance.ready ? "high" : "medium"}`} aria-hidden="true"><span className="reticle-center" /></div>
            <section className={`v2-guidance ${guidance.ready ? "is-ready" : "is-scanning"}`} data-xr-ui="true" onPointerDown={markUiInteraction}>
              <div role="status" aria-live="polite" aria-atomic="true">
                <small>{guidance.ready || isPlacing ? "Place product" : "Preview"} · {activeObjectCount} placed</small>
                <strong>{guidance.title}</strong>
                <p>{guidance.detail}</p>
              </div>
            </section>
          </>
        )}
        {guidanceVisible && v2Mode === "edit" && !selectedV2Object && (
          <section className="v2-guidance"><strong>{activeObjectCount} product{activeObjectCount === 1 ? "" : "s"} placed</strong><p>Add another product, or open Quote Items to review and edit your items.</p></section>
        )}

        {isActive && (
          <div
            className="ar-bottom-nav"
            data-xr-ui="true"
            onPointerDown={markUiInteraction}
          >
            <button
              type="button"
              disabled={isV2 && (!selectedV2Object || isPlacing)}
              onClick={() => {
                if (isPlacementFlow) {
                  if (selectedV2Object) deleteV2Object(selectedV2Object.id);
                  return;
                }
                undoPoint();
              }}
            >
              {isV2 ? <Trash2 className="size-5" /> : <Undo2 className="size-5" />}
              <span>{isV2 ? "Remove item" : "Undo"}</span>
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
              disabled={
                isPlacing || (isV3 && v2Mode === "place" && confidence !== "high")
              }
              onClick={() => {
                if (isV2) {
                  if (v2Mode === "edit") doAnotherV2Object();
                  else placePointFromHit("button");
                  return;
                }
                if (!isPlacementFlow) finishShape();
                else if (v2Mode === "edit") doAnotherV2Object();
                else placePointFromHit("button");
              }}
            >
              <ScanLine className="size-5" />
              <span>{isV2 ? isPlacing ? "Placing…" : v2Mode === "edit" ? "Add another" : guidance.ready ? "Place product" : "Place preview" : arPrimaryActionLabel}</span>
            </button>
            <button type="button" onClick={openSummary}>
              <ClipboardList className="size-5" />
              <span>Quote Items</span>
              {activeObjectCount > 0 && <i>{activeObjectCount}</i>}
            </button>
            <button type="button" disabled={isPlacing} onClick={() => isV2 ? setConfirmClear(true) : resetAll()}>
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
            <PlacementEditor
            guided={isV2}
              object={selectedV2Object}
              modelLabel={findModel(selectedV2Object.modelId).label}
              onClose={() => { setSelectedV2ObjectId(null); selectedV2ObjectIdRef.current = null; }}
              onChangeModel={() => {
                setShopDetailModel(null);
                setCatalogOpen(true);
              }}
              onAddProduct={doAnotherV2Object}
              onDimensionsChange={updateV2ObjectDimensions}
              onTransform={updateV2ObjectTransform}
              onPointerDown={markUiInteraction}
            />
          )}

        {isV2 && confirmClear && (
          <div className="v2-confirm-backdrop" data-xr-ui="true" onPointerDown={markUiInteraction}>
            <section ref={clearDialogRef} role="alertdialog" aria-modal="true" aria-labelledby="clear-ar-title" aria-describedby="clear-ar-description" className="v2-confirm">
              <h2 id="clear-ar-title">Clear all placed products?</h2>
              <p id="clear-ar-description">This removes your placed products from this AR session. You will need to place them again.</p>
              <button type="button" onClick={() => setConfirmClear(false)}>Keep products</button>
              <button type="button" onClick={() => { resetAll(); setConfirmClear(false); }}>Clear products</button>
            </section>
          </div>
        )}
        <ProductCatalogDrawer
          open={isActive && catalogOpen}
          detailModel={shopDetailModel}
          relatedModels={relatedShopModels}
          selectedObject={selectedV2Object}
          categories={modelCategories}
          models={modelCatalog}
          activeCategoryId={selectedCategoryId}
          selectedModelId={selectedModelId}
          searchQuery={productSearch}
          onOpenChange={setCatalogOpen}
          onDetailChange={setShopDetailModel}
          onCategoryChange={setSelectedCategoryId}
          onSearchChange={setProductSearch}
          onSelectModel={selectModel}
          onChangeObjectModel={changeV2ObjectModel}
          onPointerDown={markUiInteraction}
        />

        {isActive && sessionPanelOpen && (
          <SessionObjectsPanel
            objects={objects}
            placementObjects={v2Objects}
            isPlacementFlow={isPlacementFlow}
            selectedObject={selectedObject}
            selectedPlacementObject={selectedV2Object}
            selectedObjectId={selectedObjectId}
            selectedPlacementObjectId={selectedV2ObjectId}
            categories={modelCategories}
            models={modelCatalog}
            reassignCategoryId={reassignCategoryId}
            findModel={findModel}
            onClose={() => setSessionPanelOpen(false)}
            onPointerDown={markUiInteraction}
            onSelectObject={selectCompletedObject}
            onSelectPlacementObject={selectV2Object}
            onDeleteObject={deleteCompletedObject}
            onDeletePlacementObject={deleteV2Object}
            onCategoryChange={setReassignCategoryId}
            onChangeObjectModel={changeCompletedObjectModel}
            onChangePlacementObjectModel={changeV2ObjectModel}
          />
        )}

        <QuoteSummaryDrawer
          open={summaryOpen}
          items={summaryQuoteItems}
          estimatedTotal={summaryEstimatedTotal}
          draftState={quoteDraftState}
          onOpenChange={setSummaryOpen}
          onPointerDown={markUiInteraction}
          onEditItem={editSummaryItem}
          onRemoveItem={removeSummaryItem}
          onSaveDraft={() => {
            markUiInteraction();
            saveQuoteDraft();
          }}
          onProceed={proceedToQuoteRequest}
        />

        <ExitPromptDrawer
          open={exitPromptOpen}
          itemCount={summaryQuoteItems.length}
          onOpenChange={setExitPromptOpen}
          onPointerDown={markUiInteraction}
          onSave={saveQuoteForLaterAndExit}
          onDiscard={discardQuoteAndExit}
        />
      </div>
    </main>
  );
}
