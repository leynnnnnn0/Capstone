import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { PublicQuoteCartProvider } from "@/features/quotes/public-quote-cart";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SOG Glass & Aluminum Services",
  description:
    "Custom glass and aluminum systems, precise on-site measurement, fabrication, installation, and clear quotations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${instrumentSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <PublicQuoteCartProvider>
          {children}
          <Toaster />
        </PublicQuoteCartProvider>
      </body>
    </html>
  );
}
