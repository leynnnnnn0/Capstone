"use client";

import { useEffect, useState } from "react";

import ProductCreateForm from "@/components/products/ProductCreateForm";
import { ProductErrorState, ProductLoadingState } from "@/components/products/ProductPageStates";
import { fetchCategories } from "@/features/products/product-api";
import type { Category } from "@/features/products/types";

export default function CreateProductPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setError("Unable to load categories. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ProductLoadingState label="Loading create form..." />;
  if (error) return <ProductErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Product</h1>
        <p className="text-sm text-muted-foreground">
          Add catalog details, variants, images, and option groups in one place.
        </p>
      </div>
      <ProductCreateForm categories={categories} />
    </div>
  );
}
