"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import ProductEditForm from "@/components/products/ProductEditForm";
import { ProductErrorState, ProductLoadingState } from "@/components/products/ProductPageStates";
import { fetchCategories, fetchProduct } from "@/features/products/product-api";
import type { Category, Product } from "@/features/products/types";

export default function ProductEditPage() {
  const params = useParams<{ product: string }>();
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
        <p className="text-sm text-muted-foreground">
          Update the product basics and category assignments.
        </p>
      </div>
      <ProductEditForm product={product} categories={categories} />
    </div>
  );
}
