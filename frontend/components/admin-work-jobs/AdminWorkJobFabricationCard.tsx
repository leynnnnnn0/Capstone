"use client";

import { useState } from "react";
import { CalendarDays, Factory, Loader2, Pencil, TimerReset } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateWorkJobFabrication } from "@/features/admin-work-jobs/admin-work-job-api";
import type { AdminWorkJob } from "@/features/admin-work-jobs/types";
import {
  fabricationEtaLabel,
  fabricationStatusOptions,
} from "@/features/customer/fabrication";
import type { CustomerFabricationStatus } from "@/features/customer/types";
import { todayIsoDate } from "@/features/forms/validation";
import { ApiError } from "@/lib/api";

type FormState = {
  status: CustomerFabricationStatus;
  expected_completion_date: string;
  notes: string;
};

export default function AdminWorkJobFabricationCard({
  workJob,
  onUpdated,
  canManage,
}: {
  workJob: AdminWorkJob;
  onUpdated: (workJob: AdminWorkJob) => void;
  canManage: boolean;
}) {
  const fabrication = workJob.fabrication;
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>(() => toForm(workJob));

  function openEditor() {
    setForm(toForm(workJob));
    setError("");
    setOpen(true);
  }

  function setField<Key extends keyof FormState>(field: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  }

  async function save() {
    const needsEstimate = !["not_required", "ready_for_installation"].includes(form.status);

    if (needsEstimate && !form.expected_completion_date) {
      setError("Set an expected completion date so the customer knows when to check back.");
      return;
    }
    if (form.status === "on_hold" && !form.notes.trim()) {
      setError("Add a customer-visible reason before putting fabrication on hold.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const response = await updateWorkJobFabrication(workJob.id, {
        status: form.status,
        expected_completion_date: form.expected_completion_date || null,
        notes: form.notes.trim() || null,
      });
      onUpdated(response.data);
      setOpen(false);
      toast.success("Fabrication progress updated.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to update fabrication progress.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Factory className="size-4 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">
              Fabrication Progress
            </h2>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold tracking-tight text-foreground">{fabrication.status_label}</p>
            <Badge variant="outline">{fabrication.progress_percentage}%</Badge>
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {fabrication.description}
          </p>
        </div>
        {canManage && (
          <Button type="button" variant="outline" size="sm" className="shrink-0 gap-2" onClick={openEditor}>
            <Pencil className="size-3.5" />
            Update
          </Button>
        )}
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${fabrication.progress_percentage}%` }}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <InfoTile icon={TimerReset} label="Customer ETA" value={fabricationEtaLabel(fabrication)} />
        <InfoTile
          icon={CalendarDays}
          label="Expected Completion"
          value={formatDate(fabrication.expected_completion_date)}
        />
      </div>

      {fabrication.notes && (
        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/70 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Customer-visible update</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">{fabrication.notes}</p>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Update fabrication progress</DialogTitle>
            <DialogDescription>
              This status, estimate, and note are shown immediately in the customer portal.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Current stage</Label>
              <Select value={form.status} onValueChange={(value) => setField("status", value as CustomerFabricationStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fabricationStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.status !== "not_required" && form.status !== "ready_for_installation" && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="fabrication_expected_date">Expected completion date</Label>
                <Input
                  id="fabrication_expected_date"
                  type="date"
                  min={todayIsoDate()}
                  value={form.expected_completion_date}
                  onChange={(event) => setField("expected_completion_date", event.target.value)}
                />
                <p className="text-xs text-muted-foreground">The portal automatically turns this into “expected in 3 days,” “2 days,” and “1 day.”</p>
              </div>
            )}

            {form.status !== "not_required" && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="fabrication_update_note">Customer-visible update</Label>
                <Textarea
                  id="fabrication_update_note"
                  value={form.notes}
                  onChange={(event) => setField("notes", event.target.value)}
                  className="min-h-28 resize-none"
                  maxLength={2000}
                  placeholder="What was completed, what happens next, or why the estimate changed."
                />
                <p className="text-right text-xs text-muted-foreground">{form.notes.length}/2000</p>
              </div>
            )}
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="button" onClick={save} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Save Customer Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function toForm(workJob: AdminWorkJob): FormState {
  return {
    status: workJob.fabrication.status,
    expected_completion_date: workJob.fabrication.expected_completion_date ?? "",
    notes: workJob.fabrication.notes ?? "",
  };
}

function InfoTile({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5 text-primary" />
        {label}
      </div>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "Not set";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
