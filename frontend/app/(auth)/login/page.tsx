"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail, Phone, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginStep = "contact" | "verify" | "success";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value: string) {
  return /^[+0-9\s().-]{10,20}$/.test(value);
}

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>("contact");
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const cleanedContact = contact.trim();

  const contactType = useMemo(() => {
    if (isEmail(cleanedContact)) return "email";
    if (isPhone(cleanedContact)) return "phone";
    return "contact";
  }, [cleanedContact]);

  function handleRequestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!isEmail(cleanedContact) && !isPhone(cleanedContact)) {
      setError("Enter a valid email address or mobile number.");
      return;
    }

    setStep("verify");
  }

  function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code we sent you.");
      return;
    }

    setStep("success");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-4 py-8 lg:grid-cols-[1fr_440px] lg:px-8">
        <section className="hidden lg:block">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/images/sog-logo.png"
              alt="SOG Logo"
              width={1408}
              height={768}
              className="h-14 w-auto"
              priority
            />
          </Link>

          <div className="mt-5 max-w-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              Customer Portal
            </p>
            <h1 className="mt-4 text-5xl font-bold leading-tight tracking-tight text-slate-950">
              Track every inspection, quote, and installation in one place.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
              Sign in with a one-time code to view your appointments, work jobs,
              quotes, and product selections without remembering another password.
            </p>
          </div>

        </section>

        <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
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
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
                  Customer Login
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  Get your one-time code
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Enter the email or mobile number you used for your appointment
                  and we will send a secure login code.
                </p>
              </div>

              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="contact">Email or mobile number</Label>
                  <div className="relative">
                    {contactType === "email" ? (
                      <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    ) : (
                      <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    )}
                    <Input
                      id="contact"
                      value={contact}
                      onChange={(event) => {
                        setContact(event.target.value);
                        setError("");
                      }}
                      placeholder="juan@example.com or +63 9XX XXX XXXX"
                      className="h-11 pl-9"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                    {error}
                  </p>
                )}

                <Button type="submit" className="h-11 w-full">
                  Send OTP
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
                <h2 className="text-2xl font-bold text-slate-950">
                  Enter verification code
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  We sent a 6-digit code to{" "}
                  <span className="font-semibold text-slate-800">{cleanedContact}</span>.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="otp">One-time code</Label>
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(event) => {
                      setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
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

                <Button type="submit" className="h-11 w-full">
                  Verify and continue
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setNotice("A new code has been sent.");
                  }}
                  className="w-full text-center text-sm font-medium text-primary hover:underline"
                >
                  Resend code
                </button>
              </form>
            </>
          )}

          {step === "success" && (
            <div className="py-4 text-center">
              <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="size-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-950">Code verified</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                You are signed in. Your customer portal is ready.
              </p>
            </div>
          )}

          <div className="mt-8 border-t border-slate-100 pt-5 text-center">
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
        </section>
      </div>
    </main>
  );
}
