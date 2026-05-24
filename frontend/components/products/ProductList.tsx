"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ImageOff, Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteProduct, fetchProducts } from "@/features/products/product-api";
import type { PaginatedResponse, Product } from "@/features/products/types";
import {
  formatCurrency,
  productCover,
  productVariants,
} from "@/features/products/product-utils";

export default function ProductList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [response, setResponse] = useState<PaginatedResponse<Product> | null>(null);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filters = useMemo(
    () => ({
      search: searchParams.get("search") ?? "",
      is_active: searchParams.get("is_active") ?? "all",
      per_page: searchParams.get("per_page") ?? "15",
    }),
    [searchParams],
  );

  useEffect(() => {
    let mounted = true;

    fetchProducts(filters)
      .then((nextResponse) => {
        if (mounted) setResponse(nextResponse);
      });

    return () => {
      mounted = false;
    };
  }, [filters]);

  const applySearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set("search", search);
    else params.delete("search");
    router.push(`/dashboard/products?${params.toString()}`);
  };

  const removeProduct = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      toast.success("Product deleted successfully.");
      setResponse((current) =>
        current
          ? { ...current, data: current.data.filter((item) => item.id !== deleteTarget.id) }
          : current,
      );
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete product.");
    } finally {
      setDeleting(false);
    }
  };

  const products = response?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            {response?.meta?.total ?? products.length} total products
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/products/create">
            <Plus className="h-3.5 w-3.5" />
            New Product
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applySearch();
                }}
                className="pl-8"
                placeholder="Search products..."
              />
            </div>
            <Button type="button" variant="outline" onClick={applySearch}>
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Variants</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!response ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  Loading products...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  <Package className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const cover = productCover(product);
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border bg-muted">
                        {cover ? (
                          <img src={cover} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <ImageOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{formatCurrency(product.price_per_unit)}</TableCell>
                    <TableCell className="uppercase text-muted-foreground">{product.unit}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{productVariants(product).length}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/products/${product.id}`}>View</Link>
                        </Button>
                        <Button asChild size="icon-sm" variant="ghost">
                          <Link href={`/dashboard/products/${product.id}/edit`} aria-label={`Edit ${product.name}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setDeleteTarget(product)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `"${deleteTarget.name}" will be removed from products and quoting workflows. This action cannot be undone.`
                : "This product will be removed. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive/10 text-destructive hover:bg-destructive/20"
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void removeProduct();
              }}
            >
              {deleting ? "Deleting..." : "Delete Product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
