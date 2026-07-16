"use client";

import { useState, FormEvent } from "react";
import { api } from "@/lib/api";
import AppLogo from "@/components/ui/AppLogo";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import HistoryBackButton from "@/components/navigation/HistoryBackButton";

export default function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const form = new FormData(e.currentTarget);

    try {
      await api("/api/forgot-password", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
        }),
      });

      setSuccess("We sent a password reset link to your email.");
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
          <h1 className="text-3xl font-medium tracking-[-0.04em] text-[#101820]">Forgot your password?</h1>
          <p className="mt-2 text-sm text-[#667584]">
            Enter your email and we will send you a reset link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="space-y-2 flex flex-col items-start w-full">
            <Label>Email</Label>
            <Input
              required
              name="email"
              type="email"
              placeholder="email@example.com"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}

          <Button type="submit" className="h-12 w-full rounded-full bg-[#162d4a] hover:bg-[#2c5282]" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>

        <div className="flex items-center gap-2 text-sm text-[#667584]">
          <span>Remembered it?</span>
          <HistoryBackButton
            fallbackHref="/staff/login"
            label="Back to login"
            className="font-medium text-black hover:underline"
          />
        </div>
      </div>
      </div>
    </main>
  );
}
