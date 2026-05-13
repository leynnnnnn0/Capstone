"use client";

import { useState, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AppLogo from "@/components/ui/AppLogo";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);

    try {
      await api("/api/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          email,
          password: form.get("password"),
          password_confirmation: form.get("password_confirmation"),
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
