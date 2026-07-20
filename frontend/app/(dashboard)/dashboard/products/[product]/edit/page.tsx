"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Package } from "lucide-react";

import ProductEditForm from "@/components/products/ProductEditForm";
import { ProductErrorState, ProductLoadingState } from "@/components/products/ProductPageStates";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
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
      <AdminPageHeader
        backHref={`/dashboard/products/${product.id}`}
        backLabel="Back to product"
        eyebrow="Product catalog"
        title="Edit product"
        description="Update the product basics, category assignments, media, variants, and options."
        icon={Package}
        recordLabel="Product record"
        recordValue={product.name}
      />
      <ProductEditForm product={product} categories={categories} />
    </div>
  );
}
