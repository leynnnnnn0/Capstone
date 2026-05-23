"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Banknote, CreditCard, Loader2, WalletCards } from "lucide-react";

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
import { recordManualWorkJobPayment } from "@/features/admin-work-jobs/admin-work-job-api";
import type { AdminWorkJob } from "@/features/admin-work-jobs/types";
import { formatPeso } from "@/features/customer/customer-utils";
import type { CustomerPaymentMethod, CustomerPaymentType } from "@/features/customer/types";
import { ApiError } from "@/lib/api";

type ManualPaymentForm = {
  type: CustomerPaymentType;
  method: Exclude<CustomerPaymentMethod, "paypal">;
  amount: string;
  paid_at: string;
  remarks: string;
};

const methodOptions: Array<{ value: ManualPaymentForm["method"]; label: string }> = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" },
];

export default function AdminWorkJobPaymentsCard({
  workJob,
  onUpdated,
}: {
  workJob: AdminWorkJob;
  onUpdated: (workJob: AdminWorkJob) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ManualPaymentForm>(() => defaultForm(workJob));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const summary = workJob.payment_summary;
  const payableTotal = summary.payable_total ?? summary.quotation_total;
  const hasAdjustments = Boolean(
    (summary.approved_charges_total ?? 0) > 0 ||
      (summary.discount_total ?? 0) > 0 ||
      (summary.pending_charges_total ?? 0) > 0,
  );
  const paidPayments = (workJob.payments ?? []).filter((payment) => payment.status === "paid");
  const options = useMemo(() => paymentTypeOptions(workJob), [workJob]);
  const canRecord = summary.can_accept_payment && workJob.status !== "cancelled";

  useEffect(() => {
    if (open) setForm(defaultForm(workJob));
  }, [open, workJob]);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const response = await recordManualWorkJobPayment(workJob.id, {
        type: form.type,
        method: form.method,
        amount: Number(form.amount),
        paid_at: form.paid_at || undefined,
        remarks: form.remarks || undefined,
      });
      onUpdated(response.data);
      setOpen(false);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <WalletCards className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Payments</h2>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Track PayPal, cash, and bank transfer payments for this work job.
          </p>
        </div>
        <Badge
          variant="outline"
          className={summary.is_fully_paid ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}
        >
          {summary.is_fully_paid ? "Paid" : "Open"}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border bg-muted/30 p-3 text-xs">
        <AmountTile label="Total" value={payableTotal} />
        <AmountTile label="Paid" value={summary.paid_amount} />
        <AmountTile label="Balance" value={summary.remaining_amount} strong />
      </div>

      {hasAdjustments && (
        <div className="mt-3 rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
          <div className="flex justify-between gap-3">
            <span>Approved quotation</span>
            <span className="font-medium text-foreground">{formatPeso(summary.base_quotation_total ?? summary.quotation_total)}</span>
          </div>
          {(summary.approved_charges_total ?? 0) > 0 && (
            <div className="mt-1 flex justify-between gap-3">
              <span>Additional approved charges</span>
              <span className="font-medium text-foreground">{formatPeso(summary.approved_charges_total ?? 0)}</span>
            </div>
          )}
          {(summary.discount_total ?? 0) > 0 && (
            <div className="mt-1 flex justify-between gap-3">
              <span>Discounts</span>
              <span className="font-medium text-emerald-600">-{formatPeso(summary.discount_total ?? 0)}</span>
            </div>
          )}
          {(summary.pending_charges_total ?? 0) > 0 && (
            <div className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-amber-700">
              Pending charges not yet payable: {formatPeso(summary.pending_charges_total ?? 0)}
            </div>
          )}
        </div>
      )}

      {summary.down_payment_required && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Required down payment: {formatPeso(summary.down_payment_amount)} ({summary.down_payment_percentage}%).
          {summary.down_payment_remaining_amount > 0
            ? ` Still due: ${formatPeso(summary.down_payment_remaining_amount)}.`
            : " Down payment complete."}
        </div>
      )}

      <Button
        type="button"
        className="mt-4 w-full gap-2"
        variant={canRecord ? "default" : "outline"}
        disabled={!canRecord}
        onClick={() => setOpen(true)}
      >
        <Banknote className="size-4" />
        Record Manual Payment
      </Button>

      {!canRecord && (
        <p className="mt-2 text-xs text-muted-foreground">
          {payableTotal <= 0
            ? "No approved payable quotation items yet."
            : summary.remaining_amount <= 0
              ? "This work job is fully paid."
              : "Payments are closed for this work job."}
        </p>
      )}

      {paidPayments.length > 0 && (
        <>
          <Separator className="my-4" />
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Payment History</p>
            {paidPayments.map((payment) => (
              <div key={payment.id} className="rounded-lg border bg-muted/30 p-3 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{payment.type_label}</p>
                    <p className="mt-0.5 text-muted-foreground">
                      {payment.method_label}
                      {payment.creator?.full_name ? ` · by ${payment.creator.full_name}` : ""}
                    </p>
                  </div>
                  <p className="font-semibold text-emerald-600">{formatPeso(payment.amount)}</p>
                </div>
                {payment.remarks && (
                  <p className="mt-2 rounded-md bg-background px-2 py-1 text-muted-foreground">{payment.remarks}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="size-4 text-primary" />
              Record payment
            </DialogTitle>
            <DialogDescription>
              Use this when the customer paid outside PayPal, such as cash or bank transfer.
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
              <Label>Payment Type</Label>
              <Select
                value={form.type}
                onValueChange={(value) => {
                  const nextType = value as CustomerPaymentType;
                  const option = options.find((item) => item.value === nextType);
                  setForm((current) => ({
                    ...current,
                    type: nextType,
                    amount: option ? String(option.amount) : current.amount,
                  }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} · {formatPeso(option.amount)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Method</Label>
              <Select
                value={form.method}
                onValueChange={(value) => setForm((current) => ({ ...current, method: value as ManualPaymentForm["method"] }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {methodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Amount</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              />
            </div>

            <div className="grid gap-1.5">
              <Label>Paid Date</Label>
              <Input
                type="date"
                value={form.paid_at}
                onChange={(event) => setForm((current) => ({ ...current, paid_at: event.target.value }))}
              />
            </div>

            <div className="grid gap-1.5">
              <Label>Remarks</Label>
              <Textarea
                value={form.remarks}
                onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))}
                placeholder="Receipt number, collector name, or payment note."
                className="min-h-20 resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={saving || Number(form.amount) <= 0} onClick={submit}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function defaultForm(workJob: AdminWorkJob): ManualPaymentForm {
  const option = paymentTypeOptions(workJob)[0];

  return {
    type: option?.value ?? "full_payment",
    method: "cash",
    amount: option ? String(option.amount) : "",
    paid_at: new Date().toISOString().slice(0, 10),
    remarks: "",
  };
}

function paymentTypeOptions(workJob: AdminWorkJob) {
  const summary = workJob.payment_summary;
  const options: Array<{ value: CustomerPaymentType; label: string; amount: number }> = [];

  if (!summary.can_accept_payment || summary.remaining_amount <= 0) return options;

  if (summary.down_payment_required && summary.down_payment_remaining_amount > 0) {
    options.push({
      value: "down_payment",
      label: "Down Payment",
      amount: summary.down_payment_remaining_amount,
    });
  }

  if (summary.next_due_type === "additional_charge") {
    options.push({
      value: "additional_charge",
      label: "Additional Charge",
      amount: summary.additional_charge_amount ?? summary.next_due_amount ?? summary.remaining_amount,
    });

    return options;
  }

  if (!summary.down_payment_required) {
    options.push({
      value: "full_payment",
      label: "Full Payment",
      amount: summary.remaining_amount,
    });
  } else if (summary.down_payment_remaining_amount <= 0) {
    options.push({
      value: "final_payment",
      label: "Final Payment",
      amount: summary.remaining_amount,
    });
  }

  if (
    summary.down_payment_required &&
    summary.down_payment_remaining_amount > 0 &&
    summary.remaining_amount > summary.down_payment_remaining_amount
  ) {
    options.push({
      value: "full_payment",
      label: "Full Payment",
      amount: summary.remaining_amount,
    });
  }

  return options;
}

function AmountTile({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={strong ? "mt-1 font-semibold text-primary" : "mt-1 font-medium text-foreground"}>
        {formatPeso(value)}
      </p>
    </div>
  );
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;

  return "Payment could not be recorded.";
}
