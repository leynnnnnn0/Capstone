"use client";

import { useEffect, useState } from "react";
import { PackagePlus } from "lucide-react";

import ProductCreateForm from "@/components/products/ProductCreateForm";
import { ProductErrorState, ProductLoadingState } from "@/components/products/ProductPageStates";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
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
      <AdminPageHeader
        backHref="/dashboard/products"
        backLabel="Back to products"
        eyebrow="Product catalog"
        title="Create product"
        description="Add catalog details, variants, images, and option groups in one place."
        icon={PackagePlus}
        recordLabel="Product record"
        recordValue="New catalog item"
      />
      <ProductCreateForm categories={categories} />
    </div>
  );
}
