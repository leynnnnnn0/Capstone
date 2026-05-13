"use client";

import Link from "next/link";
import { FormEvent, useCallback, useMemo, useState } from "react";

import { ApiError, api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import FormSelect from "@/components/form/FormSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  validateBookingForm,
  zodIssuesToBookingErrors,
} from "@/features/booking/booking-schema";
import {
  createInitialBookingForm,
  flattenServerErrors,
  getAvailableTimeOptions,
  minimumBookingDate,
  resolvePreferredTimeForDate,
} from "@/features/booking/booking-utils";
import type {
  BookingForm,
  BookingFormErrors,
  LocationValue,
} from "@/features/booking/types";
import LocationPicker from "./LocationPicker";

export default function Booking() {
  const [data, setData] = useState<BookingForm>(() => createInitialBookingForm());
  const [errors, setErrors] = useState<BookingFormErrors>({});
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState("");

  const availableTimeOptions = useMemo(() => {
    return getAvailableTimeOptions(data.preferred_date);
  }, [data.preferred_date]);

  const setField = <K extends keyof BookingForm>(
    field: K,
    value: BookingForm[K],
  ) => {
    setData((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      delete next.form;
      return next;
    });
  };

  const fieldError = (field: keyof BookingForm) => errors[field];

  const handleLocationChange = useCallback(
    ({ address, pinned, lat, lng }: LocationValue) => {
      setData((current) => ({
        ...current,
        address,
        address_pinned: pinned,
        address_lat: lat ? lat.toFixed(6) : "",
        address_lng: lng ? lng.toFixed(6) : "",
      }));
      setErrors((current) => {
        const next = { ...current };
        delete next.address;
        return next;
      });
    },
    [],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess("");

    const parsed = validateBookingForm(data);
    if (!parsed.success) {
      setErrors(zodIssuesToBookingErrors(parsed.error.issues));
      return;
    }

    setProcessing(true);
    setErrors({});

    try {
      await api("/api/v1/appointments", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify(parsed.data),
      });
      setSuccess("Appointment booked successfully. We will contact you soon.");
      setData(createInitialBookingForm());
    } catch (error) {
      console.log(error)
      if (error instanceof ApiError) {
        setErrors(flattenServerErrors(error));
      } else {
        setErrors({ form: "Failed to book appointment. Please try again." });
      }
    } finally {
      setProcessing(false);
    }
  }

  return (
    <section
      id="booking"
      className="mx-auto max-w-7xl px-4 py-4 sm:px-8 md:px-12 md:py-8 lg:px-20 lg:py-12"
    >
      <div className="grid items-start gap-10 md:grid-cols-2 md:gap-20">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#2c5282]">
            Book a Home Visit
          </span>
          <h2 className="mb-5 mt-3 text-5xl font-bold leading-[1.05] tracking-tight text-secondary">
            Free Ocular
            <br />
            Visit.
          </h2>
          <p className="mb-8 max-w-sm text-base leading-relaxed text-slate-500">
            Our certified technicians visit your home, measure precisely, and
            provide a detailed no-obligation quotation completely free of
            charge.
          </p>
          <ul className="mb-10 space-y-3 text-sm text-slate-600">
            {[
              "Precise on-site measurement of all openings",
              "Product recommendation tailored to your space",
              "Material samples to see and feel in person",
              "Transparent itemized quote on the spot",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="font-black text-[#2c5282]">+</span>
                {item}
              </li>
            ))}
          </ul>
          <div className="flex items-start gap-4 rounded-2xl bg-secondary p-5 text-white">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 text-sm font-black">
              PHP
            </div>
            <div>
              <h4 className="mb-1 text-lg font-bold">
                Get an instant Quote first
              </h4>
              <p className="mb-2 text-sm leading-relaxed">
                Input the height and width of the product that you want and get
                a quote instantly.
              </p>
              <Link
                href="/get-quote"
                className="cursor-pointer text-xs font-black underline"
              >
                Get Started →
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-10">
          <h3 className="mb-7 text-lg font-bold text-slate-900">
            Schedule a Visit
          </h3>

          {(errors.rate_limit || errors.form) && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
              {errors.rate_limit || errors.form}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-medium text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={data.first_name}
                  onChange={(event) => setField("first_name", event.target.value)}
                  placeholder="Juan"
                />
                {fieldError("first_name") && (
                  <span className="text-xs text-red-500">
                    {fieldError("first_name")}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={data.last_name}
                  onChange={(event) => setField("last_name", event.target.value)}
                  placeholder="dela Cruz"
                />
                {fieldError("last_name") && (
                  <span className="text-xs text-red-500">
                    {fieldError("last_name")}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={data.phone_number}
                onChange={(event) => setField("phone_number", event.target.value)}
                type="tel"
                placeholder="+63 9XX XXX XXXX"
              />
              {fieldError("phone_number") && (
                <span className="text-xs text-red-500">
                  {fieldError("phone_number")}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={data.email}
                onChange={(event) => setField("email", event.target.value)}
                type="email"
                placeholder="juan@example.com"
              />
              {fieldError("email") && (
                <span className="text-xs text-red-500">{fieldError("email")}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Home Address</Label>
              <LocationPicker
                onLocationChange={handleLocationChange}
                error={fieldError("address")}
              />
              {fieldError("address") && (
                <span className="text-xs text-red-500">
                  {fieldError("address")}
                </span>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="preferred_date">Preferred Date</Label>
                <Input
                  id="preferred_date"
                  type="date"
                  min={minimumBookingDate()}
                  value={data.preferred_date}
                  onChange={(event) => {
                    const nextDate = event.target.value;
                    setData((current) => ({
                      ...current,
                      preferred_date: nextDate,
                      preferred_time: resolvePreferredTimeForDate(
                        nextDate,
                        current.preferred_time,
                      ),
                    }));
                    setErrors((current) => {
                      const next = { ...current };
                      delete next.preferred_date;
                      delete next.preferred_time;
                      delete next.form;
                      return next;
                    });
                  }}
                />
                {fieldError("preferred_date") && (
                  <span className="text-xs text-red-500">
                    {fieldError("preferred_date")}
                  </span>
                )}
              </div>
              <FormSelect
                id="preferred_time"
                label="Preferred Time"
                value={data.preferred_time}
                options={availableTimeOptions}
                placeholder="Select time"
                error={fieldError("preferred_time")}
                onValueChange={(value) => setField("preferred_time", value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="additional_notes">Additional Notes</Label>
              <Textarea
                id="additional_notes"
                value={data.additional_notes}
                onChange={(event) =>
                  setField("additional_notes", event.target.value)
                }
                rows={2}
                placeholder="Tell us what you need..."
                className="resize-none"
              />
              {fieldError("additional_notes") && (
                <span className="text-xs text-red-500">
                  {fieldError("additional_notes")}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent"
                  checked={data.consent}
                  onCheckedChange={(checked) => setField("consent", checked === true)}
                />
                <label
                  htmlFor="consent"
                  className="cursor-pointer text-xs leading-relaxed text-slate-500"
                >
                  I agree to be contacted via call, SMS, or email by SOG Glass &
                  Aluminum regarding my appointment request and related
                  services.
                </label>
              </div>
              {fieldError("consent") && (
                <span className="text-xs text-red-500">{fieldError("consent")}</span>
              )}
            </div>

            <Button
              type="submit"
              disabled={processing || !data.consent}
              className="mt-2 w-full bg-[#2c5282] py-3.5 text-sm font-bold hover:bg-[#6a8fa8] disabled:opacity-60"
            >
              {processing ? "Booking..." : "Book Free Inspection"}
            </Button>

            <p className="text-center text-xs text-slate-400">
              No payment required · Cancel anytime
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
