"use client";

import { useEffect, useState } from "react";

import type { Product } from "@/features/products/types";
import { api } from "@/lib/api";
import Booking from "./Booking";
import EditorialProductShowcase from "./EditorialProductShowcase";
import {
  FaqSection,
  ProcessAndStatsSection,
  ProductGridSection,
  ProjectShowcase,
  ValueSection,
} from "./EditorialWelcomeSections";
import Footer from "./Footer";
import SogSiteHeader from "./SogSiteHeader";

type ProductsResponse =
  | Product[]
  | { data?: Product[] }
  | { data?: { data?: Product[] } };

function extractProducts(response: ProductsResponse): Product[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data?.data)) return response.data.data;
  return [];
}

export default function Welcome() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsError, setProductsError] = useState("");
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    api<ProductsResponse>("/api/v1/products?is_active=1&per_page=7", {
      skipAuth: true,
    })
      .then((response) => {
        if (mounted) setProducts(extractProducts(response));
      })
      .catch(() => {
        if (mounted) setProductsError("Products are unavailable right now.");
      })
      .finally(() => {
        if (mounted) setProductsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="overflow-x-clip bg-white text-[#101820]">
      <SogSiteHeader sticky quoteHref="#booking" />
      <main id="home">
        <EditorialProductShowcase products={products} loading={productsLoading} />
        <ValueSection />

        <ProjectShowcase />
        <ProcessAndStatsSection />
        <ProductGridSection
          products={products}
          loading={productsLoading}
          error={productsError}
        />
        <FaqSection />
        <Booking />
      </main>
      <Footer />
    </div>
  );
}
