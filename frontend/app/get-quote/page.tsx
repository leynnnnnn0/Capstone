import type { Metadata } from "next";

import GetQuotePage from "@/components/quote/GetQuotePage";

export const metadata: Metadata = {
  title: "Get Quote | SOG Glass & Aluminum",
};

export default function Page() {
  return <GetQuotePage />;
}
