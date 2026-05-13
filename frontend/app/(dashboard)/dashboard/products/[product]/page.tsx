"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import ProductDetails from "@/components/products/ProductDetails";
import { ProductErrorState, ProductLoadingState } from "@/components/products/ProductPageStates";
import { fetchProduct } from "@/features/products/product-api";
import type { Product } from "@/features/products/types";

export default function ProductShowPage() {
  const params = useParams<{ product: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.product) return;

    fetchProduct(params.product)
      .then(setProduct)
      .catch(() => setError("Unable to load product. Please try again."))
      .finally(() => setLoading(false));
  }, [params.product]);

  if (loading) return <ProductLoadingState label="Loading product..." />;
  if (error) return <ProductErrorState message={error} />;
  if (!product) return <ProductErrorState message="Product not found." />;

  return <ProductDetails product={product} />;
}
