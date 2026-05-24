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
    <div className="h-screen w-screen dark:bg-[#F1F1F1] flex items-center justify-center">
      <div className="h-fit w-110 rounded-lg shadow-lg dark:bg-white space-y-4 p-5 flex justify-center items-center flex-col">
        <AppLogo />
        <div className="text-center">
          <h3 className="text-xl font-bold">Reset your password</h3>
          <h6 className="text-black/40 text-sm">
            Enter your new password below
          </h6>
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Please check the form.";
}
