"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, KeyRound, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { z } from "zod";

import NameInput from "@/components/form/NameInput";
import PhoneNumberInput from "@/components/form/PhoneNumberInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  confirmPassword,
  confirmTwoFactor,
  disableTwoFactor,
  enableTwoFactor,
  fetchPasswordConfirmationStatus,
  fetchProfileUser,
  fetchTwoFactorQrCode,
  fetchTwoFactorRecoveryCodes,
  regenerateTwoFactorRecoveryCodes,
  updatePassword,
  updateProfile,
  type PasswordPayload,
  type ProfilePayload,
} from "@/features/settings/settings-api";
import {
  optionalPhilippineMobileSchema,
  personNameSchema,
  requiredEmailSchema,
  strongPasswordSchema,
  zodIssuesToFieldErrors,
} from "@/features/forms/validation";
import { ApiError, type ApiValidationErrors } from "@/lib/api";
import type { User } from "@/types/user";
import { toast } from "sonner";

type Tab = "profile" | "security";

const profileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(50, "Username must be 50 characters or fewer.")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, dots, underscores, and hyphens."),
  first_name: personNameSchema("First name"),
  last_name: personNameSchema("Last name"),
  email: requiredEmailSchema(),
  phone_number: optionalPhilippineMobileSchema(),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required."),
    password: strongPasswordSchema("New password"),
    password_confirmation: z.string().min(1, "Confirm new password is required."),
  })
  .refine((data) => data.password === data.password_confirmation, {
    path: ["password_confirmation"],
    message: "Passwords do not match.",
  });

