"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import AppLogo from "@/components/ui/AppLogo";
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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <AppLogo />
          <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
            Staff Portal
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">
            Sign in to manage SOG
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            For administrators and workers only.
          </p>
        </div>

        {wasReset && (
          <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Password reset successfully. Please log in.
          </p>
        )}

        {challengeId ? (
          <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Authentication code</Label>
              <Input
                id="code"
                required
                name="code"
                inputMode="numeric"
                placeholder="123456"
                autoComplete="one-time-code"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading ? "Verifying..." : "Verify and sign in"}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setChallengeId("")}>
              Back to email and password
            </Button>
          </form>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              required
              name="email"
              type="email"
              placeholder="staff@sogglass.com"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              required
              name="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <FieldGroup>
            <Field orientation="horizontal">
              <Checkbox id="remember" name="remember" />
              <FieldLabel htmlFor="remember">Remember me</FieldLabel>
            </Field>
          </FieldGroup>

          <Button type="submit" className="h-11 w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          Customer?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Use OTP login
          </Link>
        </p>
      </div>
    </main>
  );
}
