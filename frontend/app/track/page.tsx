import type { Metadata } from "next";

import TrackPage from "@/components/tracking/TrackPage";

export const metadata: Metadata = {
  title: "Track Request | SOG Glass & Aluminum",
};

export default function Page() {
  return <TrackPage />;
}
