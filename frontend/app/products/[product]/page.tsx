import type { Metadata } from "next";

import PublicProductShow from "@/components/public-products/PublicProductShow";

export const metadata: Metadata = {
  title: "Product | SOG Glass & Aluminum",
};

export default function ProductPage() {
  return <PublicProductShow />;
}
