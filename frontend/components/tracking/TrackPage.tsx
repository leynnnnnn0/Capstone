"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";
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
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <header className="relative overflow-hidden bg-primary px-5 pb-28 pt-14 sm:px-10 sm:pb-32 sm:pt-16 lg:px-16">
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
              Order Tracking
            </span>
          </div>
          <h1 className="mb-4 text-[30px] font-extrabold leading-tight text-white sm:text-[42px]">
            Track Your Request
          </h1>
          <p className="mx-auto max-w-md text-[14px] leading-relaxed text-white/65 sm:text-[16px]">
            Enter your appointment or work job number to check status and quotation details.
          </p>
        </div>
      </header>

      <main className="relative z-10 -mt-14 pb-16 sm:-mt-16">
        <div className="mx-auto mb-8 max-w-xl px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-primary/10">
            <div className="px-6 py-6 sm:px-8 sm:py-7">
              <label htmlFor="reference" className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Appointment or Work Job Number
              </label>
              <div className="flex gap-2">
                <input
                  id="reference"
                  type="text"
                  value={reference}
                  onChange={(event) => setReference(event.target.value.toUpperCase())}
                  placeholder="APT-000001-20260513"
                  className={`min-w-0 flex-1 rounded-xl bg-slate-50 px-4 py-3 text-[13px] font-semibold text-slate-900 outline-none transition-all ${
                    error ? "border border-red-400" : "border border-slate-200"
                  }`}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="submit"
                  disabled={loading || !reference.trim()}
                  className="rounded-xl bg-primary px-5 py-3 text-[13px] font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "..." : "Track"}
                </button>
              </div>
              {error && (
                <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-[12px] leading-relaxed text-red-700">
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
            <div className="mx-auto mb-16 max-w-xl px-4 sm:px-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
                <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Where to find your reference number
                </p>
                <div className="space-y-3">
                  {[
                    ["Confirmation email", "Check the email we sent after you submitted your quote request."],
                    ["Printed confirmation", "Your reference number appears after submitting your request."],
                    ["Need help?", "Call or message us and we will help locate your appointment."],
                  ].map(([title, body]) => (
                    <div key={title}>
                      <p className="text-[13px] font-bold text-slate-800">{title}</p>
                      <p className="text-[12px] leading-relaxed text-slate-500">{body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        )}

        <div className="mx-auto mt-10 max-w-3xl px-4 sm:px-6">
          <div className="flex flex-col items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="flex-1">
              <p className="mb-1 text-[13px] font-bold text-slate-900">Need help?</p>
              <p className="text-[12px] leading-relaxed text-slate-500">
                Can&apos;t find your reference number or have questions about your request?
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="tel:+639000000000" className="rounded-xl bg-blue-50 px-4 py-2.5 text-[12px] font-bold text-primary">
                Call Us
              </a>
              <Link href="/get-quote" className="rounded-xl bg-blue-50 px-4 py-2.5 text-[12px] font-bold text-primary">
                New Quote
              </Link>
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
