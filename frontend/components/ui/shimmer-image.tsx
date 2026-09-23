"use client"

import * as React from "react"
import Image, { type ImageProps } from "next/image"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type ShimmerImageProps = ImageProps & {
  skeletonClassName?: string
}

function imageSourceKey(src: ImageProps["src"]) {
  if (typeof src === "string") return src
  return "src" in src ? src.src : src.default.src
}

function ShimmerImage({
  src,
  alt,
  className,
  skeletonClassName,
  onLoad,
  ...props
}: ShimmerImageProps) {
  const [loadedSource, setLoadedSource] = React.useState<string | null>(null)
  const sourceKey = imageSourceKey(src)
  const loaded = loadedSource === sourceKey

  return (
    <>
      <Skeleton
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 z-0 rounded-none transition-opacity duration-300",
          loaded && "opacity-0",
          skeletonClassName,
        )}
      />
      <Image
        {...props}
        src={src}
        alt={alt}
        className={cn(
          "duration-500",
          className,
          "transition-[opacity,transform]",
          loaded ? "opacity-100" : "opacity-0",
        )}
        onLoad={(event) => {
          setLoadedSource(sourceKey)
          onLoad?.(event)
        }}
      />
    </>
  )
}

type NativeShimmerImageProps = React.ComponentProps<"img"> & {
  containerClassName?: string
  skeletonClassName?: string
}

function NativeShimmerImage({
  src,
  alt = "",
  className,
  containerClassName,
  skeletonClassName,
  onLoad,
  loading = "lazy",
  decoding = "async",
  ...props
}: NativeShimmerImageProps) {
  const [loadedSource, setLoadedSource] = React.useState<string | null>(null)
  const sourceKey = typeof src === "string" ? src : null
  const loaded = Boolean(sourceKey) && loadedSource === sourceKey

  return (
    <span className={cn("relative block h-full w-full overflow-hidden", containerClassName)}>
      <Skeleton
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 rounded-none transition-opacity duration-300",
          loaded && "opacity-0",
          skeletonClassName,
        )}
      />
      {/* Product media can be served by user-configured storage hosts, so it intentionally uses a native image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        {...props}
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        className={cn(
          "duration-500",
          className,
          "transition-[opacity,transform]",
          loaded ? "opacity-100" : "opacity-0",
        )}
        onLoad={(event) => {
          if (sourceKey) setLoadedSource(sourceKey)
          onLoad?.(event)
        }}
      />
    </span>
  )
}

export { NativeShimmerImage, ShimmerImage }
