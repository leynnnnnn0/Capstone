import { useEffect, useState } from "react";
import {
  Box,
  CheckCircle2,
  ChevronsRight,
  Minus,
  Play,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { OBJECT_TYPES } from "./object-types";
import {
  normalizeCatalogAssetUrl,
  type ModelCategory,
  type ModelCategoryId,
  type ModelDefinition,
  type ModelVariantDefinition,
} from "./model-catalog";
import { cn } from "../../lib/utils";
import { formatDimensions } from "./dimensions";
import { formatV2Dimensions } from "./placement-helpers";
import type { MeasuredObject } from "./types";
import type { V2PlacedObject } from "./workspace-types";

export function V2DimensionControl({
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

export function DirectArEntry({
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

export function ArProductDrawerDetail({
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
          <ArCatalogImage src={selectedImage} />
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
              <ArCatalogImage src={image} />
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
                    <ArCatalogImage src={variant.thumbnail} />
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
                  <ArCatalogImage src={relatedModel.thumbnail} />
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
        className="h-12 rounded-xl bg-[#162d4a] text-sm font-semibold text-white hover:bg-[#315b7d]"
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

function ArCatalogImage({ src, className }: { src: string; className?: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed) {
    return (
      <span className={cn("ar-catalog-image-fallback", className)} aria-hidden="true">
        <Box className="size-8" />
      </span>
    );
  }

  return (
    <img
      src={normalizeCatalogAssetUrl(src)}
      alt=""
      className={className}
      onError={() => setFailed(true)}
    />
  );
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

export function ModelCatalogPanel({
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
            variant="ghost"
            size={compact ? "sm" : "default"}
            className={cn(
              "h-auto shrink-0 rounded-xl border px-4 py-2 text-left transition",
              shop && "min-h-11 px-4 text-base",
              category.id !== activeCategoryId &&
                "border-[#e4ebf0] bg-white text-[#315b7d] hover:bg-[#edf3f7]",
              category.id === activeCategoryId &&
                "border-[#162d4a] bg-[#162d4a] text-white hover:bg-[#315b7d]",
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
              shop ? "col-span-2 bg-white" : "bg-white text-[#6f879b]",
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
                    "border-[#e4ebf0] bg-white text-[#162d4a] shadow-[0_12px_30px_rgba(22,45,74,0.07)]",
                    isSelected &&
                      "border-[#608db9] bg-[#f7fafc] ring-2 ring-[#608db9]/20",
                  )}
                >
                  <CardContent className="p-2">
                    <div
                      className={cn(
                        "relative grid overflow-hidden rounded-xl",
                        shop
                          ? "h-40 place-items-center bg-[#f4f7f9]"
                          : "h-24 place-items-center bg-[#f4f7f9]",
                      )}
                      style={{ border: `1px solid ${isSelected ? color : "transparent"}` }}
                    >
                      {model.thumbnail ? (
                        <ArCatalogImage
                          src={model.thumbnail}
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
                          "truncate text-sm font-semibold text-[#162d4a]",
                          shop && "text-base",
                        )}
                      >
                        {model.label}
                      </strong>
                      <small
                        className={cn(
                          "line-clamp-2 min-h-9 text-xs leading-snug",
                          shop && "text-sm",
                          "text-[#6f879b]",
                        )}
                      >
                        {model.description}
                      </small>
                      {model.price != null && (
                        <b
                          className={cn(
                            "mt-1 text-sm font-semibold text-[#315b7d]",
                            shop && "text-base",
                          )}
                        >
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

interface SessionObjectsPanelProps {
  objects: MeasuredObject[];
  placementObjects: V2PlacedObject[];
  isPlacementFlow: boolean;
  selectedObject: MeasuredObject | null;
  selectedPlacementObject: V2PlacedObject | null;
  selectedObjectId: number | null;
  selectedPlacementObjectId: number | null;
  categories: ModelCategory[];
  models: ModelDefinition[];
  reassignCategoryId: ModelCategoryId;
  findModel: (modelId: string) => ModelDefinition;
  onClose: () => void;
  onPointerDown: () => void;
  onSelectObject: (object: MeasuredObject) => void;
  onSelectPlacementObject: (object: V2PlacedObject) => void;
  onDeleteObject: (objectId: number) => void;
  onDeletePlacementObject: (objectId: number) => void;
  onCategoryChange: (category: ModelCategoryId) => void;
  onChangeObjectModel: (objectId: number, model: ModelDefinition) => void;
  onChangePlacementObjectModel: (
    objectId: number,
    model: ModelDefinition,
  ) => void;
}

export function SessionObjectsPanel({
  objects,
  placementObjects,
  isPlacementFlow,
  selectedObject,
  selectedPlacementObject,
  selectedObjectId,
  selectedPlacementObjectId,
  categories,
  models,
  reassignCategoryId,
  findModel,
  onClose,
  onPointerDown,
  onSelectObject,
  onSelectPlacementObject,
  onDeleteObject,
  onDeletePlacementObject,
  onCategoryChange,
  onChangeObjectModel,
  onChangePlacementObjectModel,
}: SessionObjectsPanelProps) {
  const objectCount = isPlacementFlow ? placementObjects.length : objects.length;

  return (
    <aside
      className="session-panel session-panel--compact"
      data-xr-ui="true"
      onPointerDown={onPointerDown}
    >
      <div className="session-panel-header">
        <div>
          <h2>Session objects</h2>
          <p>{objectCount} captured</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full text-slate-100"
          onClick={onClose}
        >
          <X className="size-4" />
          Close
        </Button>
      </div>

      <div className="object-list">
        {objectCount === 0 ? (
          <div className="empty">Finished objects will appear here.</div>
        ) : isPlacementFlow ? (
          placementObjects.map((object) => (
            <SessionObjectRow
              key={object.id}
              id={object.id}
              label={findModel(object.modelId).label}
              dimensions={formatV2Dimensions(object.dimensions)}
              color={OBJECT_TYPES[object.type].color}
              selected={selectedPlacementObjectId === object.id}
              onSelect={() => onSelectPlacementObject(object)}
              onDelete={() => onDeletePlacementObject(object.id)}
            />
          ))
        ) : (
          objects.map((object) => (
            <SessionObjectRow
              key={object.id}
              id={object.id}
              label={findModel(object.modelId).label}
              dimensions={formatDimensions(object.dimensions)}
              color={OBJECT_TYPES[object.type].color}
              selected={selectedObjectId === object.id}
              onSelect={() => onSelectObject(object)}
              onDelete={() => onDeleteObject(object.id)}
            />
          ))
        )}
      </div>

      {isPlacementFlow && selectedPlacementObject && (
        <ObjectModelEditor
          objectId={selectedPlacementObject.id}
          modelLabel={findModel(selectedPlacementObject.modelId).label}
          selectedModelId={selectedPlacementObject.modelId}
          categories={categories}
          models={models}
          activeCategoryId={reassignCategoryId}
          onCategoryChange={onCategoryChange}
          onSelectModel={(model) =>
            onChangePlacementObjectModel(selectedPlacementObject.id, model)
          }
        />
      )}

      {selectedObject && (
        <ObjectModelEditor
          objectId={selectedObject.id}
          modelLabel={findModel(selectedObject.modelId).label}
          selectedModelId={selectedObject.modelId}
          categories={categories}
          models={models}
          activeCategoryId={reassignCategoryId}
          onCategoryChange={onCategoryChange}
          onSelectModel={(model) =>
            onChangeObjectModel(selectedObject.id, model)
          }
        />
      )}
    </aside>
  );
}

function SessionObjectRow({
  id,
  label,
  dimensions,
  color,
  selected,
  onSelect,
  onDelete,
}: {
  id: number;
  label: string;
  dimensions: string;
  color: string;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <article className={selected ? "selected" : ""}>
      <Button
        type="button"
        variant="ghost"
        className="object-select-button"
        onClick={onSelect}
      >
        <span>
          <strong>{`Item ${id}`}</strong>
          <em>{label}</em>
          <small>{dimensions}</small>
        </span>
        <i style={{ background: color }} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="object-delete-button"
        onClick={onDelete}
      >
        <Trash2 className="size-4" />
        Delete
      </Button>
    </article>
  );
}

function ObjectModelEditor({
  objectId,
  modelLabel,
  selectedModelId,
  categories,
  models,
  activeCategoryId,
  onCategoryChange,
  onSelectModel,
}: {
  objectId: number;
  modelLabel: string;
  selectedModelId: string;
  categories: ModelCategory[];
  models: ModelDefinition[];
  activeCategoryId: ModelCategoryId;
  onCategoryChange: (category: ModelCategoryId) => void;
  onSelectModel: (model: ModelDefinition) => void;
}) {
  return (
    <div className="object-model-editor">
      <div className="object-model-editor-header">
        <div>
          <p className="eyebrow">Change Displayed Model</p>
          <strong>{`Item ${objectId}`}</strong>
        </div>
        <span>{modelLabel}</span>
      </div>
      <ModelCatalogPanel
        categories={categories}
        models={models}
        activeCategoryId={activeCategoryId}
        selectedModelId={selectedModelId}
        onCategoryChange={onCategoryChange}
        onSelectModel={onSelectModel}
        compact
      />
    </div>
  );
}
