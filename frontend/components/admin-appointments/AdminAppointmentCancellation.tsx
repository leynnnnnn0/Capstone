"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import { cancelAppointment } from "@/features/admin-appointments/admin-appointment-api";
import type { AdminAppointment } from "@/features/admin-appointments/types";
import { CustomerStatus } from "@/features/customer/status";

const cancellableStatuses = [
  CustomerStatus.Pending,
  CustomerStatus.Confirmed,
  CustomerStatus.Rescheduled,
  CustomerStatus.OnTheWay,
  CustomerStatus.Reopened,
];

export function canCancelAppointment(status: AdminAppointment["status"]) {
  return cancellableStatuses.includes(status);
}

export default function AdminAppointmentCancellation({
  appointment,
  onUpdated,
  open,
  onOpenChange,
  onCloseAutoFocus,
}: {
  appointment: AdminAppointment;
  onUpdated: (appointment: AdminAppointment) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloseAutoFocus: (event: Event) => void;
}) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function cancel() {
    if (saving || !reason.trim()) return;

    setSaving(true);
    try {
      const response = await cancelAppointment(appointment.id, reason.trim());
      onOpenChange(false);
      setReason("");
      onUpdated(response.data);
      toast.success("Appointment cancelled.");
    } catch {
      toast.error("Unable to cancel appointment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!saving) {
        onOpenChange(nextOpen);
        if (!nextOpen) setReason("");
      }
    }}>
      <DialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader>
          <DialogTitle>Cancel appointment?</DialogTitle>
          <DialogDescription>Enter a reason for cancelling {appointment.appointment_number}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="appointment-cancellation-reason">Reason</Label>
          <Textarea
            id="appointment-cancellation-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={saving}
            required
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={() => {
            onOpenChange(false);
            setReason("");
          }}>
            Go Back
          </Button>
          <Button type="button" variant="destructive" disabled={saving || !reason.trim()} onClick={cancel}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Cancel Appointment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
