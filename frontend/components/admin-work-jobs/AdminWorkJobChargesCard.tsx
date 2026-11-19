"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  ReceiptText,
  Tags,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import NumericInput from "@/components/form/NumericInput";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  createWorkJobCharge,
  updateWorkJobCharge,
  type WorkJobChargePayload,
} from "@/features/admin-work-jobs/admin-work-job-api";
import type { AdminWorkJob } from "@/features/admin-work-jobs/types";
import { formatPeso } from "@/features/customer/customer-utils";
import type {
  CustomerWorkJobCharge,
  CustomerWorkJobChargeStatus,
  CustomerWorkJobChargeType,
} from "@/features/customer/types";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { positiveNumberStringSchema, zodIssuesToFieldErrors } from "@/features/forms/validation";

type ChargeForm = {
  title: string;
  description: string;
  type: CustomerWorkJobChargeType;
  amount: string;
};

type ChargeFormErrors = Partial<Record<keyof ChargeForm | "form", string>>;

const chargeTypes: Array<{ value: CustomerWorkJobChargeType; label: string }> = [
  { value: "service_fee", label: "Service Fee" },
  { value: "extra_material", label: "Extra Material" },
  { value: "extra_labor", label: "Extra Labor" },
  { value: "delivery", label: "Delivery" },
  { value: "adjustment", label: "Adjustment" },
  { value: "discount", label: "Discount" },
  { value: "other", label: "Other" },
];

const chargeSchema = z.object({
  title: z.string().trim().min(2, "Charge title is required.").max(120, "Charge title is too long."),
  description: z.string().trim().max(1000, "Description is too long.").optional(),
  type: z.enum(["service_fee", "extra_material", "extra_labor", "delivery", "adjustment", "discount", "other"]),
  amount: positiveNumberStringSchema("Amount", { max: 9999999 }),
});

