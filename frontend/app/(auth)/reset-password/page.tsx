"use client";

import { useState, FormEvent, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AppLogo from "@/components/ui/AppLogo";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { requiredEmailSchema, strongPasswordSchema } from "@/features/forms/validation";

const resetPasswordSchema = z
  .object({
    email: requiredEmailSchema(),
    password: strongPasswordSchema("New password"),
    password_confirmation: z.string().min(1, "Confirm new password is required."),
  })
  .refine((data) => data.password === data.password_confirmation, {
    path: ["password_confirmation"],
    message: "Passwords do not match.",
  });

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const parsed = resetPasswordSchema.safeParse({
      email,
      password: form.get("password"),
      password_confirmation: form.get("password_confirmation"),
    });

    if (!token) {
      setError("Reset token is missing.");
      return;
    }

    if (!parsed.success) {
      setError(firstIssue(parsed.error));
      return;
    }

    setLoading(true);

    try {
      await api("/api/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          ...parsed.data,
        }),
      });
        
      router.push("/staff/login?reset=true");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white p-2 sm:p-3">
      <div className="flex min-h-[calc(100svh-1rem)] items-center justify-center rounded-[2rem] bg-[#162d4a] px-4 py-12 sm:min-h-[calc(100svh-1.5rem)]">
      <div className="flex h-fit w-full max-w-md flex-col items-center justify-center space-y-5 rounded-[1.75rem] border border-white/20 bg-white p-6 shadow-[0_30px_100px_rgba(0,0,0,0.2)] sm:p-8">
        <AppLogo />
        <div className="text-center">
          <h1 className="text-3xl font-medium tracking-[-0.04em] text-[#101820]">Reset your password</h1>
          <p className="mt-2 text-sm text-[#667584]">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="space-y-2 flex flex-col items-start w-full">
            <Label>New Password</Label>
            <Input
              required
              name="password"
              type="password"
              placeholder="••••••••"
            />
            <p className="text-xs text-muted-foreground">Use uppercase, lowercase, number, and symbol.</p>
          </div>

          <div className="space-y-2 flex flex-col items-start w-full">
            <Label>Confirm New Password</Label>
            <Input
              required
              name="password_confirmation"
              type="password"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit" className="h-12 w-full rounded-full bg-[#162d4a] hover:bg-[#2c5282]" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </div>
      </div>
    </main>
  );
}

function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Please check the form.";
}
