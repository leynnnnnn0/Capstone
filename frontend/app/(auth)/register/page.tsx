'use client';

import AppLogo from "@/components/ui/AppLogo";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { z } from "zod";
import { requiredEmailSchema, strongPasswordSchema } from "@/features/forms/validation";

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters."),
    email: requiredEmailSchema(),
    password: strongPasswordSchema(),
    password_confirmation: z.string().min(1, "Confirm password is required."),
  })
  .refine((data) => data.password === data.password_confirmation, {
    path: ["password_confirmation"],
    message: "Passwords do not match.",
  });

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const form = new FormData(e.currentTarget);
    const parsed = registerSchema.safeParse({
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
      password_confirmation: form.get("password_confirmation"),
    });

    if (!parsed.success) {
      setError(firstIssue(parsed.error));
      return;
    }

    setLoading(true);

    try {
      await api("/api/register", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });

      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
          <h1 className="text-3xl font-medium tracking-[-0.04em] text-[#101820]">Create an account</h1>
          <p className="mt-2 text-sm text-[#667584]">
            Fill in the details below to get started
          </p>
        </div>

        <form onSubmit={handleRegister} className="w-full space-y-4">
          <div className="space-y-2 flex flex-col items-start w-full">
            <Label>Name</Label>
            <Input name="name" type="text" placeholder="Juan dela Cruz" required />
          </div>

          <div className="space-y-2 flex flex-col items-start w-full">
            <Label>Email</Label>
            <Input name="email" type="email" placeholder="email@example.com" required />
          </div>

          <div className="space-y-2 flex flex-col items-start w-full">
            <Label>Password</Label>
            <Input name="password" type="password" placeholder="••••••••" required />
            <p className="text-xs text-muted-foreground">Use uppercase, lowercase, number, and symbol.</p>
          </div>

          <div className="space-y-2 flex flex-col items-start w-full">
            <Label>Confirm Password</Label>
            <Input name="password_confirmation" type="password" placeholder="••••••••" required />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit" className="h-12 w-full rounded-full bg-[#162d4a] hover:bg-[#2c5282]" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="text-sm text-[#667584]">
          Already have an account?{" "}
          <Link href="/login" className="text-black font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
      </div>
    </main>
  );
}

function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Please check the form.";
}
