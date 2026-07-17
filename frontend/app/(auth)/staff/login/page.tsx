"use client";

import { FormEvent, Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import type { User } from "@/types/user";

type LoginResponse = {
  user: User | { data: User };
};

type TwoFactorChallengeResponse = {
  two_factor: true;
  challenge_id: string;
};

type StaffLoginResponse = LoginResponse | TwoFactorChallengeResponse;

function unwrapUser(payload: LoginResponse["user"]): User {
  return isResourceUser(payload) ? payload.data : payload;
}

function isResourceUser(payload: LoginResponse["user"]): payload is { data: User } {
  return typeof payload === "object" && payload !== null && "data" in payload;
}

export default function StaffLoginPage() {
  return (
    <Suspense fallback={null}>
      <StaffLoginForm />
    </Suspense>
  );
}

function StaffLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [challengeId, setChallengeId] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const wasReset = searchParams.get("reset") === "true";

  function redirectForUser(payload: LoginResponse) {
    const user = unwrapUser(payload.user);
    const role = user.roles?.[0] ?? user.role;
    router.push(role === "customer" ? "/account" : "/dashboard");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const shouldRemember = form.get("remember") != null;

    try {
      const response = await api<StaffLoginResponse>("/api/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          remember: shouldRemember,
        }),
      });

      if ("two_factor" in response) {
        setChallengeId(response.challenge_id);
        setRemember(shouldRemember);
        return;
      }

      redirectForUser(response);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleTwoFactorSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);

    try {
      const response = await api<LoginResponse>("/api/two-factor-challenge", {
        method: "POST",
        body: JSON.stringify({
          challenge_id: challengeId,
          code: form.get("code"),
          remember,
        }),
      });

      redirectForUser(response);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid authentication code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#eef3f6] px-3 py-3 sm:px-6 sm:py-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(96,141,185,0.16),transparent_30%),radial-gradient(circle_at_90%_90%,rgba(22,45,74,0.10),transparent_32%)]" />

      <section className="relative grid min-h-[calc(100vh-1.5rem)] w-full max-w-[1180px] overflow-hidden rounded-[1.75rem] border border-white/70 bg-white shadow-[0_28px_90px_rgba(22,45,74,0.16)] sm:min-h-[700px] lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative hidden overflow-hidden bg-[#162d4a] lg:block">
          <Image
            src="/images/landing/aesthetic.jpg"
            alt="Modern black aluminum window system"
            fill
            priority
            sizes="(min-width: 1024px) 54vw, 0px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,31,52,0.30)_0%,rgba(13,31,52,0.62)_48%,rgba(13,31,52,0.96)_100%)]" />
          <div className="absolute inset-0 flex flex-col p-10 xl:p-12">
            <Link href="/" className="flex w-fit items-center gap-3 text-white">
              <span className="flex size-14 items-center justify-center rounded-full bg-white/95 shadow-lg">
                <Image src="/images/sog-logo.png" width={48} height={48} alt="SOG logo" />
              </span>
              <span>
                <span className="block text-xs font-bold uppercase tracking-[0.2em]">SOG Admin</span>
                <span className="mt-0.5 block text-xs text-white/55">Glass &amp; Aluminum Services</span>
              </span>
            </Link>

            <div className="mt-auto max-w-lg text-white">
              <div className="mb-5 flex size-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
                <ShieldCheck className="size-5" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#b9cfe0]">Secure operations workspace</p>
              <h2 className="mt-4 text-4xl font-semibold leading-[1.06] tracking-[-0.045em] xl:text-5xl">
                Built for precise work,
                <br />from quote to installation.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-6 text-white/65">
                Manage customers, schedules, field teams, quotations, and payments from one focused command center.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/15 pt-6 text-xs text-white/65">
                {[
                  "Protected access",
                  "Live operations",
                  "Audit ready",
                ].map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-[#b9cfe0]" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col bg-white p-5 sm:p-9 lg:p-12 xl:p-14">
          <div className="flex items-center justify-between lg:justify-end">
            <Link href="/" className="flex items-center gap-2.5 lg:hidden">
              <Image src="/images/sog-logo.png" width={46} height={46} alt="SOG logo" />
              <span className="text-[10px] font-bold uppercase leading-4 tracking-[0.16em] text-[#162d4a]">
                Glass &amp; Aluminum
                <br />Services
              </span>
            </Link>
            <Link href="/" className="text-xs font-semibold text-[#61758a] transition-colors hover:text-[#162d4a]">
              Back to website
            </Link>
          </div>

          <div className="my-auto mx-auto w-full max-w-[390px] py-10 sm:py-14">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#608db9]">Staff portal</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-[#0f1d2d] sm:text-4xl">
              {challengeId ? "Verify your identity" : "Welcome back."}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#6b7d8e]">
              {challengeId
                ? "Enter the six-digit code from your authenticator app to continue."
                : "Sign in with your staff account to access the SOG operations workspace."}
            </p>

            {wasReset && !challengeId && (
              <p className="mt-6 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                Password reset successfully. Please sign in.
              </p>
            )}

            {challengeId ? (
              <form onSubmit={handleTwoFactorSubmit} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-semibold text-[#26394d]">Authentication code</Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#7890a5]" />
                    <Input id="code" required name="code" inputMode="numeric" maxLength={6} placeholder="000000" autoComplete="one-time-code" autoFocus className="h-12 rounded-xl border-[#d7e1e8] bg-[#f9fbfc] pl-10 text-center text-lg font-semibold tracking-[0.35em] text-[#162d4a] focus-visible:border-[#608db9] focus-visible:ring-[#608db9]/15" />
                  </div>
                </div>

                {error && <LoginError message={error} />}

                <Button type="submit" className="h-12 w-full rounded-xl bg-[#162d4a] font-semibold text-white shadow-[0_10px_25px_rgba(22,45,74,0.18)] hover:bg-[#213d5d]" disabled={loading}>
                  {loading ? "Verifying..." : "Verify and sign in"}
                  {!loading && <ArrowRight className="size-4" />}
                </Button>
                <Button type="button" variant="ghost" className="h-11 w-full rounded-xl text-[#536a7e]" onClick={() => { setChallengeId(""); setError(""); }}>
                  Back to email and password
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-[#26394d]">Email address</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#7890a5]" />
                    <Input id="email" required name="email" type="email" placeholder="staff@sogglass.com" autoComplete="email" className="h-12 rounded-xl border-[#d7e1e8] bg-[#f9fbfc] pl-10 text-[#162d4a] placeholder:text-[#94a3af] focus-visible:border-[#608db9] focus-visible:ring-[#608db9]/15" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="password" className="text-sm font-semibold text-[#26394d]">Password</Label>
                    <Link href="/forgot-password" className="text-xs font-semibold text-[#608db9] transition-colors hover:text-[#365f87]">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#7890a5]" />
                    <Input id="password" required name="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" autoComplete="current-password" className="h-12 rounded-xl border-[#d7e1e8] bg-[#f9fbfc] px-10 text-[#162d4a] placeholder:text-[#94a3af] focus-visible:border-[#608db9] focus-visible:ring-[#608db9]/15" />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-[#7890a5] transition-colors hover:bg-[#eaf0f4] hover:text-[#162d4a]">
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {error && <LoginError message={error} />}

                <FieldGroup>
                  <Field orientation="horizontal" className="gap-2.5">
                    <Checkbox id="remember" name="remember" className="border-[#aab9c5] data-[state=checked]:border-[#162d4a] data-[state=checked]:bg-[#162d4a]" />
                    <FieldLabel htmlFor="remember" className="text-sm font-medium text-[#536a7e]">Keep me signed in</FieldLabel>
                  </Field>
                </FieldGroup>

                <Button type="submit" className="h-12 w-full rounded-xl bg-[#162d4a] font-semibold text-white shadow-[0_10px_25px_rgba(22,45,74,0.18)] hover:bg-[#213d5d]" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in to workspace"}
                  {!loading && <ArrowRight className="size-4" />}
                </Button>
              </form>
            )}

            <div className="mt-8 border-t border-[#e4ebf0] pt-6 text-center text-sm text-[#718394]">
              Customer?{" "}
              <Link href="/login" className="font-semibold text-[#365f87] transition-colors hover:text-[#162d4a]">
                Use customer OTP login
              </Link>
            </div>
          </div>

          <p className="text-center text-[10px] uppercase tracking-[0.16em] text-[#9aa8b4] lg:text-right">
            Authorized personnel only · Secure access
          </p>
        </div>
      </section>
    </main>
  );
}

function LoginError({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
      {message}
    </p>
  );
}
