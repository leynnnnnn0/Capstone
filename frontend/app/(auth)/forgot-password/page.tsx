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
    <div className="h-screen w-screen dark:bg-[#F1F1F1] flex items-center justify-center">
      <div className="h-fit w-110 rounded-lg shadow-lg dark:bg-white space-y-4 p-5 flex justify-center items-center flex-col">
        <AppLogo />
        <div className="text-center">
          <h3 className="text-xl font-bold">Forgot your password?</h3>
          <h6 className="text-black/40 text-sm">
            Enter your email and we will send you a reset link
          </h6>
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>

        <div className="flex items-center gap-2 text-sm text-black/40">
          <span>Remembered it?</span>
          <HistoryBackButton
            fallbackHref="/staff/login"
            label="Back to login"
            className="font-medium text-black hover:underline"
          />
        </div>
      </div>
    </div>
  );
}
