"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Truck, Wrench, XCircle } from "lucide-react";

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
import {
  cancelAppointment,
  markAppointmentCompleted,
  markAppointmentInProgress,
  markAppointmentOnTheWay,
} from "@/features/admin-appointments/admin-appointment-api";
import type { AdminAppointment, AdminAppointmentStatus } from "@/features/admin-appointments/types";

const flow: AdminAppointmentStatus[] = ["confirmed", "on_the_way", "in_progress", "completed"];

export default function AdminStatusActions({
  appointment,
  onUpdated,
}: {
  appointment: AdminAppointment;
  onUpdated: (appointment: AdminAppointment) => void;
}) {
  const [action, setAction] = useState<"advance" | "cancel" | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const nextStatus = nextAppointmentStatus(appointment.status);
  const canAdvance = Boolean(nextStatus);
  const canCancel = ["confirmed", "on_the_way"].includes(appointment.status);

  if (!canAdvance && !canCancel) return null;

  async function submit() {
    if (action === "cancel" && !reason.trim()) return;

    setSaving(true);
    try {
      const response =
        action === "cancel"
          ? await cancelAppointment(appointment.id, reason)
          : await advanceAppointment(appointment.id, nextStatus);
      onUpdated(response.data);
      setAction(null);
      setReason("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-5 shadow-sm">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">Update Status</h2>
        <p className="mt-1 text-xs text-muted-foreground">Advance this appointment through the workflow.</p>
      </div>
      <StatusFlowIndicator current={appointment.status} />
      <div className="flex flex-col gap-2">
        {canAdvance && nextStatus && (
          <Button type="button" variant="outline" onClick={() => setAction("advance")} className="w-full gap-2">
            {statusIcon(nextStatus)}
            Mark as {statusLabel(nextStatus)}
          </Button>
        )}
        {canCancel && (
          <Button type="button" variant="outline" onClick={() => setAction("cancel")} className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
            <XCircle className="size-4" />
            Cancel Appointment
          </Button>
        )}
      </div>
      <Dialog open={Boolean(action)} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === "cancel" ? "Cancel appointment?" : `Mark as ${statusLabel(nextStatus)}`}</DialogTitle>
            <DialogDescription>
              {action === "cancel" ? "Provide a reason before cancelling this appointment." : `This will update ${appointment.appointment_number}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="status_reason">{action === "cancel" ? "Reason" : "Remarks"}</Label>
            <Textarea id="status_reason" value={reason} onChange={(event) => setReason(event.target.value)} className="resize-none" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAction(null)}>Go Back</Button>
            <Button type="button" variant={action === "cancel" ? "destructive" : "default"} onClick={submit} disabled={saving || (action === "cancel" && !reason.trim())}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function nextAppointmentStatus(status: AdminAppointmentStatus) {
  const index = flow.indexOf(status);
  if (index === -1 || index === flow.length - 1) return null;
  return flow[index + 1];
}

function advanceAppointment(id: number, next: AdminAppointmentStatus | null) {
  if (next === "on_the_way") return markAppointmentOnTheWay(id);
  if (next === "in_progress") return markAppointmentInProgress(id);
  if (next === "completed") return markAppointmentCompleted(id);
  throw new Error("No next appointment status.");
}

function statusLabel(status: AdminAppointmentStatus | null) {
  if (status === "on_the_way") return "On the Way";
  if (status === "in_progress") return "In Progress";
  if (status === "completed") return "Completed";
  return "Confirmed";
}

function statusIcon(status: AdminAppointmentStatus) {
  if (status === "on_the_way") return <Truck className="size-4" />;
  if (status === "in_progress") return <Wrench className="size-4" />;
  return <CheckCircle2 className="size-4" />;
}

function StatusFlowIndicator({ current }: { current: AdminAppointmentStatus }) {
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
            <span className={`text-center text-[10px] ${active ? "font-semibold text-primary" : "text-muted-foreground"}`}>{statusLabel(status)}</span>
          </div>
        );
      })}
    </div>
  );
}
