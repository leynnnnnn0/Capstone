"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FormEvent, useCallback, useState } from "react";

import { ApiError, api } from "@/lib/api";
import BookingScheduleFields from "@/components/booking/BookingScheduleFields";
import NameInput from "@/components/form/NameInput";
import PhoneNumberInput from "@/components/form/PhoneNumberInput";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "@/features/booking/booking-utils";
import type {
  BookingForm,
  BookingFormErrors,
  LocationValue,
} from "@/features/booking/types";
import LocationPicker from "./LocationPicker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ArrowRight, Calculator } from "lucide-react";

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function Booking() {
  const [data, setData] = useState<BookingForm>(() => createInitialBookingForm());
  const [errors, setErrors] = useState<BookingFormErrors>({});
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<BookingForm | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const revealInitial = prefersReducedMotion ? false : "hidden";

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

    setPendingBooking(parsed.data as BookingForm);
    setConfirmOpen(true);
  }

  async function performSubmit() {
    if (!pendingBooking) return;

    setProcessing(true);
    setErrors({});

    try {
      await api("/api/v1/appointments", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify(pendingBooking),
      });
      setSuccess("Appointment booked successfully. We will contact you soon.");
      toast.success("Appointment booked successfully.");
      setData(createInitialBookingForm());
      setPendingBooking(null);
      setConfirmOpen(false);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(flattenServerErrors(error));
        toast.error(error.message || "Failed to book appointment.");
      } else {
        setErrors({ form: "Failed to book appointment. Please try again." });
        toast.error("Failed to book appointment. Please try again.");
      }
    } finally {
      setProcessing(false);
    }
  }

  return (
    <section
      id="booking"
      className="px-2 pt-3 sm:px-3"
    >
      <motion.div
        className="mx-auto grid max-w-none items-start gap-12 rounded-[2rem] bg-[#f3f6f8] px-5 py-20 sm:px-10 sm:py-24 md:grid-cols-2 md:gap-14 lg:px-16 lg:py-28 xl:gap-24"
        initial={revealInitial}
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.14 } },
        }}
      >
        <motion.div variants={reveal}>
          <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#667584] sm:text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-[#608db9]" />
            Book an inspection
          </span>
          <h2 className="mb-6 mt-4 text-[clamp(2.75rem,5.5vw,6rem)] font-medium leading-[0.9] tracking-[-0.06em] text-[#101820]">
            Free on-site
            <br />
            inspection.
          </h2>
          <p className="mb-9 max-w-md text-base leading-7 text-[#667584]">
            Our technicians visit your space, measure precisely, and
            provide a detailed no-obligation quotation completely free of
            charge.
          </p>
          <motion.ul
            className="mb-10 space-y-4 text-sm text-[#536372]"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {[
              "Precise on-site measurement of all openings",
              "Product recommendation tailored to your space",
              "Material samples to see and feel in person",
              "Transparent itemized quote on the spot",
            ].map((item) => (
              <motion.li
                key={item}
                variants={reveal}
                className="flex items-center gap-3"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#dce9f3] text-[10px] font-bold text-[#2c5282]">✓</span>
                {item}
              </motion.li>
            ))}
          </motion.ul>
          <motion.div
            whileHover={
              prefersReducedMotion ? undefined : { y: -4 }
            }
            className="overflow-hidden rounded-[1.5rem]"
          >
            <Link
              href="/get-quote"
              className="group flex cursor-pointer items-center gap-4 rounded-[1.5rem] bg-[#162d4a] px-5 py-5 text-white transition-colors hover:bg-[#2c5282] sm:px-6"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
                <Calculator className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                  Quick estimate
                </p>
                <h4 className="mt-1 text-lg font-medium">
                  Get an instant quote first
                </h4>
                <p className="mt-1 text-sm leading-relaxed text-white/80">
                  Enter dimensions and see an estimated price in minutes.
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#2c5282] transition-transform group-hover:translate-x-1">
                  Start estimating
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          variants={reveal}
          className="rounded-[1.75rem] border border-[#dce4ea] bg-white p-5 shadow-[0_24px_80px_rgba(22,45,74,0.08)] sm:p-8 lg:p-10"
        >
          <h3 className="mb-7 text-lg font-medium text-[#101820]">
            Schedule a Visit
          </h3>

          <AnimatePresence>
            {(errors.rate_limit || errors.form) && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-600"
              >
                {errors.rate_limit || errors.form}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-medium text-green-700"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="first_name">First Name</Label>
                <NameInput
                  id="first_name"
                  value={data.first_name}
                  onValueChange={(value) => setField("first_name", value)}
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
                <NameInput
                  id="last_name"
                  value={data.last_name}
                  onValueChange={(value) => setField("last_name", value)}
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
              <PhoneNumberInput
                id="phone_number"
                value={data.phone_number}
                onValueChange={(value) => setField("phone_number", value)}
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
                <span className="text-xs text-red-500">
                  {fieldError("email")}
                </span>
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

            <BookingScheduleFields
              preferredDate={data.preferred_date}
              preferredTime={data.preferred_time}
              dateError={fieldError("preferred_date")}
              timeError={fieldError("preferred_time")}
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
              onPreferredTimeChange={(value) =>
                setField("preferred_time", value)
              }
            />

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
                  onCheckedChange={(checked) =>
                    setField("consent", checked === true)
                  }
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
                <span className="text-xs text-red-500">
                  {fieldError("consent")}
                </span>
              )}
            </div>

            <Button
              type="submit"
              disabled={processing || !data.consent}
              className="mt-2 w-full rounded-full bg-[#162d4a] py-3.5 text-sm font-bold hover:bg-[#2c5282] disabled:opacity-60"
            >
              {processing ? "Booking..." : "Book Free Inspection"}
            </Button>

            <p className="text-center text-xs text-slate-400">
              No payment required · Cancel anytime
            </p>
          </form>
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Book this free inspection?</AlertDialogTitle>
                <AlertDialogDescription>
                  We will submit your appointment request and contact you
                  through the phone or email you provided.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={processing}>
                  Review details
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={processing}
                  onClick={(event) => {
                    event.preventDefault();
                    void performSubmit();
                  }}
                >
                  {processing ? "Booking..." : "Confirm Booking"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>
      </motion.div>
    </section>
  );
}
