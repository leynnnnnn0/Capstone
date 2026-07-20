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
import { useEffect, useRef, useState, type ReactNode } from "react";
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
  const shopRef = useRef<HTMLElement>(null);

  useEffect(() => {
    shopRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [detailModel?.id]);

  return (
    <section
      ref={shopRef}
      className="pointer-events-auto absolute inset-0 z-20 overflow-y-auto bg-[#edf2f6] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] text-[#162d4a] sm:px-6 sm:pt-6"
      data-xr-ui="true"
      data-slot="ar-shop"
    >
      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-5 pb-3 sm:gap-6">
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
      <header className="relative overflow-hidden rounded-[1.75rem] bg-[#162d4a] p-4 text-white shadow-[0_22px_65px_rgba(22,45,74,0.18)] sm:p-6 lg:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full border border-white/10 bg-[#608db9]/15" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 size-48 rounded-full bg-white/[0.035]" />

        <div className="relative flex items-center justify-between">
          <button
            type="button"
            className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-white transition hover:bg-white/10"
            aria-label="Menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Menu className="size-5" />
          </button>
          <LogoHomeButton dark />
          <button
            type="button"
            className="relative grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-white transition hover:bg-white/10"
            aria-label="Quote summary"
            onClick={onOpenSummary}
          >
            <ClipboardList className="size-5" />
            {activeObjectCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-[#608db9] px-1.5 text-[10px] font-bold text-white ring-2 ring-[#162d4a]">
                {activeObjectCount}
              </span>
            )}
          </button>
        </div>

        <div className="relative mt-8 max-w-2xl sm:mt-12">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#b9cfe0]">
            SOG augmented reality
          </p>
          <h1 className="mt-2 text-3xl font-medium leading-[0.98] tracking-[-0.045em] sm:text-5xl">
            Find the right fit before installation.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/55 sm:text-base">
            Explore the catalog, preview products at scale, and carry accurate dimensions into your quote.
          </p>
        </div>
      </header>

      {menuOpen && <ShopMenu onClose={() => setMenuOpen(false)} />}

      <section className="grid gap-3 rounded-[1.5rem] border border-[#dce4ea] bg-white p-3 shadow-[0_14px_42px_rgba(22,45,74,0.055)] sm:p-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#608db9]">
              Product catalog
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#162d4a] sm:text-2xl">
              Discover products
            </h2>
          </div>
          <button
          type="button"
          className="grid size-10 place-items-center rounded-xl bg-[#edf3f7] text-[#315b7d] transition hover:bg-[#dfeaf1]"
          aria-label="Filters"
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <SlidersHorizontal className="size-5" />
        </button>
        </div>

        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7e94a7]" />
          <input
            type="search"
            value={searchQuery}
            placeholder="Search products"
            className="h-12 w-full rounded-xl border-0 bg-[#f4f7f9] pl-11 pr-4 text-sm font-medium text-[#162d4a] outline-none ring-1 ring-[#dce4ea] placeholder:text-[#8ca0b2] focus:ring-2 focus:ring-[#608db9]"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>

        {filtersOpen && (
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                className={cn(
                  "h-10 shrink-0 rounded-xl px-4 text-sm font-semibold transition",
                  category.id === activeCategoryId
                    ? "bg-[#162d4a] text-white shadow-[0_8px_20px_rgba(22,45,74,0.18)]"
                    : "bg-[#edf3f7] text-[#315b7d] hover:bg-[#dfeaf1]",
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
        className="group grid grid-cols-[minmax(0,1fr)_7.5rem] items-center gap-4 overflow-hidden rounded-[1.75rem] border border-[#dce4ea] bg-white p-4 text-left shadow-[0_18px_50px_rgba(22,45,74,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(22,45,74,0.12)] sm:grid-cols-[minmax(0,1fr)_13rem] sm:p-6 lg:grid-cols-[minmax(0,1fr)_18rem]"
        onClick={() => onOpenDetail(selectedModel)}
      >
        <span className="grid gap-2 sm:gap-3">
          <span className="w-max rounded-full bg-[#e8f0f5] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#315b7d]">
            AR ready
          </span>
          <strong className="line-clamp-2 text-xl font-semibold leading-tight tracking-[-0.03em] text-[#162d4a] sm:text-3xl">
            {selectedModel.label}
          </strong>
          <span className="line-clamp-2 text-sm leading-5 text-[#6f879b] sm:max-w-xl">
            {selectedModel.description}
          </span>
          <span className="w-max rounded-xl bg-[#162d4a] px-4 py-2 text-xs font-semibold text-white transition group-hover:bg-[#315b7d]">
            View details
          </span>
        </span>
        <ProductImage model={selectedModel} className="h-32 rounded-[1.35rem] sm:h-44 lg:h-52" />
      </button>

      <section className="grid gap-4 rounded-[1.5rem] border border-[#dce4ea] bg-white p-4 shadow-[0_14px_42px_rgba(22,45,74,0.05)] sm:p-6">
        <div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#608db9]">Browse collection</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#162d4a] sm:text-2xl">Products</h2>
            <p className="mt-1 text-sm text-[#7e94a7]">{catalogStatus}</p>
          </div>
        </div>

        {visibleModels.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
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
          <div className="rounded-[1.25rem] border border-dashed border-[#cfdbe4] bg-[#f4f7f9] p-6 text-sm text-[#6f879b]">
            No products found for “{searchQuery}”.
          </div>
        )}
      </section>

      <div className="sticky bottom-0 z-30 -mx-1 grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-[1.35rem] border border-white/80 bg-white/95 p-2 shadow-[0_-10px_35px_rgba(22,45,74,0.1)] backdrop-blur-xl sm:mx-0 sm:ml-auto sm:w-fit sm:min-w-[24rem]">
        <Button
          type="button"
          size="lg"
          className="h-12 rounded-xl bg-[#162d4a] px-6 text-sm font-semibold text-white hover:bg-[#315b7d]"
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
            className="h-12 rounded-xl border-[#dce4ea] px-4 text-[#315b7d]"
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
      <header className="relative flex items-center justify-between overflow-hidden rounded-[1.75rem] bg-[#162d4a] p-4 text-white shadow-[0_22px_65px_rgba(22,45,74,0.18)] sm:p-6">
        <div className="pointer-events-none absolute -right-14 -top-16 size-44 rounded-full border border-white/10 bg-[#608db9]/15" />
        <button
          type="button"
          className="relative grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-white transition hover:bg-white/10"
          aria-label="Back to products"
          onClick={onBack}
        >
          <ArrowLeft className="size-5" />
        </button>
        <LogoHomeButton dark />
        <button
          type="button"
          className={cn(
            "relative grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[0.06] transition hover:bg-white/10",
            saved ? "text-[#b9cfe0]" : "text-white",
          )}
          aria-label={saved ? "Remove favorite" : "Save product"}
          aria-pressed={saved}
          onClick={() => setSaved((isSaved) => !isSaved)}
        >
          <Heart className={cn("size-5", saved && "fill-current")} />
        </button>
      </header>

      <section className="grid gap-4 rounded-[1.75rem] border border-[#dce4ea] bg-white p-3 shadow-[0_18px_50px_rgba(22,45,74,0.07)] sm:p-5">
        <ProductImage
          model={model}
          image={selectedImage ?? undefined}
          className="h-[19rem] rounded-[1.4rem] sm:h-[28rem]"
          large
        />

        {galleryImages.length > 1 && (
          <div className="flex justify-center gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {galleryImages.slice(0, 5).map((image) => (
              <button
                type="button"
                key={image}
                className={cn(
                  "grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f4f7f9] p-2 ring-2 transition sm:size-20",
                  image === selectedImage ? "ring-[#608db9]" : "ring-[#e4ebf0]",
                )}
                onClick={() => setSelectedImage(image)}
              >
                <ProductImage model={model} image={image} className="h-full w-full" />
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 rounded-[1.5rem] border border-[#dce4ea] bg-white p-5 shadow-[0_14px_42px_rgba(22,45,74,0.05)] sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#608db9]">
            ★ 4.8
          </span>
          <span className="rounded-full bg-[#e8f0f5] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#315b7d]">
            AR ready
          </span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7e94a7]">
              {OBJECT_TYPES[model.type].label}
            </p>
            <h1 className="mt-2 text-3xl font-medium leading-tight tracking-[-0.04em] text-[#162d4a] sm:text-4xl">
              {model.label}
            </h1>
          </div>
          {model.price != null && (
            <strong className="shrink-0 text-xl font-semibold text-[#315b7d] sm:text-2xl">
              {formatModelPrice(model.price, model.unit)}
            </strong>
          )}
        </div>

        <p className="text-sm leading-6 text-[#6f879b] sm:text-base">{model.description}</p>
      </section>

      {model.variants?.length ? (
        <ProductRail title="Variants" subtitle="Sizes and finishes from this product.">
          {model.variants.slice(0, 5).map((variant) => (
            <button
              type="button"
              key={variant.id}
              className="grid min-w-36 gap-2 rounded-[1.25rem] border border-[#e4ebf0] bg-white p-3 text-left shadow-sm"
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
                <div className="grid h-20 place-items-center rounded-xl bg-[#f4f7f9]">
                  <Box className="size-8 text-[#7e94a7]" />
                </div>
              )}
              <strong className="line-clamp-2 text-sm font-semibold text-[#162d4a]">
                {variant.label}
              </strong>
              {variant.price != null && (
                <span className="text-sm font-medium text-[#6f879b]">
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

      <div className="sticky bottom-0 z-30 -mx-1 grid gap-2 rounded-[1.35rem] border border-white/80 bg-white/95 p-2 shadow-[0_-10px_35px_rgba(22,45,74,0.1)] backdrop-blur-xl sm:mx-0 sm:ml-auto sm:w-fit sm:min-w-[30rem]">
        {model.price != null && (
          <strong className="px-2 pt-1 text-lg font-semibold leading-tight text-[#315b7d]">
            {formatModelPrice(model.price, model.unit)}
          </strong>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-12 rounded-xl border-[#dce4ea] text-sm font-semibold text-[#315b7d]"
            onClick={() => onAddToQuote(model)}
          >
            Add to Quote
          </Button>
          <Button
            type="button"
            size="lg"
            className="h-12 rounded-xl bg-[#162d4a] text-sm font-semibold text-white hover:bg-[#315b7d]"
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
    <nav className="grid gap-1 rounded-[1.25rem] border border-[#dce4ea] bg-white p-2 text-[#315b7d] shadow-[0_14px_42px_rgba(22,45,74,0.08)]">
      {[
        ["Home", "/"],
        ["Products", "/products"],
        ["Quote", "/quote"],
        ["Track", "/track"],
      ].map(([label, href]) => (
        <button
          type="button"
          key={href}
          className="rounded-xl px-4 py-3 text-left text-sm font-semibold transition hover:bg-[#edf3f7]"
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

function LogoHomeButton({ dark = false }: { dark?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "grid size-12 place-items-center rounded-xl transition",
        dark ? "bg-white shadow-[0_8px_24px_rgba(0,0,0,0.16)]" : "bg-white ring-1 ring-[#dce4ea]",
      )}
      aria-label="Go to home page"
      onClick={() => window.location.assign("/")}
    >
      <img
        src="/ar/images/sog-logo.png"
        alt="SOG Glass and Aluminum"
        className="size-10 object-contain"
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
    <section className="grid gap-3 rounded-[1.5rem] border border-[#dce4ea] bg-white p-4 shadow-[0_14px_42px_rgba(22,45,74,0.05)] sm:p-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#608db9]">Explore more</p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#162d4a]">{title}</h2>
        <p className="mt-1 text-sm text-[#7e94a7]">{subtitle}</p>
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
      className={cn(
        "grid min-w-0 gap-3 rounded-[1.25rem] border border-[#e4ebf0] bg-white p-2.5 text-left shadow-[0_8px_24px_rgba(22,45,74,0.05)] transition hover:-translate-y-0.5 hover:border-[#cbdbe6] hover:shadow-[0_14px_32px_rgba(22,45,74,0.1)]",
        compact && "w-40 shrink-0",
      )}
      onClick={onClick}
    >
      <ProductImage
        model={model}
        className={cn(compact ? "h-32 rounded-xl" : "h-36 rounded-xl sm:h-44")}
      />
      <span className="grid gap-1">
        <span className="flex min-w-0 items-center gap-2">
          <strong className="truncate text-sm font-semibold leading-tight text-[#162d4a] sm:text-base">
            {model.label}
          </strong>
          {selected && <CheckCircle2 className="size-4 shrink-0 text-[#608db9]" />}
        </span>
        {model.price != null && (
          <span className="text-sm font-medium text-[#6f879b]">
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
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  return (
    <div
      className={cn(
        "relative grid place-items-center overflow-hidden bg-[#f4f7f9]",
        className,
      )}
    >
      {imageUrl && !imageFailed ? (
        <img
          src={normalizeCatalogAssetUrl(imageUrl)}
          alt=""
          className={cn(
            "h-full w-full object-contain",
            large ? "p-4 drop-shadow-[0_28px_30px_rgba(15,23,42,0.12)]" : "p-3",
          )}
          onError={() => setImageFailed(true)}
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
            index === 0 ? "bg-[#315b7d]" : index === 1 ? "bg-[#8fb0c8]" : "bg-[#d6e1e8]",
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
