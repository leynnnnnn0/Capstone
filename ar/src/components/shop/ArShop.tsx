import {
  ArrowLeft,
  Box,
  CheckCircle2,
  ClipboardList,
  Heart,
  Menu,
  Play,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import {
  normalizeCatalogAssetUrl,
  type ModelCategory,
  type ModelCategoryId,
  type ModelDefinition,
  type ModelVariantDefinition,
} from "../../features/measurement/model-catalog";
import { OBJECT_TYPES } from "../../features/measurement/object-types";

interface ArShopProps {
  categories: ModelCategory[];
  models: ModelDefinition[];
  activeCategoryId: ModelCategoryId;
  selectedModel: ModelDefinition;
  selectedModelId: string;
  searchQuery: string;
  isV2: boolean;
  catalogStatus: string;
  activeObjectCount: number;
  relatedModels: ModelDefinition[];
  detailModel: ModelDefinition | null;
  onCategoryChange: (category: ModelCategoryId) => void;
  onSearchChange: (query: string) => void;
  onSelectModel: (model: ModelDefinition) => void;
  onOpenDetail: (model: ModelDefinition) => void;
  onCloseDetail: () => void;
  onStartSession: () => void;
  onOpenSummary: () => void;
  onAddToQuote: (model: ModelDefinition) => void;
}

export function ArShop({
  categories,
  models,
  activeCategoryId,
  selectedModel,
  selectedModelId,
  searchQuery,
  isV2,
  catalogStatus,
  activeObjectCount,
  relatedModels,
  detailModel,
  onCategoryChange,
  onSearchChange,
  onSelectModel,
  onOpenDetail,
  onCloseDetail,
  onStartSession,
  onOpenSummary,
  onAddToQuote,
}: ArShopProps) {
  return (
    <section
      className="pointer-events-auto absolute inset-0 z-20 overflow-y-auto bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-slate-950"
      data-xr-ui="true"
    >
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 pb-5">
        {detailModel ? (
          <ShopProductDetail
            model={detailModel}
            relatedModels={relatedModels}
            onBack={onCloseDetail}
            onSelectModel={(model) => {
              onSelectModel(model);
              onOpenDetail(model);
            }}
            onOpenDetail={onOpenDetail}
            onStartSession={onStartSession}
            onAddToQuote={onAddToQuote}
          />
        ) : (
          <ShopCatalog
            categories={categories}
            models={models}
            activeCategoryId={activeCategoryId}
            selectedModel={selectedModel}
            selectedModelId={selectedModelId}
            searchQuery={searchQuery}
            catalogStatus={catalogStatus}
            activeObjectCount={activeObjectCount}
            onCategoryChange={onCategoryChange}
            onSearchChange={onSearchChange}
            onSelectModel={onSelectModel}
            onOpenDetail={onOpenDetail}
            onStartSession={onStartSession}
            onOpenSummary={onOpenSummary}
          />
        )}
      </div>
    </section>
  );
}

interface ShopCatalogProps {
  categories: ModelCategory[];
  models: ModelDefinition[];
  activeCategoryId: ModelCategoryId;
  selectedModel: ModelDefinition;
  selectedModelId: string;
  searchQuery: string;
  catalogStatus: string;
  activeObjectCount: number;
  onCategoryChange: (category: ModelCategoryId) => void;
  onSearchChange: (query: string) => void;
  onSelectModel: (model: ModelDefinition) => void;
  onOpenDetail: (model: ModelDefinition) => void;
  onStartSession: () => void;
  onOpenSummary: () => void;
}

function ShopCatalog({
  categories,
  models,
  activeCategoryId,
  selectedModel,
  selectedModelId,
  searchQuery,
  catalogStatus,
  activeObjectCount,
  onCategoryChange,
  onSearchChange,
  onSelectModel,
  onOpenDetail,
  onStartSession,
  onOpenSummary,
}: ShopCatalogProps) {
  const visibleModels = filterModels(models, activeCategoryId, searchQuery);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);

  return (
    <>
      <header className="flex items-center justify-between">
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full bg-white text-[#234a6f] shadow-[0_10px_28px_rgba(96,141,185,0.14)] ring-1 ring-[#dbe8f4]"
          aria-label="Menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Menu className="size-5" />
        </button>
        <LogoHomeButton />
        <button
          type="button"
          className="relative grid size-11 place-items-center rounded-full bg-white text-[#234a6f] shadow-[0_10px_28px_rgba(96,141,185,0.14)] ring-1 ring-[#dbe8f4]"
          aria-label="Quote summary"
          onClick={onOpenSummary}
        >
          <ClipboardList className="size-5" />
          {activeObjectCount > 0 && (
            <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-[#f5b811] px-1.5 text-[11px] font-black text-white">
              {activeObjectCount}
            </span>
          )}
        </button>
      </header>

      {menuOpen && <ShopMenu onClose={() => setMenuOpen(false)} />}

      <section className="grid gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              SOG AR catalog
            </p>
            <h1 className="mt-2 text-[2rem] font-black leading-none tracking-normal text-[#0f172a]">
              Discover products
            </h1>
          </div>
          <button
          type="button"
          className="grid size-11 place-items-center rounded-full bg-white text-[#234a6f] shadow-sm ring-1 ring-[#dbe8f4]"
          aria-label="Filters"
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <SlidersHorizontal className="size-5" />
        </button>
        </div>

        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            placeholder="Search products"
            className="h-14 w-full rounded-full border-0 bg-[#f5f9fd] pl-12 pr-5 text-base font-semibold text-[#0f172a] outline-none ring-1 ring-[#dbe8f4] placeholder:text-[#8ea3bd] focus:ring-2 focus:ring-[#608db9]"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>

        {filtersOpen && (
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                className={cn(
                  "h-14 shrink-0 rounded-full px-6 text-base font-bold transition",
                  category.id === activeCategoryId
                    ? "bg-[#608db9] text-white shadow-[0_10px_24px_rgba(96,141,185,0.26)]"
                    : "bg-[#f5f9fd] text-[#234a6f]",
                )}
                onClick={() => onCategoryChange(category.id)}
              >
                {category.label}
              </button>
            ))}
          </div>
        )}
      </section>

      <button
        type="button"
        className="grid grid-cols-[minmax(0,1fr)_8.5rem] items-center gap-4 rounded-[2rem] bg-[#f5f9fd] p-4 text-left shadow-[0_18px_44px_rgba(96,141,185,0.12)] ring-1 ring-[#dbe8f4]"
        onClick={() => onOpenDetail(selectedModel)}
      >
        <span className="grid gap-2">
          <span className="w-max rounded-full bg-[#f5b811] px-3 py-1 text-xs font-black text-white">
            AR ready
          </span>
          <strong className="line-clamp-2 text-xl font-black leading-tight">
            {selectedModel.label}
          </strong>
          <span className="line-clamp-2 text-sm leading-5 text-slate-500">
            {selectedModel.description}
          </span>
          <span className="w-max rounded-full bg-[#608db9] px-4 py-2 text-sm font-bold text-white">
            View details
          </span>
        </span>
        <ProductImage model={selectedModel} className="h-32 rounded-[1.5rem]" />
      </button>

      <section className="grid gap-4">
        <div>
          <div>
            <h2 className="text-2xl font-black tracking-normal">Products</h2>
            <p className="text-sm font-semibold text-slate-400">{catalogStatus}</p>
          </div>
        </div>

        {visibleModels.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-7">
            {visibleModels.map((model) => (
              <ProductTile
                key={model.id}
                model={model}
                selected={model.id === selectedModelId}
                onClick={() => {
                  onSelectModel(model);
                  onOpenDetail(model);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.5rem] bg-[#f5f9fd] p-5 text-sm font-semibold text-[#6b7f99] ring-1 ring-[#dbe8f4]">
            No products found for “{searchQuery}”.
          </div>
        )}
      </section>

      <div className="-mx-5 grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-t border-slate-100 bg-white px-5 py-4">
        <Button
          type="button"
          size="lg"
          className="h-14 rounded-[1.4rem] bg-[#608db9] text-base text-white hover:bg-[#507da8]"
          onClick={onStartSession}
        >
          <Play className="size-4" />
          Start AR
        </Button>
        {activeObjectCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-14 rounded-[1.4rem] px-4"
            onClick={onOpenSummary}
          >
            Quote
          </Button>
        )}
      </div>
    </>
  );
}

interface ShopProductDetailProps {
  model: ModelDefinition;
  relatedModels: ModelDefinition[];
  onBack: () => void;
  onSelectModel: (model: ModelDefinition) => void;
  onOpenDetail: (model: ModelDefinition) => void;
  onStartSession: () => void;
  onAddToQuote: (model: ModelDefinition) => void;
}

function ShopProductDetail({
  model,
  relatedModels,
  onBack,
  onSelectModel,
  onOpenDetail,
  onStartSession,
  onAddToQuote,
}: ShopProductDetailProps) {
  const galleryImages = uniqueImages(model);
  const [selectedImage, setSelectedImage] = useState(galleryImages[0] ?? null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSelectedImage(galleryImages[0] ?? null);
  }, [model.id, galleryImages[0]]);

  return (
    <>
      <header className="flex items-center justify-between">
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full bg-white text-[#234a6f] shadow-sm ring-1 ring-[#dbe8f4]"
          aria-label="Back to products"
          onClick={onBack}
        >
          <ArrowLeft className="size-5" />
        </button>
        <LogoHomeButton />
        <button
          type="button"
          className={cn(
            "grid size-11 place-items-center rounded-full bg-white shadow-sm ring-1 ring-[#dbe8f4]",
            saved ? "text-[#f5b811]" : "text-[#234a6f]",
          )}
          aria-label={saved ? "Remove favorite" : "Save product"}
          aria-pressed={saved}
          onClick={() => setSaved((isSaved) => !isSaved)}
        >
          <Heart className={cn("size-5", saved && "fill-current")} />
        </button>
      </header>

      <section className="grid gap-5">
        <ProductImage
          model={model}
          image={selectedImage ?? undefined}
          className="h-[22rem] rounded-[2.4rem]"
          large
        />

        {galleryImages.length > 1 && (
          <div className="flex justify-center gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {galleryImages.slice(0, 5).map((image) => (
              <button
                type="button"
                key={image}
                className={cn(
                  "grid size-20 shrink-0 place-items-center overflow-hidden rounded-[1.35rem] bg-white p-2 shadow-sm ring-4 transition",
                  image === selectedImage ? "ring-[#608db9]" : "ring-slate-100",
                )}
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={normalizeCatalogAssetUrl(image)}
                  alt=""
                  className="h-full w-full object-contain"
                />
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1 text-base font-black text-[#f2a11b]">
            ★ 4.8
          </span>
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
            AR ready
          </span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-slate-400">
              {OBJECT_TYPES[model.type].label}
            </p>
            <h1 className="mt-1 text-[2rem] font-black leading-tight tracking-normal">
              {model.label}
            </h1>
          </div>
          {model.price != null && (
            <strong className="shrink-0 text-2xl font-black text-[#608db9]">
              {formatModelPrice(model.price, model.unit)}
            </strong>
          )}
        </div>

        <p className="text-base leading-7 text-slate-600">{model.description}</p>
      </section>

      {model.variants?.length ? (
        <ProductRail title="Variants" subtitle="Sizes and finishes from this product.">
          {model.variants.slice(0, 5).map((variant) => (
            <button
              type="button"
              key={variant.id}
              className="grid min-w-32 gap-2 rounded-[1.35rem] bg-slate-50 p-3 text-left ring-1 ring-slate-100"
              onClick={() => {
                const variantModel = createVariantModel(model, variant);
                onOpenDetail(variantModel);
              }}
            >
              {variant.thumbnail ? (
                <img
                  src={normalizeCatalogAssetUrl(variant.thumbnail)}
                  alt=""
                  className="h-20 w-full rounded-2xl object-contain"
                />
              ) : (
                <div className="grid h-20 place-items-center rounded-2xl bg-white">
                  <Box className="size-8 text-slate-400" />
                </div>
              )}
              <strong className="line-clamp-2 text-sm font-black text-[#0f172a]">
                {variant.label}
              </strong>
              {variant.price != null && (
                <span className="text-sm font-bold text-slate-500">
                  {formatModelPrice(variant.price)}
                </span>
              )}
            </button>
          ))}
        </ProductRail>
      ) : null}

      {relatedModels.length > 0 && (
        <ProductRail title="Related products" subtitle="More products for this project.">
          {relatedModels.map((relatedModel) => (
            <ProductTile
              key={relatedModel.id}
              model={relatedModel}
              compact
              onClick={() => onSelectModel(relatedModel)}
            />
          ))}
        </ProductRail>
      )}

      <div className="-mx-5 grid gap-3 border-t border-slate-100 bg-white px-5 py-4">
        {model.price != null && (
          <strong className="text-2xl font-black leading-tight text-[#608db9]">
            {formatModelPrice(model.price, model.unit)}
          </strong>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-14 rounded-[1.4rem] border-[#dbe8f4] text-base font-black text-[#608db9]"
            onClick={() => onAddToQuote(model)}
          >
            Add to Quote
          </Button>
          <Button
            type="button"
            size="lg"
            className="h-14 rounded-[1.4rem] bg-[#608db9] text-base text-white hover:bg-[#507da8]"
            onClick={() => {
              onSelectModel(model);
              onStartSession();
            }}
          >
            <Play className="size-4" />
            Start AR
          </Button>
        </div>
      </div>
    </>
  );
}

function createVariantModel(
  parent: ModelDefinition,
  variant: ModelVariantDefinition,
): ModelDefinition {
  const variantImages = variant.thumbnail ? [variant.thumbnail] : [];

  return {
    ...parent,
    id: `${parent.id}-${variant.id}`,
    label: `${parent.label} - ${variant.label}`,
    description:
      variant.widthCm && variant.heightCm
        ? `${parent.label} variant sized ${variant.widthCm} x ${variant.heightCm} cm.`
        : parent.description,
    thumbnail: variant.thumbnail ?? null,
    images: variantImages,
    variants: [],
    defaultWidthCm: variant.widthCm ?? parent.defaultWidthCm ?? null,
    defaultHeightCm: variant.heightCm ?? parent.defaultHeightCm ?? null,
    price: variant.price ?? parent.price ?? null,
    unit: null,
  };
}

function ShopMenu({ onClose }: { onClose: () => void }) {
  return (
    <nav className="grid gap-2 rounded-[1.5rem] bg-[#f5f9fd] p-3 text-[#234a6f] ring-1 ring-[#dbe8f4]">
      {[
        ["Home", "/"],
        ["Products", "/products"],
        ["Quote", "/quote"],
        ["Track", "/track"],
      ].map(([label, href]) => (
        <button
          type="button"
          key={href}
          className="rounded-2xl px-4 py-3 text-left text-base font-bold hover:bg-white"
          onClick={() => {
            onClose();
            window.location.assign(href);
          }}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}

function LogoHomeButton() {
  return (
    <button
      type="button"
      className="grid size-12 place-items-center rounded-full"
      aria-label="Go to home page"
      onClick={() => window.location.assign("/")}
    >
      <img
        src="/images/sog-logo.png"
        alt="SOG Glass and Aluminum"
        className="size-12 object-contain"
      />
    </button>
  );
}

function ProductRail({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-3">
      <div>
        <h2 className="text-xl font-black tracking-normal">{title}</h2>
        <p className="text-sm font-semibold text-slate-400">{subtitle}</p>
      </div>
      <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </section>
  );
}

function ProductTile({
  model,
  selected = false,
  compact = false,
  onClick,
}: {
  model: ModelDefinition;
  selected?: boolean;
  compact?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn("grid min-w-0 gap-3 text-left", compact && "w-36 shrink-0")}
      onClick={onClick}
    >
      <ProductImage
        model={model}
        className={cn(compact ? "h-32 rounded-[1.5rem]" : "h-44 rounded-[1.8rem]")}
      />
      <span className="grid gap-1">
        <span className="flex min-w-0 items-center gap-2">
          <strong className="truncate text-lg font-black leading-tight text-[#0f172a]">
            {model.label}
          </strong>
          {selected && <CheckCircle2 className="size-4 shrink-0 text-[#f2bd38]" />}
        </span>
        {model.price != null && (
          <span className="text-base font-semibold text-slate-700">
            {formatModelPrice(model.price, model.unit)}
          </span>
        )}
        <VariantDots model={model} />
      </span>
    </button>
  );
}

function ProductImage({
  model,
  image,
  className,
  large = false,
}: {
  model: ModelDefinition;
  image?: string;
  className?: string;
  large?: boolean;
}) {
  const imageUrl = image ?? model.thumbnail;

  return (
    <div
      className={cn(
        "relative grid place-items-center overflow-hidden bg-slate-50",
        className,
      )}
    >
      {imageUrl ? (
        <img
          src={normalizeCatalogAssetUrl(imageUrl)}
          alt=""
          className={cn(
            "h-full w-full object-contain",
            large ? "p-4 drop-shadow-[0_28px_30px_rgba(15,23,42,0.12)]" : "p-3",
          )}
        />
      ) : (
        <Box
          className={cn(large ? "size-20" : "size-10")}
          style={{ color: OBJECT_TYPES[model.type].color }}
        />
      )}
    </div>
  );
}

function VariantDots({ model }: { model: ModelDefinition }) {
  const count = Math.max(2, Math.min(4, model.variants?.length ?? 2));

  return (
    <span className="mt-1 flex gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <span
          key={index}
          className={cn(
            "size-2 rounded-full",
            index === 0 ? "bg-[#608db9]" : index === 1 ? "bg-[#f5b811]" : "bg-[#b8c4b3]",
          )}
        />
      ))}
    </span>
  );
}

function filterModels(
  models: ModelDefinition[],
  activeCategoryId: ModelCategoryId,
  searchQuery: string,
) {
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const categoryModels =
    activeCategoryId === "all" || normalizedSearch
      ? models
      : models.filter((model) => model.category === activeCategoryId);

  if (!normalizedSearch) return categoryModels;

  return categoryModels.filter((model) =>
    [model.label, model.description, model.category]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch),
  );
}

function uniqueImages(model: ModelDefinition) {
  const images = [
    model.thumbnail,
    ...(model.images ?? []),
    ...(model.variants?.map((variant) => variant.thumbnail) ?? []),
  ].filter((url): url is string => Boolean(url));

  return [...new Map(images.map((url) => [normalizeCatalogAssetUrl(url), url])).values()];
}

function formatModelPrice(price: number, unit?: string | null) {
  const formatted = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(price);

  return unit ? `${formatted} / ${unit}` : formatted;
}
