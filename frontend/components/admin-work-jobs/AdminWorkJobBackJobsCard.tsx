"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  CalendarClock,
  GitBranch,
  Loader2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import WorkerMultiSelect from "@/components/admin-appointments/WorkerMultiSelect";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
  createBackJob,
  fetchAdminWorkJob,
  fetchWorkJobWorkers,
} from "@/features/admin-work-jobs/admin-work-job-api";
import {
  backJobReasonLabel,
  backJobReasonOptions,
  formatWorkJobDate,
  formatWorkJobTime,
  workJobStatusLabel,
  workJobStatusStyle,
} from "@/features/admin-work-jobs/admin-work-job-utils";
import type {
  AdminBackJobForm,
  AdminBackJobReason,
  AdminWorkJob,
  AdminWorkJobStatus,
} from "@/features/admin-work-jobs/types";
import type { AdminWorker } from "@/features/admin-appointments/types";
import {
  addScheduleIssues,
  requiredDateSchema,
  requiredTimeSchema,
  zodIssuesToFieldErrors,
} from "@/features/forms/validation";
import { ApiError, type ApiValidationErrors } from "@/lib/api";
import { cn } from "@/lib/utils";

const backJobFormSchema = z
  .object({
    scheduled_date: requiredDateSchema("Scheduled date"),
    scheduled_time_from: requiredTimeSchema("Start time"),
    scheduled_time_until: requiredTimeSchema("End time"),
    worker_ids: z.array(z.number()).min(1, "Please assign at least one worker."),
    back_job_reason: z.enum([
      "unfinished_work",
      "warranty_claim",
      "quality_issue",
      "missing_parts",
      "customer_request",
      "other",
    ]),
    back_job_reason_other: z.string().trim().max(100, "Other reason must be 100 characters or fewer.").optional(),
    back_job_details: z
      .string()
      .trim()
      .min(5, "Details must be at least 5 characters.")
      .max(2000, "Details must be 2000 characters or fewer."),
    notes: z.string().trim().max(2000, "Internal notes must be 2000 characters or fewer.").optional(),
  })
  .superRefine((data, context) => {
    addScheduleIssues(context, {
      startDate: data.scheduled_date,
      startDateField: "scheduled_date",
      startTime: data.scheduled_time_from,
      startTimeField: "scheduled_time_from",
      endTime: data.scheduled_time_until,
      endTimeField: "scheduled_time_until",
      allowPastStartDate: true,
    });

    if (data.back_job_reason === "other" && !data.back_job_reason_other?.trim()) {
      context.addIssue({
        code: "custom",
        path: ["back_job_reason_other"],
        message: "Please enter the other reason.",
      });
    }
  });

