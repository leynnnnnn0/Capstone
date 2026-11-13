"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import ProductEditForm from "@/components/products/ProductEditForm";
import { ProductErrorState, ProductLoadingState } from "@/components/products/ProductPageStates";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { fetchCategories, fetchProduct } from "@/features/products/product-api";
import type { Category, Product } from "@/features/products/types";
import { safeReturnTo, withReturnTo } from "@/lib/return-to";

export default function ProductEditPage() {
  const params = useParams<{ product: string }>();
  const returnTo = safeReturnTo(useSearchParams().get("returnTo"), "");
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.product) return;

    Promise.all([fetchProduct(params.product), fetchCategories()])
      .then(([nextProduct, nextCategories]) => {
        setProduct(nextProduct);
        setCategories(nextCategories);
      })
      .catch(() => setError("Unable to load edit form. Please try again."))
      .finally(() => setLoading(false));
  }, [params.product]);

  if (loading) return <ProductLoadingState label="Loading edit form..." />;
  if (error) return <ProductErrorState message={error} />;
  if (!product) return <ProductErrorState message="Product not found." />;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        backHref={withReturnTo(`/dashboard/products/${product.id}`, returnTo)}
        backLabel="Back to product"
        title="Edit product"
        description="Update the product basics, category assignments, media, and options."
      />
      <ProductEditForm product={product} categories={categories} returnTo={returnTo} />
    </div>
  );
}
