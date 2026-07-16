"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, type PanInfo } from "framer-motion";
import {
  Box,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";
import {
  type CSSProperties,
  type KeyboardEvent,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import Product3DModelViewer from "@/components/products/Product3DModelViewer";
import type { Product } from "@/features/products/types";
import {
  model3DUrl,
  product3DModel,
  productCategories,
  productCover,
} from "@/features/products/product-utils";
import { cn } from "@/lib/utils";

import styles from "./EditorialProductShowcase.module.css";

type EditorialProductShowcaseProps = {
  products: Product[];
  loading?: boolean;
};

type ShowcaseItem = {
  key: string;
  name: string;
  category: string;
  material: string;
  capability: string;
  cover: string;
  coverPosition?: string;
  modelSrc: string;
  href: string;
};

type CarouselConfig = {
  CARD_WIDTH: number;
  GAP: number;
  ARC_HEIGHT: number;
  ROTATE_STEP: number;
  MAX_ROTATE: number;
  HEIGHT_BOOST: number;
  BASE_HEIGHT: number;
  visibleCards: number;
};

function getCarouselConfig(viewportWidth: number): CarouselConfig {
  if (viewportWidth < 640) {
    return {
      CARD_WIDTH: 160,
      GAP: 10,
      ARC_HEIGHT: 24,
      ROTATE_STEP: 8,
      MAX_ROTATE: 18,
      HEIGHT_BOOST: 30,
      BASE_HEIGHT: 240,
      visibleCards: 3,
    };
  }

  if (viewportWidth < 1024) {
    return {
      CARD_WIDTH: 170,
      GAP: 14,
      ARC_HEIGHT: 30,
      ROTATE_STEP: 9,
      MAX_ROTATE: 22,
      HEIGHT_BOOST: 35,
      BASE_HEIGHT: 260,
      visibleCards: 5,
    };
  }

  return {
    CARD_WIDTH: 200,
    GAP: 20,
    ARC_HEIGHT: 48,
    ROTATE_STEP: 10,
    MAX_ROTATE: 25,
    HEIGHT_BOOST: 45,
    BASE_HEIGHT: 300,
    visibleCards: 7,
  };
}

function getCardStyle(
  offset: number,
  config: CarouselConfig,
  isVisible: boolean,
): CSSProperties {
  const {
    ARC_HEIGHT,
    BASE_HEIGHT,
    CARD_WIDTH,
    GAP,
    HEIGHT_BOOST,
    MAX_ROTATE,
    ROTATE_STEP,
  } = config;
  const angle = (offset * Math.PI) / 8;
  const translateY = ARC_HEIGHT * (1 - Math.cos(angle));
  const finalTranslateY = -translateY;
  const translateX = offset * (CARD_WIDTH + GAP);
  const rotateY = Math.max(
    -MAX_ROTATE,
    Math.min(MAX_ROTATE, -offset * ROTATE_STEP),
  );
  const absOffset = Math.abs(offset);
  const height = BASE_HEIGHT + (absOffset === 0 ? HEIGHT_BOOST : 0);

  return {
    width: CARD_WIDTH,
    height: `${height}px`,
    marginLeft: `${-CARD_WIDTH / 2}px`,
    transform: `translateX(${translateX}px) translateY(${finalTranslateY}px) rotateY(${rotateY}deg)`,
    transformOrigin: "center bottom",
    zIndex: 100 - absOffset,
    opacity: isVisible ? 1 : 0,
    pointerEvents: isVisible ? "auto" : "none",
    transition:
      "width 450ms ease-in-out, height 450ms ease-in-out, margin-left 450ms ease-in-out, transform 450ms cubic-bezier(0.25, 0.1, 0.25, 1), opacity 300ms ease",
    willChange: "transform",
  };
}

function isCardWithinVisibleRange(
  index: number,
  activeIndex: number,
  itemCount: number,
  visibleCards: number,
) {
  if (visibleCards >= itemCount) return true;

  const radius = Math.floor(visibleCards / 2);
  let start = activeIndex - radius;
  let end = start + visibleCards - 1;

  if (start < 0) {
    end -= start;
    start = 0;
  }

  if (end >= itemCount) {
    start -= end - itemCount + 1;
    end = itemCount - 1;
  }

  return index >= Math.max(0, start) && index <= end;
}

const showcaseDefinitions = [
  {
    name: "Ultra Clear Frameless Door",
    category: "Glass Door",
    material: "Polished Stainless",
    cover: "/images/landing/showcase/ultra-clear-frameless-door.png",
  },
  {
    name: "Vista Slide Sliding Window",
    category: "Sliding Window",
    material: "Black Aluminum",
    cover: "/images/landing/showcase/vista-slide-window.png",
  },
  {
    name: "Aero Casement Window",
    category: "Casement Window",
    material: "White Aluminum",
    cover: "/images/landing/showcase/aero-casement-window.png",
  },
  {
    name: "Metro Slide Sliding Door",
    category: "Sliding Door",
    material: "Black Aluminum",
    cover: "/images/landing/showcase/metro-slide-door.png",
  },
  {
    name: "ClearView Glass Partition",
    category: "Glass Partition",
    material: "Black Aluminum",
    cover: "/images/landing/showcase/clearview-partition.png",
  },
  {
    name: "Showcase Pro Glass Cabinet",
    category: "Glass Cabinet",
    material: "Black Aluminum",
    cover: "/images/landing/showcase/showcase-pro-cabinet.png",
  },
  {
    name: "Ventus Awning Window",
    category: "Awning Window",
    material: "Charcoal Aluminum",
    cover: "/images/landing/showcase/ventus-awning-window.png",
  },
];

function toShowcaseItem(product: Product, index: number): ShowcaseItem {
  const definition = showcaseDefinitions[index] ?? showcaseDefinitions[0];

  return {
    key: String(product.id),
    name: definition.name,
    category:
      definition.category ??
      productCategories(product)[0]?.name ??
      "Made to measure",
    material: definition.material,
    capability: "AR Ready",
    cover: definition.cover || productCover(product),
    modelSrc: model3DUrl(product3DModel(product)),
    href: `/products/${product.id}`,
  };
}

const fallbackItems: ShowcaseItem[] = showcaseDefinitions.map(
  (definition, index) => ({
    key: `showcase-${index + 1}`,
    ...definition,
    capability: "AR Ready",
    modelSrc: "",
    href: "/products",
  }),
);

function subscribeToViewport(onStoreChange: () => void) {
  const breakpointQueries = [
    window.matchMedia("(max-width: 639px)"),
    window.matchMedia("(min-width: 640px) and (max-width: 1023px)"),
    window.matchMedia("(min-width: 1024px)"),
  ];

  window.addEventListener("resize", onStoreChange);
  breakpointQueries.forEach((query) =>
    query.addEventListener("change", onStoreChange),
  );

  return () => {
    window.removeEventListener("resize", onStoreChange);
    breakpointQueries.forEach((query) =>
      query.removeEventListener("change", onStoreChange),
    );
  };
}

function getViewportWidth() {
  return window.innerWidth;
}

function getServerViewportWidth() {
  return 1024;
}

function useCarouselConfig() {
  const viewportWidth = useSyncExternalStore(
    subscribeToViewport,
    getViewportWidth,
    getServerViewportWidth,
  );

  return useMemo(() => getCarouselConfig(viewportWidth), [viewportWidth]);
}

export default function EditorialProductShowcase({
  products,
  loading = false,
}: EditorialProductShowcaseProps) {
  const items = useMemo(
    () =>
      products.length > 0
        ? products.slice(0, 7).map(toShowcaseItem)
        : fallbackItems,
    [products],
  );
  const [selectedIndex, setSelectedIndex] = useState(3);
  const carouselConfig = useCarouselConfig();
  const activeIndex = Math.min(selectedIndex, items.length - 1);
  const activeItem = items[activeIndex];

  function selectPrevious() {
    setSelectedIndex((current) =>
      current <= 0 ? items.length - 1 : current - 1,
    );
  }

  function selectNext() {
    setSelectedIndex((current) =>
      current >= items.length - 1 ? 0 : current + 1,
    );
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectPrevious();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      selectNext();
    }
  }

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.x < -45) selectNext();
    if (info.offset.x > 45) selectPrevious();
  }

  return (
    <section
      aria-label="SOG product collection"
      className="bg-white"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className={styles.showcase}>
        <span className={cn(styles.corner, styles.topLeft)} />
        <span className={cn(styles.corner, styles.topRight)} />
        <span className={cn(styles.corner, styles.bottomLeft)} />
        <span className={cn(styles.corner, styles.bottomRight)} />

        <div className="relative z-10 mx-auto max-w-4xl px-4 pt-8 text-center sm:px-8 sm:pt-12 lg:px-16 lg:pt-10">
          <div className="mb-3 flex items-center justify-center gap-3 text-[8px] font-bold uppercase tracking-widest text-slate-400 sm:mb-4 sm:gap-4 sm:text-[10px]">
            <span className="h-px w-5 bg-slate-300 sm:w-8 " />
            The SOG Collection · Vol. 01
            <span className="h-px w-5 bg-slate-300 sm:w-8" />
          </div>
          <h1 className="font-poppins text-3xl leading-[0.96] tracking-[-0.045em] text-slate-950 sm:text-4xl lg:text-5xl">
            Spaces transformed,
            <br />
            framed in light
          </h1>
        </div>

        <motion.div
          className={cn(
            styles.stage,
            "relative mx-auto mt-6 flex h-[310px] w-full max-w-[1400px] items-end justify-center sm:mt-9 sm:h-[350px] lg:mt-10 lg:h-[390px]",
          )}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          onDragEnd={handleDragEnd}
          style={{
            perspective: "900px",
            perspectiveOrigin: "50% 50%",
            transformStyle: "preserve-3d",
          }}
        >
          <span className={styles.collectionNumber} aria-hidden="true">
            {String(activeIndex + 1).padStart(2, "0")}
          </span>

          {items.map((item, index) => {
            const offset = index - activeIndex;
            const isVisible = isCardWithinVisibleRange(
              index,
              activeIndex,
              items.length,
              carouselConfig.visibleCards,
            );
            const isActive = index === activeIndex;

            return (
              <article
                key={item.key}
                aria-current={isActive ? "true" : undefined}
                aria-hidden={!isVisible}
                aria-label={`${index + 1} of ${items.length}: ${item.name}`}
                className={cn(
                  styles.card,
                  "absolute bottom-5 left-1/2 origin-bottom",
                  isActive && styles.cardActive,
                )}
                onClick={() => setSelectedIndex(index)}
                style={getCardStyle(offset, carouselConfig, isVisible)}
              >
                {isActive && item.modelSrc ? (
                  <Product3DModelViewer
                    src={item.modelSrc}
                    title={`${item.name} interactive 3D model`}
                    hideHeader
                    ar
                    className={cn(
                      styles.modelViewer,
                      "h-full rounded-none border-0 bg-slate-100",
                    )}
                    viewportClassName="h-full"
                  />
                ) : (
                  <Image
                    src={item.cover}
                    alt={`${item.name} product preview`}
                    fill
                    sizes="(max-width: 639px) 160px, (max-width: 1023px) 170px, 200px"
                    className={styles.cardMedia}
                    style={{
                      objectPosition: item.coverPosition ?? "center",
                    }}
                  />
                )}
                <div className={styles.cardScrim} />
                <span className={styles.cardIndex}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2 className={cn(styles.cardLabel, "text-xs sm:text-sm")}>
                  {item.name}
                </h2>
              </article>
            );
          })}
        </motion.div>

        <div className="relative z-30 mx-auto flex w-full max-w-[1440px] grid-cols-[auto_1fr] items-center justify-center gap-3 px-4 pb-8 pt-7 sm:mt-auto sm:grid sm:grid-cols-[auto_1fr_auto] sm:items-end sm:gap-4 sm:px-8 sm:pt-8 lg:px-16 lg:pt-8">
          <div className="font-[Georgia] text-2xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-3xl lg:text-4xl hidden sm:flex">
            {String(activeIndex + 1).padStart(2, "0")}
            <span className="ml-1 font-sans text-[10px] font-medium tracking-normal text-slate-400 sm:text-xs">
              / {String(items.length).padStart(2, "0")}
            </span>
          </div>

          <div className="min-w-0 text-center" aria-live="polite">
            <p className="text-[9px] font-bold uppercase tracking-[0.26em] text-slate-400 sm:text-[10px] sm:tracking-[0.3em]">
              <span className="sm:hidden">Swipe</span>
              <span className="hidden sm:inline">
                Drag · Swipe · Arrow keys
              </span>
            </p>
            <Link
              href={activeItem.href}
              className="mt-2 block font-poppins text-2xl font-light leading-tight tracking-[-0.03em] text-slate-950 transition-colors hover:text-primary sm:mt-3 sm:text-3xl lg:text-4xl"
            >
              {activeItem.name}
            </Link>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-xs font-medium text-slate-500 sm:gap-x-2 sm:text-sm">
              <span>{activeItem.category}</span>
              <span>·</span>
              <span>{activeItem.material}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                {activeItem.modelSrc && <Box className="h-3.5 w-3.5" />}
                {activeItem.capability}
              </span>
              <span className="hidden items-center gap-1 sm:inline-flex">
                <Star className="h-3 w-3 fill-[#2563eb] text-[#2563eb]" /> 4.9
              </span>
            </div>
            <div
              className="mt-3 flex flex-wrap justify-center gap-1.5 sm:gap-2"
              aria-label="Choose a product"
            >
              {items.map((item, index) => (
                <button
                  key={item.key}
                  type="button"
                  aria-label={`Show ${item.name}`}
                  aria-pressed={index === activeIndex}
                  onClick={() => setSelectedIndex(index)}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-all sm:h-2 sm:w-2",
                    index === activeIndex
                      ? "scale-125 bg-[#2563eb]"
                      : "bg-slate-300 hover:bg-slate-400",
                  )}
                />
              ))}
            </div>
            {loading && products.length === 0 && (
              <span className="mt-2 block text-[10px] text-slate-400">
                Loading the live collection…
              </span>
            )}
          </div>

          <div className="hidden gap-2 sm:flex sm:gap-3">
            <button
              type="button"
              onClick={selectPrevious}
              aria-label="Previous product"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-transparent text-slate-900 transition-colors hover:border-slate-950 sm:h-10 sm:w-10"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={selectNext}
              aria-label="Next product"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-transparent text-slate-900 transition-colors hover:border-slate-950 sm:h-10 sm:w-10"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
