"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Mail, Phone } from "lucide-react";

import PhoneNumberInput from "@/components/form/PhoneNumberInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  requestCustomerOtp,
  verifyCustomerOtp,
} from "@/features/customer-auth/customer-auth-api";
import { normalizePhilippineMobile } from "@/features/forms/validation";
import { ApiError } from "@/lib/api";

type LoginStep = "contact" | "verify" | "success";
type ContactMode = "phone" | "email";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function apiFieldError(error: ApiError, fields: string[]) {
  for (const field of fields) {
    const message = error.errors?.[field];
    if (Array.isArray(message)) return message[0];
    if (message) return message;
  }

  return error.message;
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>("contact");
  const [contactMode, setContactMode] = useState<ContactMode>("phone");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [submittedContact, setSubmittedContact] = useState("");
  const [submittedContactLabel, setSubmittedContactLabel] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const customerContact =
    contactMode === "email"
      ? email.trim().toLowerCase()
      : normalizePhilippineMobile(phoneNumber);
  const customerContactLabel =
    contactMode === "email"
      ? customerContact
      : customerContact.replace("+63", "+63 ");

  async function handleRequestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (contactMode === "email" && !isEmail(customerContact)) {
      setError("Enter a valid email address.");
      return;
    }

    if (contactMode === "phone" && !/^\+639\d{9}$/.test(customerContact)) {
      setError("Enter a valid 10-digit mobile number starting with 9.");
      return;
    }

    setLoading(true);
    try {
      const result = await requestCustomerOtp(customerContact);
      console.log(result);
      setCountdown(60);
      setSubmittedContact(customerContact);
      setSubmittedContactLabel(customerContactLabel);
      setStep("verify");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? apiFieldError(err, ["contact"])
          : "Unable to send your code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code we sent you.");
      return;
    }

    const contactForVerification = submittedContact || customerContact;

    setLoading(true);
    try {
      await verifyCustomerOtp(contactForVerification, otp);
      setStep("success");
      router.push("/account");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? apiFieldError(err, ["code", "contact"])
          : "Unable to verify your code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    setError("");
    setNotice("");
    setLoading(true);

    try {
      await requestCustomerOtp(submittedContact || customerContact);
      setNotice("A new code has been sent.");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? apiFieldError(err, ["contact"])
          : "Unable to resend your code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white p-2 sm:p-3">
      <div className="mx-auto grid min-h-[calc(100svh-1rem)] w-full max-w-[1440px] overflow-hidden rounded-[2rem] bg-[#f3f6f8] sm:min-h-[calc(100svh-1.5rem)] lg:grid-cols-[1.15fr_0.85fr]">
        <section className="relative hidden overflow-hidden bg-[#162d4a] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
          <Image
            src="/images/landing/aesthetic.jpg"
            alt="Black aluminum window systems on a modern residence"
            fill
            priority
            sizes="60vw"
            className="object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#162d4a]/70 via-[#162d4a]/45 to-[#162d4a]/95" />
          <Link
            href="/"
            className="relative inline-flex items-center gap-3 self-start"
          >
            <Image
              src="/images/sog-logo.png"
              alt="SOG Logo"
              width={1408}
              height={768}
              className="h-14 w-auto"
              priority
            />
          </Link>

          <div className="relative max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#c8dae8]">
              Customer Portal
            </p>
            <h1 className="mt-5 text-[clamp(3.5rem,5vw,6.5rem)] font-medium leading-[0.88] tracking-[-0.06em] text-white">
              Track every inspection, quote, and installation in one place.
            </h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-white/65">
              Sign in with a one-time code to view your appointments, work jobs,
              quotes, and product selections without remembering another
              password.
            </p>
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-xl flex-col justify-center px-5 py-12 sm:px-10 lg:px-14 xl:px-20">
          <div className="rounded-[1.75rem] border border-[#dce4ea] bg-white p-6 shadow-[0_24px_80px_rgba(22,45,74,0.09)] sm:p-8">
            <div className="mb-8 text-center lg:hidden">
              <Image
                src="/images/sog-logo.png"
                alt="SOG Logo"
                width={1408}
                height={768}
                className="mx-auto h-14 w-auto"
                priority
              />
            </div>

            {step === "contact" && (
              <>
                <div className="mb-7">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#608db9]">
                    Customer Login
                  </p>
                  <h2 className="mt-3 text-3xl font-medium tracking-[-0.04em] text-[#101820]">
                    Get your one-time code
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Enter the email or mobile number you used for your
                    appointment and we will send a secure login code.
                  </p>
                </div>

                <form onSubmit={handleRequestOtp} className="space-y-5">
                  <div className="space-y-2">
                    <Label>Send code via</Label>
                    <div className="grid grid-cols-2 gap-2 rounded-full bg-[#f3f6f8] p-1">
                      {(["phone", "email"] as ContactMode[]).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setContactMode(mode);
                            setError("");
                          }}
                          className={`inline-flex h-10 items-center justify-center gap-2 rounded-full text-sm font-medium transition ${
                            contactMode === mode
                              ? "bg-white text-slate-950 shadow-sm"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          {mode === "phone" ? (
                            <Phone className="size-4" />
                          ) : (
                            <Mail className="size-4" />
                          )}
                          {mode === "phone" ? "Mobile" : "Email"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {contactMode === "phone" ? (
                      <>
                        <Label htmlFor="contact-phone">Mobile number</Label>
                        <PhoneNumberInput
                          id="contact-phone"
                          value={phoneNumber}
                          onValueChange={(value) => {
                            setPhoneNumber(value);
                            setError("");
                          }}
                          groupClassName="h-11"
                          autoComplete="tel-national"
                        />
                      </>
                    ) : (
                      <>
                        <Label htmlFor="contact-email">Email address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            id="contact-email"
                            type="email"
                            value={email}
                            onChange={(event) => {
                              setEmail(event.target.value);
                              setError("");
                            }}
                            placeholder="juan@example.com"
                            className="h-11 pl-9"
                            autoComplete="email"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {error && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="h-12 w-full rounded-full bg-[#162d4a] hover:bg-[#2c5282]"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </Button>
                </form>
              </>
            )}

            {step === "verify" && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setStep("contact");
                    setOtp("");
                    setError("");
                    setNotice("");
                  }}
                  className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
                >
                  <ArrowLeft className="size-4" />
                  Change contact
                </button>

                <div className="mb-7">
                  <h2 className="text-3xl font-medium tracking-[-0.04em] text-[#101820]">
                    Enter verification code
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    We sent a 6-digit code to{" "}
                    <span className="font-semibold text-slate-800">
                      {submittedContactLabel || customerContactLabel}
                    </span>
                    .
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="otp">One-time code</Label>
                    <Input
                      id="otp"
                      value={otp}
                      onChange={(event) => {
                        setOtp(
                          event.target.value.replace(/\D/g, "").slice(0, 6),
                        );
                        setError("");
                      }}
                      inputMode="numeric"
                      placeholder="000000"
                      className="h-12 text-center text-xl font-bold tracking-[0.45em]"
                      autoComplete="one-time-code"
                    />
                  </div>

                  {error && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                      {error}
                    </p>
                  )}
                  {notice && (
                    <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                      {notice}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="h-12 w-full rounded-full bg-[#162d4a] hover:bg-[#2c5282]"
                    disabled={loading}
                  >
                    {loading ? "Verifying..." : "Verify and continue"}
                  </Button>

                  <div className="w-full flex justify-center items-center gap-1">
                    <button
                      type="button"
                      onClick={resendCode}
                      disabled={loading}
                      className="text-center text-sm font-medium text-primary hover:underline"
                    >
                      Resend{" "}
                    </button>
                    {countdown > 0 && (
                      <span className="font-medium text-xs">
                        {" "}
                        OTP in <strong>{countdown}s</strong>{" "}
                      </span>
                    )}
                  </div>
                </form>
              </>
            )}

            {step === "success" && (
              <div className="py-4 text-center">
                <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="size-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-950">
                  Code verified
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  You are signed in. Your customer portal is ready.
                </p>
              </div>
            )}

            <div className="mt-8 border-t border-[#dce4ea] pt-5 text-center">
              <p className="text-sm text-slate-500">
                SOG team member?{" "}
                <Link
                  href="/staff/login"
                  className="font-semibold text-primary hover:underline"
                >
                  Staff login
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