export default function AdminWorkJobChargesCard({
  workJob,
  onUpdated,
  canApproveCharges,
}: {
  workJob: AdminWorkJob;
  onUpdated: (workJob: AdminWorkJob) => void;
  canApproveCharges: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState<CustomerWorkJobCharge | null>(null);
  const [form, setForm] = useState<ChargeForm>(() => defaultForm());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [chargeToApprove, setChargeToApprove] = useState<CustomerWorkJobCharge | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ChargeFormErrors>({});
  const charges = workJob.charges ?? [];
  const summary = workJob.payment_summary;
  const visibleCharges = useMemo(
    () => charges.filter((charge) => charge.status !== "cancelled" && charge.status !== "waived"),
    [charges],
  );
  const hasAdjustments = Boolean(
    (summary.approved_charges_total ?? 0) > 0 ||
      (summary.discount_total ?? 0) > 0 ||
      (summary.pending_charges_total ?? 0) > 0,
  );

  function openCreateDialog() {
    setEditingCharge(null);
    setForm(defaultForm());
    setError(null);
    setErrors({});
    setConfirmOpen(false);
    setOpen(true);
  }

  function openEditDialog(charge: CustomerWorkJobCharge) {
    setEditingCharge(charge);
    setForm(formFromCharge(charge));
    setError(null);
    setErrors({});
    setConfirmOpen(false);
    setOpen(true);
  }

  async function submit() {
    const parsed = chargeSchema.safeParse(form);

    if (!parsed.success) {
      setErrors(zodIssuesToFieldErrors<keyof ChargeForm | "form">(parsed.error.issues));
      return;
    }

    setConfirmOpen(true);
  }

  async function saveCharge() {
    if (chargeToApprove) {
      setSaving(true);
      try {
        const response = await updateWorkJobCharge(workJob.id, chargeToApprove.id, { status: "approved" });
        onUpdated(response.data);
        toast.success("Charge approved successfully.");
        setChargeToApprove(null);
        setConfirmOpen(false);
      } catch (error) {
        const message = errorMessage(error);
        toast.error(message);
        setConfirmOpen(false);
      } finally {
        setSaving(false);
      }
      return;
    }

    const parsed = chargeSchema.safeParse(form);

    if (!parsed.success) {
      setConfirmOpen(false);
      setErrors(zodIssuesToFieldErrors<keyof ChargeForm | "form">(parsed.error.issues));
      return;
    }

    const payload: WorkJobChargePayload = {
      title: parsed.data.title,
      description: parsed.data.description || undefined,
      type: parsed.data.type,
      amount: Number(parsed.data.amount),
      requires_customer_approval: true,
    };

    setSaving(true);
    setError(null);
    setErrors({});
    try {
      const response = editingCharge
        ? await updateWorkJobCharge(workJob.id, editingCharge.id, payload)
        : await createWorkJobCharge(workJob.id, payload);

      onUpdated(response.data);
      toast.success(editingCharge ? "Charge updated successfully." : "Charge added successfully.");
      setConfirmOpen(false);
      setOpen(false);
    } catch (error) {
      const message = errorMessage(error);
      setError(message);
      toast.error(message);
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
            <ReceiptText className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Charges</h2>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Add service fees, extra materials, delivery fees, or discounts before collecting payment.
          </p>
        </div>
        <Button type="button" size="sm" className="gap-2" onClick={openCreateDialog}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      {hasAdjustments && (
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border bg-muted/30 p-3 text-xs">
          <AmountTile label="Approved Fees" value={summary.approved_charges_total ?? 0} />
          <AmountTile label="Discounts" value={summary.discount_total ?? 0} discount />
          <AmountTile label="Pending" value={summary.pending_charges_total ?? 0} muted />
        </div>
      )}

      <div className="mt-4 space-y-2">
        {visibleCharges.length > 0 ? (
          visibleCharges.map((charge) => (
            <div key={charge.id} className="rounded-lg border bg-muted/20 p-3 text-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{charge.title}</p>
                    <Badge variant="outline" className={statusClassName(charge.status)}>
                      <span aria-hidden="true" className="size-1.5 rounded-full bg-current opacity-80" />
                      {charge.status_label}
                    </Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">{charge.type_label} · customer-visible</p>
                  {charge.description && (
                    <p className="mt-2 rounded-md bg-background px-2 py-1 text-muted-foreground">{charge.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-start gap-2">
                  <p
                    className={cn(
                      "pt-1 text-right font-semibold",
                      charge.type === "discount" ? "text-emerald-600" : "text-foreground",
                    )}
                  >
                    {charge.type === "discount" ? "-" : ""}
                    {formatPeso(charge.amount)}
                  </p>
                  {canApproveCharges && (
                    <>
                      {charge.status === "pending_approval" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setChargeToApprove(charge);
                            setConfirmOpen(true);
                          }}
                        >
                          Approve
                        </Button>
                      )}
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => openEditDialog(charge)}>
                        <Pencil className="size-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No extra charges yet. Payments are based on the approved quotation total.
          </div>
        )}
      </div>

      <Separator className="my-4" />
      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Tags className="size-4 text-primary" />
          Payable total
        </div>
        <p className="font-semibold text-foreground">{formatPeso(summary.payable_total ?? summary.quotation_total)}</p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ReceiptText className="size-4 text-primary" />
              {editingCharge ? "Edit charge" : "Add charge"}
            </DialogTitle>
            <DialogDescription>
              {canApproveCharges
                ? "Charges you add will appear on the customer's bill and update the total amount due."
                : "Charges you add will appear as pending until approved, then update the customer's bill."}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="charge-title">Title</Label>
              <Input
                id="charge-title"
                value={form.title}
                onChange={(event) => {
                  setForm((current) => ({ ...current, title: event.target.value }));
                  setErrors((current) => ({ ...current, title: undefined }));
                }}
                placeholder="Extra sealant, delivery fee, site protection..."
              />
              <FieldError message={errors.title} />
            </div>

            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, type: value as CustomerWorkJobChargeType }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chargeTypes.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="charge-amount">Amount</Label>
              <NumericInput
                id="charge-amount"
                value={form.amount}
                decimalScale={2}
                onValueChange={(value) => {
                  setForm((current) => ({ ...current, amount: value }));
                  setErrors((current) => ({ ...current, amount: undefined }));
                }}
              />
              <FieldError message={errors.amount} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="charge-description">Description</Label>
              <Textarea
                id="charge-description"
                value={form.description}
                onChange={(event) => {
                  setForm((current) => ({ ...current, description: event.target.value }));
                  setErrors((current) => ({ ...current, description: undefined }));
                }}
                placeholder="Short reason for the extra fee or discount."
                className="min-h-20 resize-none"
              />
              <FieldError message={errors.description} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving || !form.title.trim() || Number(form.amount) <= 0}
              onClick={submit}
            >
              {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}
              Save Charge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {chargeToApprove ? "Approve this charge?" : editingCharge ? "Save charge changes?" : "Add this charge?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {chargeToApprove
                ? "Approving this charge will add it to the customer balance."
                : !canApproveCharges && !editingCharge
                  ? "This charge will stay pending until an admin or owner approves it."
                : "This will update the work job balance and may change what the customer can pay."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                void saveCharge();
              }}
            >
              {saving ? "Saving..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="text-xs text-destructive">{message}</p>;
}

function defaultForm(): ChargeForm {
  return {
    title: "",
    description: "",
    type: "service_fee",
    amount: "",
  };
}

function formFromCharge(charge: CustomerWorkJobCharge): ChargeForm {
  return {
    title: charge.title,
    description: charge.description ?? "",
    type: charge.type,
    amount: String(charge.amount),
  };
}

function AmountTile({
  label,
  value,
  discount,
  muted,
}: {
  label: string;
  value: number;
  discount?: boolean;
  muted?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-medium", discount ? "text-emerald-600" : muted ? "text-muted-foreground" : "text-foreground")}>
        {discount && value > 0 ? "-" : ""}
        {formatPeso(value)}
      </p>
    </div>
  );
}

function statusClassName(status: CustomerWorkJobChargeStatus) {
  if (status === "approved") return "border-transparent bg-emerald-600 text-white";
  if (status === "pending_approval") return "border-transparent bg-amber-500 text-white";
  if (status === "waived") return "border-transparent bg-slate-600 text-white";
  return "border-transparent bg-red-600 text-white";
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;

  return "Charge could not be saved.";
}
