"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";
import PublicPageHero from "@/components/landing/PublicPageHero";
import TrackingResultCard from "@/components/tracking/TrackingResultCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { trackReference } from "@/features/tracking/tracking-api";
import type { TrackingResult } from "@/features/tracking/types";

export default function TrackPage() {
  const searchParams = useSearchParams();
  const initialReference = searchParams.get("ref") ?? "";
  const [reference, setReference] = useState(initialReference.toUpperCase());
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initialReference) return;
    void submitReference(initialReference);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialReference]);

  async function submitReference(nextReference = reference) {
    const cleanReference = nextReference.trim().toUpperCase();
    if (!cleanReference) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const trackingResult = await trackReference(cleanReference);
      setResult(trackingResult);
      setReference(cleanReference);
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError("Unable to track this request. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitReference();
  }

  return (
    <div className="min-h-screen bg-white text-[#101820]">
      <Navbar />

      <PublicPageHero
        eyebrow="Request tracking"
        title={<>Follow every<br />project update.</>}
        description="Enter your appointment or work job number to check its current status, schedule, and quotation details."
      />

      <main className="px-2 py-3 sm:px-3">
        <div className="min-h-[34rem] rounded-[2rem] bg-[#f3f6f8] px-5 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
        <div className="mx-auto mb-10 max-w-2xl">
          <form onSubmit={handleSubmit} className="overflow-hidden rounded-[1.5rem] border border-[#dce4ea] bg-white shadow-[0_24px_80px_rgba(22,45,74,0.09)]">
            <div className="px-5 py-6 sm:px-8 sm:py-8">
              <label htmlFor="reference" className="mb-3 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#667584]">
                Appointment or Work Job Number
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="reference"
                  type="text"
                  value={reference}
                  onChange={(event) => setReference(event.target.value.toUpperCase())}
                  placeholder="APT-000001-20260513"
                  className={`min-w-0 flex-1 rounded-full bg-[#f3f6f8] px-5 py-3.5 text-sm font-semibold tracking-wide text-[#101820] outline-none transition-all focus:ring-2 focus:ring-[#608db9]/25 ${
                    error ? "border border-red-400" : "border border-[#dce4ea] focus:border-[#608db9]"
                  }`}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="submit"
                  disabled={loading || !reference.trim()}
                  className="rounded-full bg-[#162d4a] px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#2c5282] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "..." : "Track"}
                </button>
              </div>
              {error && (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-relaxed text-red-700">
                  {error}
                </p>
              )}
            </div>
          </form>
        </div>

        {loading ? (
          <TrackingResultSkeleton />
        ) : result ? (
          <TrackingResultCard result={result} />
        ) : (
          !error && (
            <div className="mx-auto mb-16 max-w-2xl">
              <div className="rounded-[1.5rem] border border-[#dce4ea] bg-white p-6 sm:p-8">
                <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[#667584]">
                  Where to find your reference number
                </p>
                <div className="grid gap-5 sm:grid-cols-3">
                  {[
                    ["Confirmation email", "Check the email we sent after you submitted your quote request."],
                    ["Printed confirmation", "Your reference number appears after submitting your request."],
                    ["Need help?", "Call or message us and we will help locate your appointment."],
                  ].map(([title, body]) => (
                    <div key={title} className="border-t border-[#dce4ea] pt-4">
                      <p className="text-sm font-semibold text-[#101820]">{title}</p>
                      <p className="mt-2 text-xs leading-5 text-[#667584]">{body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        )}

        <div className="mx-auto mt-10 max-w-3xl">
          <div className="flex flex-col items-start gap-4 rounded-[1.5rem] border border-[#dce4ea] bg-[#eaf2f8] p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="flex-1">
              <p className="mb-1 text-sm font-semibold text-[#101820]">Need help?</p>
              <p className="text-xs leading-relaxed text-[#667584]">
                Can&apos;t find your reference number or have questions about your request?
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/login" className="rounded-full border border-[#b9cbd9] bg-white px-4 py-2.5 text-xs font-semibold text-[#2c5282]">
                Customer account
              </Link>
              <Link href="/get-quote" className="rounded-full bg-[#162d4a] px-4 py-2.5 text-xs font-semibold text-white">
                New Quote
              </Link>
            </div>
          </div>
        </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function TrackingResultSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-primary/10">
        <div className="space-y-3 bg-primary px-6 py-5">
          <Skeleton className="h-3 w-20 bg-white/20" />
          <Skeleton className="h-7 w-56 bg-white/20" />
          <Skeleton className="h-4 w-32 bg-white/20" />
        </div>
        <div className="grid grid-cols-1 gap-5 px-6 py-5 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
