import type { Metadata } from "next";

import ProductList from "@/components/products/ProductList";

export const metadata: Metadata = {
  title: "Products",
};

export default function ProductsPage() {
  return <ProductList />;
}
