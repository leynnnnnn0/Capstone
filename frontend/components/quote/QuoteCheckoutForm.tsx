"use client";

import { useState } from "react";
import type React from "react";

import BookingScheduleFields from "@/components/booking/BookingScheduleFields";
import LocationPicker from "@/components/landing/LocationPicker";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import { minimumBookingDate } from "@/features/booking/booking-utils";
import { submitQuoteRequest } from "@/features/quotes/quote-api";
import { validateQuoteCheckout } from "@/features/quotes/quote-schema";
import type {
  AppointmentQuoteResponse,
  QuoteCartItem,
  QuoteCheckoutForm as QuoteCheckoutFields,
  QuoteFormErrors,
} from "@/features/quotes/types";
import {
  cartItemToPayload,
  computeItemTotal,
  formatCurrency,
  measurementWidth,
  quoteTotal,
  variantLabel,
} from "@/features/quotes/quote-utils";

function createDefaultForm(): QuoteCheckoutFields {
  return {
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    address: "",
    address_pinned: "",
    address_lat: "",
    address_lng: "",
    preferred_date: minimumBookingDate(),
    preferred_time: "afternoon",
    additional_notes: "",
    consent: false,
  };
}

export default function QuoteCheckoutForm({
  cart,
  onBack,
  onSuccess,
}: {
  cart: QuoteCartItem[];
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [data, setData] = useState<QuoteCheckoutFields>(() => createDefaultForm());
  const [errors, setErrors] = useState<QuoteFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<AppointmentQuoteResponse | null>(null);
  const total = quoteTotal(cart);

  const setField = <K extends keyof QuoteCheckoutFields>(
    field: K,
    value: QuoteCheckoutFields[K],
  ) => {
    setData((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      delete next.form;
      return next;
    });
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateQuoteCheckout(data);
    if (cart.length === 0) nextErrors.items = "Add at least one product.";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const response = await submitQuoteRequest({
        ...data,
        service_type: "quotation",
        items: cart.map(cartItemToPayload),
      });
      setSubmitted(response);
      onSuccess();
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        setErrors(
          Object.entries(error.errors).reduce<QuoteFormErrors>((acc, [field, value]) => {
            acc[field as keyof QuoteFormErrors] = Array.isArray(value) ? value[0] : value;
            return acc;
          }, {}),
        );
      } else {
        setErrors({ form: "Unable to submit your quote request. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center sm:py-16">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-[32px] text-primary">
          ✓
        </div>
        <h2 className="mb-3 text-[26px] font-bold text-slate-900 sm:text-[30px]">
          Quote Submitted
        </h2>
        <p className="mb-4 text-[14px] leading-relaxed text-slate-500 sm:text-[15px]">
          We received your request. Our team will reach out within 24 hours to confirm your
          free on-site inspection.
        </p>
        <div className="mb-8 inline-block rounded-2xl bg-slate-50 px-8 py-4">
          <p className="mb-1 text-[11px] text-slate-400">Reference Number</p>
          <p className="text-[22px] font-extrabold text-primary">
            {submitted.appointment_number}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 rounded-lg bg-slate-100 px-3 py-1.5 text-[12px] font-bold text-slate-500 hover:bg-slate-200"
        >
          ← Back to Quote
        </button>
        <h2 className="mb-1.5 text-[24px] font-bold text-slate-900 sm:text-[28px]">
          Almost there
        </h2>
        <p className="text-[13px] text-slate-500 sm:text-[14px]">
          Fill in your details so we can schedule your free inspection.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <p className="mb-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Your Contact Info
            </p>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <FormField label="First Name" error={errors.first_name}>
                <Input value={data.first_name} onChange={(event) => setField("first_name", event.target.value)} placeholder="Juan" />
              </FormField>
              <FormField label="Last Name" error={errors.last_name}>
                <Input value={data.last_name} onChange={(event) => setField("last_name", event.target.value)} placeholder="Dela Cruz" />
              </FormField>
            </div>

            <FormField label="Phone / Viber" error={errors.phone_number}>
              <Input type="tel" value={data.phone_number} onChange={(event) => setField("phone_number", event.target.value)} placeholder="+63 9XX XXX XXXX" />
            </FormField>

            <FormField label="Email" error={errors.email}>
              <Input type="email" value={data.email} onChange={(event) => setField("email", event.target.value)} placeholder="juan@example.com" />
            </FormField>

            <BookingScheduleFields
              className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
              preferredDate={data.preferred_date}
              preferredTime={data.preferred_time}
              dateError={errors.preferred_date}
              timeError={errors.preferred_time}
              onPreferredDateChange={(preferredDate, preferredTime) => {
                setData((current) => ({
                  ...current,
                  preferred_date: preferredDate,
                  preferred_time: preferredTime,
                }));
                setErrors((current) => {
                  const next = { ...current };
                  delete next.preferred_date;
                  delete next.preferred_time;
                  delete next.form;
                  return next;
                });
              }}
              onPreferredTimeChange={(value) => setField("preferred_time", value)}
            />

            <div className="mb-4">
              <Label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Address
              </Label>
              <LocationPicker
                error={errors.address}
                onLocationChange={({ address, pinned, lat, lng }) => {
                  setData((current) => ({
                    ...current,
                    address,
                    address_pinned: pinned,
                    address_lat: lat ? lat.toFixed(6) : "",
                    address_lng: lng ? lng.toFixed(6) : "",
                  }));
                  setErrors((current) => ({ ...current, address: undefined }));
                }}
              />
              {errors.address && <FieldError message={errors.address} />}
            </div>

            <FormField label="Additional Notes">
              <Textarea
                rows={3}
                value={data.additional_notes}
                onChange={(event) => setField("additional_notes", event.target.value)}
                placeholder="Access instructions, special requests..."
                className="resize-none"
              />
            </FormField>

            <div className="mb-2 flex items-start gap-3">
              <Checkbox
                id="consent"
                checked={data.consent}
                onCheckedChange={(checked) => setField("consent", checked === true)}
              />
              <label htmlFor="consent" className="cursor-pointer text-[12px] leading-relaxed text-slate-500">
                I agree to be contacted via call, SMS, or email by SOG Glass & Aluminum
                regarding my appointment request and related services.
              </label>
            </div>
            {errors.consent && <FieldError message={errors.consent} />}
          </div>

          <div className="flex flex-col gap-4">
            <QuoteSummary cart={cart} total={total} />

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                What happens next
              </p>
              {["We call you within 24 hours", "Free on-site inspection", "Final itemized quote", "Fabrication after approval"].map((item) => (
                <p key={item} className="mb-2 text-[12px] font-medium text-slate-600 last:mb-0">
                  {item}
                </p>
              ))}
            </div>

            {errors.items && <FieldError message={errors.items} />}
            {errors.form && <FieldError message={errors.form} />}

            <button
              type="submit"
              disabled={submitting || !data.consent}
              className="w-full rounded-xl bg-primary py-4 text-[14px] font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Quote Request"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function QuoteSummary({ cart, total }: { cart: QuoteCartItem[]; total: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Order Summary
      </p>
      {cart.map((item) => (
        <div key={item.id} className="flex items-start justify-between border-b border-slate-50 py-3 last:border-0">
          <div className="min-w-0 flex-1 pr-3">
            <p className="text-[13px] font-bold text-slate-900">{item.product.name}</p>
            {item.size_mode === "standard" && item.variant ? (
              <p className="text-[11px] font-semibold text-primary">{variantLabel(item.variant)}</p>
            ) : item.source === "ar" ? (
              <div className="space-y-0.5">
                <p className="text-[11px] font-semibold text-primary">AR measured item</p>
                <p className="text-[11px] text-slate-400">
                  {formatMeasurementSummary(item)}
                </p>
              </div>
            ) : item.width ? (
              <p className="text-[11px] text-slate-400">
                {item.product.unit === "sqm" ? `${item.width}m x ${item.height}m` : `${item.width}m`}
              </p>
            ) : null}
            <p className="text-[10px] text-slate-400">
              {item.pieces} pc{item.pieces === 1 ? "" : "s"}
            </p>
          </div>
          <p className="text-[13px] font-extrabold text-primary">
            {formatCurrency(Math.round(computeItemTotal(item)))}
          </p>
        </div>
      ))}
      <div className="mt-2 flex items-baseline justify-between border-t-2 border-slate-100 pt-4">
        <span className="text-[14px] font-bold text-slate-900">Estimated Total</span>
        <span className="text-[22px] font-extrabold text-primary">
          {formatCurrency(Math.round(total))}
        </span>
      </div>
    </div>
  );
}

function formatMeasurementSummary(item: QuoteCartItem) {
  const segments = item.measurement_segments?.filter((segment) => segment > 0) ?? [];
  const width = measurementWidth(item);
  const height = Number(item.height || item.measurement_height || 0);

  if (segments.length > 1) {
    return `${segments.map((segment) => `${segment}m`).join(" + ")} x ${height}m`;
  }

  if (item.product.unit === "sqm") return `${width}m x ${height}m`;
  if (item.product.unit === "meter") return `${width}m`;
  return height > 0 ? `${width}m x ${height}m` : `${width}m`;
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <Label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </Label>
      {children}
      {error && <FieldError message={error} />}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-[11px] text-red-500">{message}</p>;
}
