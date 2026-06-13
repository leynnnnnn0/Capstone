"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, PlayCircle, RotateCcw, Truck, UserX, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  cancelWorkJob,
  confirmWorkJob,
  markWorkJobNoShow,
  markWorkJobCompleted,
  markWorkJobInProgress,
  markWorkJobOnTheWay,
  reopenWorkJob,
} from "@/features/admin-work-jobs/admin-work-job-api";
import {
  workJobStatusLabel,
} from "@/features/admin-work-jobs/admin-work-job-utils";
import { CustomerStatus } from "@/features/customer/status";
import type { AdminWorkJob, AdminWorkJobStatus } from "@/features/admin-work-jobs/types";

const flow: AdminWorkJobStatus[] = [
  CustomerStatus.Confirmed,
  CustomerStatus.OnTheWay,
  CustomerStatus.InProgress,
  CustomerStatus.Completed,
];

export default function AdminWorkJobStatusActions({
  workJob,
  onUpdated,
}: {
  workJob: AdminWorkJob;
  onUpdated: (workJob: AdminWorkJob) => void;
}) {
  const [action, setAction] = useState<"advance" | "cancel" | "reopen" | "no_show" | null>(null);
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const nextStatus = nextWorkJobStatus(workJob.status as AdminWorkJobStatus);
  const canAdvance = Boolean(nextStatus);
  const canCancel = [
    CustomerStatus.Pending,
    CustomerStatus.Confirmed,
    CustomerStatus.Rescheduled,
    CustomerStatus.OnTheWay,
  ].includes(workJob.status);
  const canReopen = workJob.status === CustomerStatus.Cancelled;
  const canMarkNoShow = [
    CustomerStatus.OnTheWay,
  ].includes(workJob.status);

  if (!canAdvance && !canCancel && !canReopen && !canMarkNoShow) return null;

  async function submit() {
    setSaving(true);
    try {
      const currentAction = action;
      const response =
        action === "cancel"
          ? await cancelWorkJob(workJob.id, { remarks })
          : action === "reopen"
            ? await reopenWorkJob(workJob.id, { remarks })
          : action === "no_show"
            ? await markWorkJobNoShow(workJob.id, { remarks })
          : await advanceWorkJob(workJob.id, nextStatus, remarks);
      onUpdated(response.data);
      setAction(null);
      setRemarks("");
      toast.success(
        currentAction === "cancel"
          ? "Work job cancelled."
          : currentAction === "reopen"
            ? "Work job reopened."
            : currentAction === "no_show"
              ? "Work job marked as no show."
              : "Work job status updated.",
      );
    } catch {
      toast.error("Unable to update work job status.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-5 shadow-sm">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">Update Status</h2>
        <p className="mt-1 text-xs text-muted-foreground">Advance this work job through production.</p>
      </div>
      <StatusFlowIndicator current={workJob.status as AdminWorkJobStatus} />
      <div className="flex flex-col gap-2">
        {canAdvance && nextStatus && (
          <Button type="button" variant="outline" onClick={() => setAction("advance")} className="w-full gap-2">
            {statusIcon(nextStatus)}
            Mark as {workJobStatusLabel(nextStatus)}
          </Button>
        )}
        {canMarkNoShow && (
          <Button type="button" variant="outline" onClick={() => setAction("no_show")} className="w-full gap-2 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800">
            <UserX className="size-4" />
            Mark No Show
          </Button>
        )}
        {canCancel && (
          <Button type="button" variant="outline" onClick={() => setAction("cancel")} className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
            <XCircle className="size-4" />
            Cancel Work Job
          </Button>
        )}
        {canReopen && (
          <Button type="button" variant="outline" onClick={() => setAction("reopen")} className="w-full gap-2">
            <RotateCcw className="size-4" />
            Reopen Work Job
          </Button>
        )}
      </div>
      <Dialog open={Boolean(action)} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "cancel"
                ? "Cancel work job?"
                : action === "reopen"
                  ? "Reopen work job?"
                  : action === "no_show"
                    ? "Mark as no show?"
                    : `Mark as ${workJobStatusLabel(nextStatus ?? "")}`}
            </DialogTitle>
            <DialogDescription>
              {action === "cancel"
                ? "This will cancel the work job."
                : action === "reopen"
                  ? "This will reopen the work job after an incorrect cancellation."
                  : action === "no_show"
                    ? "Use this when the work job visit could not proceed because the customer was unavailable."
                    : `This will update ${workJob.work_job_number}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="work_job_remarks">{action === "cancel" || action === "no_show" ? "Reason" : "Remarks"}</Label>
            <Textarea
              id="work_job_remarks"
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              className="min-h-24 resize-none"
              placeholder={
                action === "cancel"
                  ? "Reason or notes for cancelling..."
                  : action === "no_show"
                    ? "Reason or notes for marking no show..."
                    : "Progress notes, worker update, or customer-visible details..."
              }
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setAction(null);
              setRemarks("");
            }}>Go Back</Button>
            <Button type="button" variant={action === "cancel" ? "destructive" : "default"} onClick={submit} disabled={saving || ((action === "cancel" || action === "no_show") && !remarks.trim())}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function nextWorkJobStatus(status: AdminWorkJobStatus) {
  if (
    status === CustomerStatus.Pending ||
    status === CustomerStatus.Reopened ||
    status === CustomerStatus.Rescheduled
  ) {
    return CustomerStatus.Confirmed;
  }
  const index = flow.indexOf(status);
  if (index === -1 || index === flow.length - 1) return null;
  return flow[index + 1];
}

function advanceWorkJob(id: number, next: AdminWorkJobStatus | null, remarks: string) {
  if (next === CustomerStatus.Confirmed) return confirmWorkJob(id, { remarks });
  if (next === CustomerStatus.OnTheWay) return markWorkJobOnTheWay(id, { remarks });
  if (next === CustomerStatus.InProgress) return markWorkJobInProgress(id, { remarks });
  if (next === CustomerStatus.Completed) return markWorkJobCompleted(id, { remarks });
  throw new Error("No next work job status.");
}

function statusIcon(status: AdminWorkJobStatus) {
  if (status === CustomerStatus.Confirmed) return <CheckCircle2 className="size-4" />;
  if (status === CustomerStatus.OnTheWay) return <Truck className="size-4" />;
  if (status === CustomerStatus.InProgress) return <PlayCircle className="size-4" />;
  return <CheckCircle2 className="size-4" />;
}

function StatusFlowIndicator({ current }: { current: AdminWorkJobStatus }) {
  const currentIndex = flow.indexOf(current);

  return (
    <div className="flex items-center gap-1">
      {flow.map((status, index) => {
        const active = index === currentIndex;
        const done = currentIndex > index;
        return (
          <div key={status} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-center">
              <div className={`h-0.5 flex-1 ${index === 0 ? "invisible" : done || active ? "bg-primary" : "bg-muted"}`} />
              <div className={`size-2.5 rounded-full border-2 ${active || done ? "border-primary bg-primary" : "border-muted bg-background"}`} />
              <div className={`h-0.5 flex-1 ${index === flow.length - 1 ? "invisible" : done ? "bg-primary" : "bg-muted"}`} />
            </div>
            <span className={`text-center text-[10px] ${active ? "font-semibold text-primary" : "text-muted-foreground"}`}>{workJobStatusLabel(status)}</span>
          </div>
        );
      })}
    </div>
  );
}
