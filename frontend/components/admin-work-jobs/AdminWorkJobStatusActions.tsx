"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, PlayCircle, XCircle } from "lucide-react";

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
  markWorkJobCompleted,
  markWorkJobInProgress,
} from "@/features/admin-work-jobs/admin-work-job-api";
import {
  workJobStatusLabel,
} from "@/features/admin-work-jobs/admin-work-job-utils";
import type { AdminWorkJob, AdminWorkJobStatus } from "@/features/admin-work-jobs/types";

const flow: AdminWorkJobStatus[] = ["pending", "in_progress", "completed"];

export default function AdminWorkJobStatusActions({
  workJob,
  onUpdated,
}: {
  workJob: AdminWorkJob;
  onUpdated: (workJob: AdminWorkJob) => void;
}) {
  const [action, setAction] = useState<"advance" | "cancel" | null>(null);
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const nextStatus = nextWorkJobStatus(workJob.status as AdminWorkJobStatus);
  const canAdvance = Boolean(nextStatus);
  const canCancel = ["pending", "in_progress"].includes(workJob.status);

  if (!canAdvance && !canCancel) return null;

  async function submit() {
    setSaving(true);
    try {
      const currentAction = action;
      const response =
        action === "cancel"
          ? await cancelWorkJob(workJob.id, { remarks })
          : await advanceWorkJob(workJob.id, nextStatus, remarks);
      onUpdated(response.data);
      setAction(null);
      setRemarks("");
      toast.success(currentAction === "cancel" ? "Work job cancelled." : "Work job status updated.");
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
            {nextStatus === "in_progress" ? <PlayCircle className="size-4" /> : <CheckCircle2 className="size-4" />}
            Mark as {workJobStatusLabel(nextStatus)}
          </Button>
        )}
        {canCancel && (
          <Button type="button" variant="outline" onClick={() => setAction("cancel")} className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
            <XCircle className="size-4" />
            Cancel Work Job
          </Button>
        )}
      </div>
      <Dialog open={Boolean(action)} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === "cancel" ? "Cancel work job?" : `Mark as ${workJobStatusLabel(nextStatus ?? "")}`}</DialogTitle>
            <DialogDescription>
              {action === "cancel" ? "This will cancel the work job." : `This will update ${workJob.work_job_number}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="work_job_remarks">Remarks</Label>
            <Textarea
              id="work_job_remarks"
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              className="min-h-24 resize-none"
              placeholder={action === "cancel" ? "Reason or notes for cancelling..." : "Progress notes, worker update, or customer-visible details..."}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setAction(null);
              setRemarks("");
            }}>Go Back</Button>
            <Button type="button" variant={action === "cancel" ? "destructive" : "default"} onClick={submit} disabled={saving}>
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
  const index = flow.indexOf(status);
  if (index === -1 || index === flow.length - 1) return null;
  return flow[index + 1];
}

function advanceWorkJob(id: number, next: AdminWorkJobStatus | null, remarks: string) {
  if (next === "in_progress") return markWorkJobInProgress(id, { remarks });
  if (next === "completed") return markWorkJobCompleted(id, { remarks });
  throw new Error("No next work job status.");
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
