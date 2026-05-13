"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ImageIcon, Package, Ruler, Settings2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Product } from "@/features/products/types";
import {
  calcArea,
  formatCurrency,
  imageUrl,
  optionGroupOptions,
  productCategories,
  productCover,
  productImages,
  productOptionGroups,
  productVariants,
} from "@/features/products/product-utils";

export default function ProductDetails({ product }: { product: Product }) {
  const images = productImages(product);
  const categories = productCategories(product);
  const variants = productVariants(product);
  const optionGroups = productOptionGroups(product);
  const cover = productCover(product);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
            {cover ? (
              <img src={cover} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <Package className="h-7 w-7 text-muted-foreground" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
              <Badge variant={product.is_active ? "default" : "secondary"}>
                {product.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {categories.map((category) => (
                <Badge key={category.id} variant="outline">
                  {category.name}
                </Badge>
              ))}
              <span>
                {formatCurrency(product.price_per_unit)} / {product.unit}
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {product.description}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/products">Back to Products</Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/products/${product.id}/edit`}>Edit Product</Link>
          </Button>
        </div>
      </div>

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
                    <TableCell>{calcArea(variant.width, variant.height)} sqm</TableCell>
                    <TableCell>{formatCurrency(variant.price)}</TableCell>
                    <TableCell>
                      <Badge variant={variant.is_active ? "default" : "secondary"}>
                        {variant.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
