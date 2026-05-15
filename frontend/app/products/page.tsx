import type { Metadata } from "next";
import { Suspense } from "react";

import PublicProductCatalog from "@/components/public-products/PublicProductCatalog";

export const metadata: Metadata = {
  title: "Products | SOG Glass & Aluminum",
};

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <PublicProductCatalog />
    </Suspense>
  );
}
