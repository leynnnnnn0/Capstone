"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Box, ExternalLink, ImageIcon, Package, Pencil, Ruler, Settings2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { AdminMobileRecord, AdminMobileRecordDetail } from "@/components/ui/admin-mobile-record";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFrame, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Product3DModelViewer from "@/components/products/Product3DModelViewer";
import type { Product } from "@/features/products/types";
import {
  calcArea,
  formatFileSize,
  formatCurrency,
  imageUrl,
  model3DUrl,
  optionGroupOptions,
  product3DModel,
  productCategories,
  productImages,
  productOptionGroups,
  productVariants,
  productWarranty,
} from "@/features/products/product-utils";

export default function ProductDetails({ product }: { product: Product }) {
  const images = productImages(product);
  const categories = productCategories(product);
  const variants = productVariants(product);
  const optionGroups = productOptionGroups(product);
  const model3D = product3DModel(product);
  const warranty = productWarranty(product);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        backHref="/dashboard/products"
        backLabel="Back to products"
        eyebrow="Product catalog"
        title={product.name}
        description={`${categories.map((category) => category.name).join(", ") || "Uncategorized"}${product.description ? ` · ${product.description}` : ""}`}
        icon={Package}
        recordLabel="Product record"
        recordValue={`${product.is_active ? "Active" : "Inactive"} · ${formatCurrency(product.price_per_unit)} / ${product.unit}`}
        actions={(
          <Button asChild variant="outline" size="sm" className="border-white/15 bg-white/[0.06] text-white hover:bg-white/10 hover:text-white">
            <Link href={`/dashboard/products/${product.id}/edit`}>
              <Pencil className="size-3.5" />
              Edit product
            </Link>
          </Button>
        )}
      />

      {images.length > 0 && (
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
      )}

      {model3D && (
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
      )}

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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-primary" />
              <CardTitle>Variants</CardTitle>
            </div>
            <Badge variant="secondary">{variants.length} sizes</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {variants.length === 0 ? (
            <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
              No variants added.
            </p>
          ) : (
            <>
            <div className="space-y-2 md:hidden">
              {variants.map((variant) => (
                <VariantCard key={variant.id} variant={variant} />
              ))}
            </div>
            <TableFrame className="hidden shadow-none md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Size</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Fixed Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.map((variant) => (
                    <TableRow key={variant.id}>
                      <TableCell className="font-medium">
                        {variant.width} x {variant.height} cm
                      </TableCell>
                      <TableCell className="tabular-nums">{calcArea(variant.width, variant.height)} sqm</TableCell>
                      <TableCell className="tabular-nums">{formatCurrency(variant.price)}</TableCell>
                      <TableCell>
                        <Badge variant={variant.is_active ? "default" : "secondary"}>
                          {variant.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableFrame>
            </>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}

function VariantCard({ variant }: { variant: ReturnType<typeof productVariants>[number] }) {
  return (
    <AdminMobileRecord className="text-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{variant.width} x {variant.height} cm</p>
          <p className="text-xs text-muted-foreground">{calcArea(variant.width, variant.height)} sqm</p>
        </div>
        <Badge variant={variant.is_active ? "default" : "secondary"}>
          {variant.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>
      <AdminMobileRecordDetail className="mt-3 text-xs">
        <p className="text-muted-foreground">Fixed Price</p>
        <p className="font-medium">{formatCurrency(variant.price)}</p>
      </AdminMobileRecordDetail>
    </AdminMobileRecord>
  );
}
