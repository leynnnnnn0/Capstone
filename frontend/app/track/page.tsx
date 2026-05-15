import type { Metadata } from "next";
import { Suspense } from "react";

import TrackPage from "@/components/tracking/TrackPage";

export const metadata: Metadata = {
  title: "Track Request | SOG Glass & Aluminum",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TrackPage />
    </Suspense>
  );
}
