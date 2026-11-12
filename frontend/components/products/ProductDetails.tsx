"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Tabs } from "radix-ui";
import { Box, ExternalLink, ImageIcon, Package, Pencil, Settings2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Product3DModelViewer from "@/components/products/Product3DModelViewer";
import type { Product } from "@/features/products/types";
import {
  formatFileSize,
  formatCurrency,
  imageUrl,
  model3DUrl,
  optionGroupOptions,
  product3DModel,
  productCategories,
  productImages,
  productOptionGroups,
  productWarranty,
} from "@/features/products/product-utils";
import { safeReturnTo, withReturnTo } from "@/lib/return-to";

export default function ProductDetails({ product }: { product: Product }) {
  const returnTo = useSearchParams().get("returnTo");
  const images = productImages(product);
  const categories = productCategories(product);
  const optionGroups = productOptionGroups(product);
  const model3D = product3DModel(product);
  const warranty = productWarranty(product);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        backHref={safeReturnTo(returnTo, "/dashboard/products")}
        backLabel="Back to products"
        eyebrow="Product catalog"
        title={product.name}
        description={`${categories.map((category) => category.name).join(", ") || "Uncategorized"}${product.description ? ` · ${product.description}` : ""}`}
        icon={Package}
        recordLabel="Product record"
        recordValue={`${product.is_active ? "Active" : "Inactive"} · ${formatCurrency(product.price_per_unit)} / ${product.unit}`}
        actions={(
          <Button asChild variant="outline" size="sm">
            <Link href={withReturnTo(`/dashboard/products/${product.id}/edit`, safeReturnTo(returnTo, ""))}>
              <Pencil className="size-3.5" />
              Edit product
            </Link>
          </Button>
        )}
      />

      <Tabs.Root defaultValue={images.length ? "images" : model3D ? "model" : "warranty"}>
        <Tabs.List aria-label="Product details" className="flex flex-wrap gap-x-5 border-b">
          {[
            ...(images.length ? [{ value: "images", label: "Images" }] : []),
            ...(model3D ? [{ value: "model", label: "3D Model" }] : []),
            { value: "warranty", label: "Warranty" },
            { value: "options", label: "Option Groups" },
          ].map(({ value, label }) => (
            <Tabs.Trigger
              key={value}
              value={value}
              className="min-h-11 border-b-2 border-transparent px-1 text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-[state=active]:border-primary data-[state=active]:text-primary"
            >
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {images.length > 0 && (
          <Tabs.Content value="images" className="mt-4 outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <CardTitle>Product Images</CardTitle>
                </div>
                <CardDescription>First image is used as the cover.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
                  {images.map((image, index) => (
                    <div key={image.id} className="relative aspect-square overflow-hidden rounded-md border">
                      <img src={imageUrl(image)} alt="" className="h-full w-full object-cover" />
                      {index === 0 && (
                        <span className="absolute inset-x-0 bottom-0 bg-primary py-0.5 text-center text-[9px] font-semibold text-white">
                          COVER
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Tabs.Content>
        )}
        {model3D && (
          <Tabs.Content value="model" className="mt-4 outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Box className="h-4 w-4 text-primary" />
                  <CardTitle>3D Model</CardTitle>
                </div>
                <CardDescription>Product model available for AR preview.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Product3DModelViewer
                  src={model3DUrl(model3D)}
                  title={model3D.original_name ?? "Product 3D model"}
                  description="Admin preview with orbit, zoom, and auto-rotation."
                />
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {model3D.original_name ?? "Product 3D model"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(model3D.file_size) || "GLB / GLTF asset"}
                    </p>
                  </div>
                  {model3DUrl(model3D) && (
                    <Button type="button" variant="outline" size="sm" asChild>
                      <a href={model3DUrl(model3D)} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </Tabs.Content>
        )}
        <Tabs.Content value="warranty" className="mt-4 outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <CardTitle>Warranty Default</CardTitle>
                </div>
                <Badge variant={warranty?.is_active ? "default" : "secondary"}>
                  {warranty?.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardDescription>
                Default warranty terms used when work jobs are completed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!warranty ? (
                <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                  No warranty policy configured.
                </p>
              ) : (
                <>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Duration
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {warranty.duration_months} month
                      {Number(warranty.duration_months) === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Coverage
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                      {warranty.coverage || "No coverage notes added."}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Terms
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                      {warranty.terms || "No terms added."}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </Tabs.Content>
        <Tabs.Content value="options" className="mt-4 outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                <CardTitle>Option Groups</CardTitle>
              </div>
              <CardDescription>
                Product choices available for quotations and custom orders.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {optionGroups.length === 0 ? (
                <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                  No option groups added.
                </p>
              ) : (
                optionGroups.map((group) => {
                  const options = optionGroupOptions(group);
                  return (
                    <div key={group.id} className="rounded-lg border">
                      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
                        <span className="font-semibold">{group.name}</span>
                        <Badge variant={group.is_required ? "default" : "secondary"}>
                          {group.is_required ? "Required" : "Optional"}
                        </Badge>
                        <Badge variant="outline">{options.length} options</Badge>
                      </div>
                      <div className="divide-y">
                        {options.map((option) => (
                          <div key={option.id} className="flex items-center justify-between px-4 py-3 text-sm">
                            <span className="font-medium">{option.name}</span>
                            <span className="text-muted-foreground">
                              {Number(option.price_modifier) === 0
                                ? "No extra charge"
                                : `+ ${formatCurrency(option.price_modifier)}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