export default function AdminWorkJobBackJobsCard({
  workJob,
  onUpdated,
  canCreate = true,
}: {
  workJob: AdminWorkJob;
  onUpdated: (workJob: AdminWorkJob) => void;
  canCreate?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [workers, setWorkers] = useState<AdminWorker[]>([]);
  const [form, setForm] = useState<AdminBackJobForm>(() => initialBackJobForm(workJob));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errors, setErrors] = useState<ApiValidationErrors>({});
  const [saving, setSaving] = useState(false);

  const canCreateBackJob = canCreate && ["in_progress", "completed"].includes(workJob.status);
  const reasonOptions = useMemo(() => {
    if (workJob.status === "in_progress") {
      return backJobReasonOptions.filter((option) => option.value === "unfinished_work");
    }

    return backJobReasonOptions;
  }, [workJob.status]);

  useEffect(() => {
    if (!open) return;

    setForm(initialBackJobForm(workJob));
    setErrors({});
    setConfirmOpen(false);
    fetchWorkJobWorkers().then((response) => setWorkers(response.data));
  }, [open, workJob]);

  function setField<K extends keyof AdminBackJobForm>(field: K, value: AdminBackJobForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field as string];
      delete next.work_job;
      return next;
    });
  }

  async function submit() {
    const parsed = backJobFormSchema.safeParse(form);

    if (!parsed.success) {
      setErrors(zodIssuesToFieldErrors(parsed.error.issues) as ApiValidationErrors);
      return;
    }

    setConfirmOpen(true);
  }

  async function scheduleBackJob() {
    const parsed = backJobFormSchema.safeParse(form);

    if (!parsed.success) {
      setConfirmOpen(false);
      setErrors(zodIssuesToFieldErrors(parsed.error.issues) as ApiValidationErrors);
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      await createBackJob(workJob.id, parsed.data as AdminBackJobForm);
      const refreshed = await fetchAdminWorkJob(workJob.id);
      onUpdated(refreshed.data);
      toast.success("Back job scheduled successfully.");
      setConfirmOpen(false);
      setOpen(false);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors ?? { work_job: error.message });
        toast.error(error.message);
      } else {
        setErrors({ work_job: "Unable to create back job." });
        toast.error("Unable to create back job.");
      }
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="size-4 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">
              Back Jobs
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Return visits linked to this work job.
          </p>
        </div>
        {canCreateBackJob && (
          <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Create
          </Button>
        )}
      </div>

      {workJob.parent_work_job && (
        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/60 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            Created From
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div>
              <Link
                href={`/dashboard/work-jobs/${workJob.parent_work_job.id}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {workJob.parent_work_job.work_job_number}
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {backJobReasonLabel(
                  workJob.back_job_reason,
                  workJob.back_job_reason_label,
                )}
              </p>
            </div>
            <WorkJobStatusBadge status={workJob.parent_work_job.status as AdminWorkJobStatus} />
          </div>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {workJob.back_jobs?.length ? (
          workJob.back_jobs.map((backJob) => (
            <div key={backJob.id} className="rounded-lg border bg-background p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/work-jobs/${backJob.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {backJob.work_job_number}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatWorkJobDate(backJob.scheduled_date)} ·{" "}
                    {formatWorkJobTime(backJob.scheduled_time_from)} -{" "}
                    {formatWorkJobTime(backJob.scheduled_time_until)}
                  </p>
                </div>
                <WorkJobStatusBadge status={backJob.status as AdminWorkJobStatus} />
              </div>
              <div className="mt-3 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {backJobReasonLabel(backJob.back_job_reason, backJob.back_job_reason_label)}
                </span>
                {backJob.back_job_details ? ` · ${backJob.back_job_details}` : null}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No back jobs created for this work job.
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create back job</DialogTitle>
            <DialogDescription>
              Schedule a return visit for unfinished work, warranty service, quality correction, or missing parts.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            {errorFor(errors, "work_job") && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {errorFor(errors, "work_job")}
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <FieldError label="Scheduled Date" error={errorFor(errors, "scheduled_date")}>
                <Input
                  type="date"
                  value={form.scheduled_date}
                  onChange={(event) => setField("scheduled_date", event.target.value)}
                />
              </FieldError>
              <FieldError label="From" error={errorFor(errors, "scheduled_time_from")}>
                <Input
                  type="time"
                  value={form.scheduled_time_from}
                  onChange={(event) => setField("scheduled_time_from", event.target.value)}
                />
              </FieldError>
              <FieldError label="Until" error={errorFor(errors, "scheduled_time_until")}>
                <Input
                  type="time"
                  value={form.scheduled_time_until}
                  onChange={(event) => setField("scheduled_time_until", event.target.value)}
                />
              </FieldError>
            </div>

            <WorkerMultiSelect
              workers={workers}
              value={form.worker_ids}
              onChange={(value) => setField("worker_ids", value)}
              label="Assigned Workers"
              error={errorFor(errors, "worker_ids")}
            />

            <FieldError label="Reason" error={errorFor(errors, "back_job_reason")}>
              <Select
                value={form.back_job_reason}
                onValueChange={(value) =>
                  setField("back_job_reason", value as AdminBackJobReason)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reasonOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                {reasonOptions.find((option) => option.value === form.back_job_reason)?.description}
              </p>
            </FieldError>

            {form.back_job_reason === "other" && (
              <FieldError label="Other Reason" error={errorFor(errors, "back_job_reason_other")}>
                <Input
                  value={form.back_job_reason_other}
                  onChange={(event) => setField("back_job_reason_other", event.target.value)}
                  placeholder="Short reason"
                />
              </FieldError>
            )}

            <FieldError label="Details" error={errorFor(errors, "back_job_details")}>
              <Textarea
                value={form.back_job_details}
                onChange={(event) => setField("back_job_details", event.target.value)}
                className="min-h-24 resize-none"
                placeholder="What needs to be done when the team returns?"
              />
            </FieldError>

            <FieldError label="Internal Notes" error={errorFor(errors, "notes")}>
              <Textarea
                value={form.notes}
                onChange={(event) => setField("notes", event.target.value)}
                className="min-h-20 resize-none"
                placeholder="Access notes, parts to bring, or special reminders..."
              />
            </FieldError>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={submit} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <CalendarClock className="size-4" />}
              Schedule Back Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Schedule this back job?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a linked return visit with the selected schedule and assigned workers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                void scheduleBackJob();
              }}
            >
              {saving ? "Scheduling..." : "Schedule Back Job"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function initialBackJobForm(workJob: AdminWorkJob): AdminBackJobForm {
  return {
    scheduled_date: nextDate(),
    scheduled_time_from: workJob.scheduled_time_from ?? "09:00",
    scheduled_time_until: workJob.scheduled_time_until ?? "11:00",
    worker_ids: workJob.workers.map((worker) => worker.id),
    back_job_reason: workJob.status === "in_progress" ? "unfinished_work" : "quality_issue",
    back_job_reason_other: "",
    back_job_details: "",
    notes: "",
  };
}

function nextDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function errorFor(errors: ApiValidationErrors, key: string) {
  const error = errors[key];
  if (Array.isArray(error)) return error[0];
  return error;
}

function FieldError({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function WorkJobStatusBadge({ status }: { status: AdminWorkJobStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("shrink-0", workJobStatusStyle[status] ?? "border-slate-200 bg-slate-50 text-slate-700")}
    >
      {workJobStatusLabel(status)}
    </Badge>
  );
}