const passwordConfirmationSchema = z.object({
  password: z.string().min(1, "Password is required."),
});

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordConfirmed, setPasswordConfirmed] = useState(false);

  const reload = useCallback(() => {
    return fetchProfileUser().then((response) => setUser(response.data));
  }, []);

  const handlePasswordExpired = useCallback(() => {
    setPasswordConfirmed(false);
    setUser(null);
    toast.error("Please confirm your password again to continue.");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setLoading(true);

      try {
        const status = await fetchPasswordConfirmationStatus();
        if (cancelled) return;

        setPasswordConfirmed(status.confirmed);

        if (status.confirmed) {
          await reload();
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load settings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    boot();

    return () => {
      cancelled = true;
    };
  }, [reload]);

  if (loading) {
    return <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">Loading settings...</div>;
  }

  if (!passwordConfirmed) {
    return (
      <SettingsPasswordGate
        onConfirmed={async () => {
          setLoading(true);
          try {
            await reload();
            setPasswordConfirmed(true);
          } finally {
            setLoading(false);
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Settings</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Profile and security</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account information, password, and two-factor authentication.</p>
      </div>

      <div className="inline-flex rounded-lg border bg-muted p-1">
        <TabButton active={tab === "profile"} onClick={() => setTab("profile")} icon={<UserRound className="size-4" />}>Profile</TabButton>
        <TabButton active={tab === "security"} onClick={() => setTab("security")} icon={<ShieldCheck className="size-4" />}>Security</TabButton>
      </div>

      {tab === "profile" ? (
        <ProfileSettings user={user} onSaved={reload} onPasswordExpired={handlePasswordExpired} />
      ) : (
        <SecuritySettings user={user} onSaved={reload} onPasswordExpired={handlePasswordExpired} />
      )}
    </div>
  );
}

function SettingsPasswordGate({ onConfirmed }: { onConfirmed: () => Promise<void> }) {
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<ApiValidationErrors>({});
  const [saving, setSaving] = useState(false);

  async function submit() {
    setErrors({});

    const parsed = passwordConfirmationSchema.safeParse({ password });
    if (!parsed.success) {
      setErrors(zodIssuesToFieldErrors(parsed.error.issues) as ApiValidationErrors);
      return;
    }

    setSaving(true);

    try {
      await confirmPassword(parsed.data.password);
      setPassword("");
      await onConfirmed();
      toast.success("Settings unlocked.");
    } catch (error) {
      setErrors(error instanceof ApiError ? error.errors ?? { password: error.message } : { password: "Unable to confirm password." });
      toast.error(error instanceof Error ? error.message : "Unable to confirm password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl items-center">
      <Card className="w-full">
        <CardHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <KeyRound className="size-5" />
          </div>
          <CardTitle className="text-lg">Confirm your password</CardTitle>
          <CardDescription>
            Settings contain sensitive account and security controls. Confirm your password to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <Field label="Password" error={fieldError(errors.password)}>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoFocus
                autoComplete="current-password"
              />
            </Field>
            {fieldError(errors.form) && <p className="text-sm text-destructive">{fieldError(errors.form)}</p>}
            <Button type="submit" disabled={saving || !password}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              Unlock Settings
            </Button>
            <p className="text-xs text-muted-foreground">You will stay unlocked for a short period on this device.</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileSettings({ user, onSaved, onPasswordExpired }: { user: User | null; onSaved: () => Promise<void>; onPasswordExpired: () => void }) {
  const [form, setForm] = useState<ProfilePayload>({
    username: user?.username ?? "",
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    email: user?.email ?? "",
    phone_number: user?.phone_number ?? "",
  });
  const [errors, setErrors] = useState<ApiValidationErrors>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setErrors({});
    setSaved(false);

    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(zodIssuesToFieldErrors(parsed.error.issues) as ApiValidationErrors);
      return;
    }

    setSaving(true);

    try {
      await updateProfile(parsed.data as ProfilePayload);
      await onSaved();
      setSaved(true);
      toast.success("Profile updated successfully.");
    } catch (error) {
      if (error instanceof ApiError && error.status === 423) {
        onPasswordExpired();
        return;
      }

      setErrors(error instanceof ApiError ? error.errors ?? { form: error.message } : { form: "Unable to update profile." });
      toast.error(error instanceof Error ? error.message : "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Profile Information</CardTitle>
        <CardDescription>Update the account details used across the admin and worker portals.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Field label="Username" error={fieldError(errors.username)}>
            <Input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
          </Field>
          <Field label="Email" error={fieldError(errors.email)}>
            <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </Field>
          <Field label="First Name" error={fieldError(errors.first_name)}>
            <NameInput value={form.first_name} onValueChange={(value) => setForm({ ...form, first_name: value })} />
          </Field>
          <Field label="Last Name" error={fieldError(errors.last_name)}>
            <NameInput value={form.last_name} onValueChange={(value) => setForm({ ...form, last_name: value })} />
          </Field>
          <Field label="Phone Number" error={fieldError(errors.phone_number)}>
            <PhoneNumberInput value={form.phone_number} onValueChange={(value) => setForm({ ...form, phone_number: value })} />
          </Field>

          <div className="flex items-center gap-3 md:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Save Profile
            </Button>
            {saved && <span className="text-sm text-emerald-600">Profile updated.</span>}
            {fieldError(errors.form) && <span className="text-sm text-destructive">{fieldError(errors.form)}</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SecuritySettings({ user, onSaved, onPasswordExpired }: { user: User | null; onSaved: () => Promise<void>; onPasswordExpired: () => void }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <PasswordSettings onPasswordExpired={onPasswordExpired} />
      <TwoFactorSettings enabled={Boolean(user?.two_factor_enabled)} onSaved={onSaved} />
    </div>
  );
}

function PasswordSettings({ onPasswordExpired }: { onPasswordExpired: () => void }) {
  const [form, setForm] = useState<PasswordPayload>({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState<ApiValidationErrors>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setErrors({});
    setSaved(false);

    const parsed = passwordSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(zodIssuesToFieldErrors(parsed.error.issues) as ApiValidationErrors);
      return;
    }

    setSaving(true);

    try {
      await updatePassword(parsed.data as PasswordPayload);
      setForm({ current_password: "", password: "", password_confirmation: "" });
      setSaved(true);
      toast.success("Password updated successfully.");
    } catch (error) {
      if (error instanceof ApiError && error.status === 423) {
        onPasswordExpired();
        return;
      }

      setErrors(error instanceof ApiError ? error.errors ?? { form: error.message } : { form: "Unable to update password." });
      toast.error(error instanceof Error ? error.message : "Unable to update password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Password</CardTitle>
        <CardDescription>Use a strong password for staff accounts.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Field label="Current Password" error={fieldError(errors.current_password)}>
            <Input type="password" value={form.current_password} onChange={(event) => setForm({ ...form, current_password: event.target.value })} />
          </Field>
          <Field label="New Password" error={fieldError(errors.password)}>
            <Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            <p className="text-xs text-muted-foreground">Use at least 8 characters with uppercase, lowercase, number, and symbol.</p>
          </Field>
          <Field label="Confirm New Password" error={fieldError(errors.password_confirmation)}>
            <Input type="password" value={form.password_confirmation} onChange={(event) => setForm({ ...form, password_confirmation: event.target.value })} />
          </Field>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              Update Password
            </Button>
            {saved && <span className="text-sm text-emerald-600">Password updated.</span>}
          </div>
          {fieldError(errors.form) && <p className="text-sm text-destructive">{fieldError(errors.form)}</p>}
        </form>
      </CardContent>
    </Card>
  );
}

function TwoFactorSettings({ enabled, onSaved }: { enabled: boolean; onSaved: () => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"enable" | "disable" | "recovery" | null>(null);
  const [confirmationPassword, setConfirmationPassword] = useState("");
  const [qrSvg, setQrSvg] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  async function startSetup() {
    await withPasswordConfirmation("enable", performStartSetup);
  }

  async function performStartSetup() {
    setSaving(true);
    setError("");

    try {
      await enableTwoFactor();
      const [qr, recoveryCodes] = await Promise.all([fetchTwoFactorQrCode(), fetchTwoFactorRecoveryCodes()]);
      setQrSvg(qr.svg);
      setCodes(recoveryCodes);
      setSetupOpen(true);
      toast.success("Two-factor setup started.");
    } catch (error) {
      if (error instanceof ApiError && error.status === 423) throw error;
      setError(error instanceof Error ? error.message : "Unable to start two-factor setup.");
      toast.error(error instanceof Error ? error.message : "Unable to start two-factor setup.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmSetup() {
    setSaving(true);
    setError("");

    try {
      await confirmTwoFactor(code);
      setSetupOpen(false);
      setCode("");
      await onSaved();
      toast.success("Two-factor authentication enabled.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Invalid authentication code.");
      toast.error(error instanceof Error ? error.message : "Invalid authentication code.");
    } finally {
      setSaving(false);
    }
  }

  async function disable() {
    await withPasswordConfirmation("disable", performDisable);
  }

  async function performDisable() {
    setSaving(true);
    setError("");

    try {
      await disableTwoFactor();
      await onSaved();
      toast.success("Two-factor authentication disabled.");
    } catch (error) {
      if (error instanceof ApiError && error.status === 423) throw error;
      setError(error instanceof Error ? error.message : "Unable to disable two-factor authentication.");
      toast.error(error instanceof Error ? error.message : "Unable to disable two-factor authentication.");
    } finally {
      setSaving(false);
    }
  }

  async function regenerateCodes() {
    await withPasswordConfirmation("recovery", performRegenerateCodes);
  }

  async function performRegenerateCodes() {
    setSaving(true);
    setError("");

    try {
      await regenerateTwoFactorRecoveryCodes();
      setCodes(await fetchTwoFactorRecoveryCodes());
      setSetupOpen(true);
      toast.success("Recovery codes regenerated.");
    } catch (error) {
      if (error instanceof ApiError && error.status === 423) throw error;
      setError(error instanceof Error ? error.message : "Unable to regenerate recovery codes.");
      toast.error(error instanceof Error ? error.message : "Unable to regenerate recovery codes.");
    } finally {
      setSaving(false);
    }
  }

  async function withPasswordConfirmation(action: "enable" | "disable" | "recovery", callback: () => Promise<void>) {
    try {
      await callback();
    } catch (error) {
      if (error instanceof ApiError && error.status === 423) {
        setPendingAction(action);
        setPasswordOpen(true);
        return;
      }

      throw error;
    }
  }

  async function submitPasswordConfirmation() {
    if (!pendingAction) return;

    setSaving(true);
    setError("");

    try {
      await confirmPassword(confirmationPassword);
      setPasswordOpen(false);
      setConfirmationPassword("");

      if (pendingAction === "enable") await performStartSetup();
      if (pendingAction === "disable") await performDisable();
      if (pendingAction === "recovery") await performRegenerateCodes();
      setPendingAction(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to confirm password.");
      toast.error(error instanceof Error ? error.message : "Unable to confirm password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Two-Factor Authentication</CardTitle>
        <CardDescription>Add authenticator-app verification for staff logins.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium">{enabled ? "Two-factor authentication is enabled." : "Two-factor authentication is off."}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {enabled ? "Users will need their authenticator code after signing in." : "Enable it to protect admin, sub-admin, and worker accounts."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {enabled ? (
            <>
              <Button type="button" variant="outline" onClick={regenerateCodes} disabled={saving}>Recovery Codes</Button>
              <Button type="button" variant="destructive" onClick={disable} disabled={saving}>Disable 2FA</Button>
            </>
          ) : (
            <Button type="button" onClick={startSetup} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              Enable 2FA
            </Button>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>

      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Set up two-factor authentication</DialogTitle>
            <DialogDescription>Scan the QR code, then enter the six-digit code from your authenticator app.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-[180px_1fr]">
            <div className="rounded-lg border bg-white p-3" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <div className="space-y-3">
              <Field label="Authentication Code">
                <Input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" placeholder="123456" />
              </Field>
              {codes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recovery Codes</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-3 text-xs">
                    {codes.map((item) => <code key={item}>{item}</code>)}
                  </div>
                </div>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSetupOpen(false)}>Close</Button>
            <Button type="button" onClick={confirmSetup} disabled={saving || code.trim().length < 6}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Confirm 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm your password</DialogTitle>
            <DialogDescription>Fortify requires a recent password confirmation before changing two-factor settings.</DialogDescription>
          </DialogHeader>
          <Field label="Password">
            <Input
              type="password"
              value={confirmationPassword}
              onChange={(event) => setConfirmationPassword(event.target.value)}
              autoFocus
            />
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPasswordOpen(false)}>Cancel</Button>
            <Button type="button" onClick={submitPasswordConfirmation} disabled={saving || !confirmationPassword}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirm Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
    >
      {icon}
      {children}
    </button>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  const id = useMemo(() => label.toLowerCase().replaceAll(" ", "_"), [label]);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function fieldError(error: string[] | string | undefined) {
  return Array.isArray(error) ? error[0] : error;
}
