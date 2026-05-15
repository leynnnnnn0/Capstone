import type { Metadata } from "next";
import { Suspense } from "react";

import GetQuotePage from "@/components/quote/GetQuotePage";

export const metadata: Metadata = {
  title: "Get Quote | SOG Glass & Aluminum",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <GetQuotePage />
    </Suspense>
  );
}
