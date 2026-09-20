import type { Metadata } from "next";

import Welcome from "@/components/landing/Welcome";

const title = "Glass & Aluminum Services in General Trias, Cavite | SOG";
const description =
  "Custom glass and aluminum services in General Trias, Cavite. We measure and install sliding doors, windows, shower enclosures, gates, railings, and cabinets.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "SOG Glass & Aluminum Services",
    locale: "en_PH",
    type: "website",
    images: [
      {
        url: "/images/landing/process-installation.png",
        width: 1536,
        height: 1024,
        alt: "SOG team installing custom glass and aluminum cabinets",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/images/landing/process-installation.png"],
  },
};

export default function Home()
{
  return <Welcome />;
}
