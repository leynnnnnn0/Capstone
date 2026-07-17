"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, ImageOff, Package, Pencil, Plus, RotateCcw, SlidersHorizontal, Trash2 } from "lucide-react";
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
import { AdminTableSearch } from "@/components/ui/admin-table-search";
import { AdminMobileRecord } from "@/components/ui/admin-mobile-record";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TableSkeletonRows } from "@/components/ui/page-skeletons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteProduct, fetchCategories, fetchProducts } from "@/features/products/product-api";
import type { Category, PaginatedResponse, Product } from "@/features/products/types";
import {
  formatCurrency,
  productCover,
  productVariants,
} from "@/features/products/product-utils";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export default function ProductList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [response, setResponse] = useState<PaginatedResponse<Product> | null>(null);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const filters = useMemo(
    () => ({
      search: searchParams.get("search") ?? "",
      is_active: searchParams.get("is_active") ?? "all",
      category_id: searchParams.get("category_id") ?? "all",
      unit: searchParams.get("unit") ?? "all",
      has_3d_model: searchParams.get("has_3d_model") ?? "all",
      has_warranty: searchParams.get("has_warranty") ?? "all",
      has_variants: searchParams.get("has_variants") ?? "all",
      sort: searchParams.get("sort") ?? "newest",
      per_page: searchParams.get("per_page") ?? "15",
    }),
    [searchParams],
  );
  const debouncedSearch = useDebouncedValue(search.trim());
  const hasFilters = Boolean(
    search ||
    filters.is_active !== "all" ||
    filters.category_id !== "all" ||
    filters.unit !== "all" ||
    filters.has_3d_model !== "all" ||
    filters.has_warranty !== "all" ||
    filters.has_variants !== "all" ||
    filters.sort !== "newest",
  );

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

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

  useEffect(() => {
    if (search.trim() !== debouncedSearch) return;
    if (debouncedSearch === filters.search) return;
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) params.set("search", debouncedSearch);
    else params.delete("search");
    params.delete("page");
    router.replace(`/dashboard/products${params.toString() ? `?${params.toString()}` : ""}`);
  }, [debouncedSearch, filters.search, router, search, searchParams]);

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

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || (key === "sort" && value === "newest")) params.delete(key);
    else params.set(key, value);
    params.delete("page");
    router.replace(`/dashboard/products${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function resetFilters() {
    setSearch("");
    router.replace("/dashboard/products");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-[#162d4a] p-5 text-white shadow-[0_18px_55px_rgba(22,45,74,0.12)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b9cfe0]">Product catalog</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">Products</h1>
          <p className="mt-1 text-sm text-white/55">
            {response?.meta?.total ?? products.length} total products
          </p>
        </div>
        <Button asChild size="sm" className="bg-white text-[#162d4a] hover:bg-[#edf3f7]">
          <Link href="/dashboard/products/create">
            <Plus className="h-3.5 w-3.5" />
            New Product
          </Link>
        </Button>
      </div>

      <Card className="border-transparent bg-white">
        <div className="p-3">
          <div className="flex min-w-0 items-center gap-2">
            <AdminTableSearch value={search} onChange={setSearch} placeholder="Search products..." />
            <div className="flex shrink-0 gap-2">
              <Button type="button" variant={filtersOpen ? "secondary" : "outline"} size="sm" onClick={() => setFiltersOpen((value) => !value)} className="size-11 shrink-0 gap-1.5 rounded-xl p-0 sm:h-11 sm:w-auto sm:px-4" aria-label="Toggle filters">
                <SlidersHorizontal className="size-3.5" />
                <span className="hidden sm:inline">Filters</span>
              </Button>
              {hasFilters && (
                <Button type="button" variant="ghost" size="sm" onClick={resetFilters} className="size-11 shrink-0 gap-1.5 rounded-xl p-0 sm:h-11 sm:w-auto sm:px-4" aria-label="Reset filters">
                  <RotateCcw className="size-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </Button>
              )}
            </div>
          </div>
          {filtersOpen && (
            <div className="mt-3 grid gap-3 border-t border-[#e4ebf0] pt-3 sm:grid-cols-2 lg:grid-cols-4">
              <ProductFilter label="Status" value={filters.is_active} onChange={(value) => setFilter("is_active", value)} options={[["all", "All products"], ["true", "Active"], ["false", "Inactive"]]} />
              <ProductFilter label="Category" value={filters.category_id} onChange={(value) => setFilter("category_id", value)} options={[["all", "All categories"], ...categories.map((category) => [String(category.id), category.name] as [string, string])]} />
              <ProductFilter label="Unit" value={filters.unit} onChange={(value) => setFilter("unit", value)} options={[["all", "All units"], ["sqm", "Square meter"], ["sqft", "Square foot"], ["meter", "Meter"], ["piece", "Piece"], ["set", "Set"]]} />
              <ProductFilter label="3D model" value={filters.has_3d_model} onChange={(value) => setFilter("has_3d_model", value)} options={[["all", "Any"], ["true", "With 3D model"], ["false", "Without 3D model"]]} />
              <ProductFilter label="Warranty" value={filters.has_warranty} onChange={(value) => setFilter("has_warranty", value)} options={[["all", "Any"], ["true", "With warranty"], ["false", "Without warranty"]]} />
              <ProductFilter label="Variants" value={filters.has_variants} onChange={(value) => setFilter("has_variants", value)} options={[["all", "Any"], ["true", "With variants"], ["false", "Without variants"]]} />
              <ProductFilter label="Sort by" value={filters.sort} onChange={(value) => setFilter("sort", value)} options={[["newest", "Newest first"], ["oldest", "Oldest first"], ["name_asc", "Name A–Z"], ["price_asc", "Price: low to high"], ["price_desc", "Price: high to low"]]} />
            </div>
          )}
        </div>
      </Card>

      <div className="space-y-2 md:hidden">
        {!response ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-lg border bg-muted/30" />
          ))
        ) : products.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
            <Package className="mx-auto mb-2 h-8 w-8 opacity-40" />
            No products found.
          </div>
        ) : (
          products.map((product) => (
            <ProductCard key={product.id} product={product} onDelete={() => setDeleteTarget(product)} />
          ))
        )}
      </div>

      <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
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
              <TableSkeletonRows columns={7} />
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
                       <Button asChild size="icon-sm" variant="ghost">
          <Link href={`/dashboard/products/${product.id}`}>
            <Eye className="h-3.5 w-3.5" />
          </Link>
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

function ProductFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 w-full rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>{optionLabel}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ProductCard({ product, onDelete }: { product: Product; onDelete: () => void }) {
  const cover = productCover(product);

  return (
    <AdminMobileRecord>
      <div className="flex items-start gap-3">
        <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#dce4ea] bg-[#f4f7f9]">
          {cover ? (
            <img
              src={cover}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageOff className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{product.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatCurrency(product.price_per_unit)} / {product.unit}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="secondary">
              {productVariants(product).length} variant
              {productVariants(product).length === 1 ? "" : "s"}
            </Badge>
            <Badge variant={product.is_active ? "default" : "secondary"}>
              {product.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-1 border-t border-[#e8edf1] pt-3">
        <Button asChild size="icon-sm" variant="ghost">
          <Link href={`/dashboard/products/${product.id}`}>
            <Eye className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <Button asChild size="icon-sm" variant="ghost">
          <Link
            href={`/dashboard/products/${product.id}/edit`}
            aria-label={`Edit ${product.name}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <Button type="button" size="icon-sm" variant="ghost" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </AdminMobileRecord>
  );
}
