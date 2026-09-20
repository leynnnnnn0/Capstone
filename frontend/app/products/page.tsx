import type { Metadata } from "next";
import { Suspense } from "react";

import PublicProductCatalog from "@/components/public-products/PublicProductCatalog";

export const metadata: Metadata = {
  title: "Glass & Aluminum Products in General Trias, Cavite | SOG",
  description:
    "Browse high-quality sliding glass doors and windows, aluminum cabinets, shower enclosures, gates, and railings made for homes and businesses in Cavite.",
};

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <PublicProductCatalog />
    </Suspense>
  );
}
