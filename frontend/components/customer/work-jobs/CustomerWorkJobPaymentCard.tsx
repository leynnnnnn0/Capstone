"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { AlertCircle, CreditCard, WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  captureCustomerWorkJobPaypalOrder,
  createCustomerWorkJobPaypalOrder,
  getCustomerPayPalConfig,
  type CustomerPayPalConfig,
} from "@/features/customer/customer-api";
import { formatPeso } from "@/features/customer/customer-utils";
import type { CustomerPaymentType, CustomerWorkJob } from "@/features/customer/types";
import { ApiError } from "@/lib/api";

type PaymentAction = {
  type: CustomerPaymentType;
  title: string;
  description: string;
  amount: number;
  primary?: boolean;
};

export default function CustomerWorkJobPaymentCard({
  workJob,
  onPaid,
}: {
  workJob: CustomerWorkJob;
  onPaid: (workJob: CustomerWorkJob) => void;
}) {
  const [config, setConfig] = useState<CustomerPayPalConfig | null>(null);
  const [selectedAction, setSelectedAction] = useState<PaymentAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const paymentIdRef = useRef<number | null>(null);
  const captureInFlightRef = useRef(false);

  useEffect(() => {
    getCustomerPayPalConfig()
      .then(setConfig)
      .catch(() => setConfig({ enabled: false, client_id: null, currency: "PHP", mode: "sandbox" }));
  }, []);

  const summary = workJob.payment_summary;
  const payableTotal = summary.payable_total ?? summary.quotation_total;
  const visibleCharges = (workJob.charges ?? []).filter(
    (charge) => charge.requires_customer_approval && charge.status !== "cancelled" && charge.status !== "waived",
  );
  const hasAdjustments = Boolean(
    (summary.approved_charges_total ?? 0) > 0 ||
      (summary.discount_total ?? 0) > 0 ||
      (summary.pending_charges_total ?? 0) > 0,
  );
  const actions = useMemo(() => paymentActions(workJob), [workJob]);
  const paidPayments = (workJob.payments ?? []).filter((payment) => payment.status === "paid");
  const canPayOnline = Boolean(config?.enabled && config.client_id && summary.can_accept_payment);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <WalletCards className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-slate-950">Payments</h2>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {summary.down_payment_required
              ? `${summary.down_payment_percentage}% down payment is required before installation continues.`
              : "Pay the balance online, or coordinate cash payment with SOG."}
          </p>
        </div>
        <Badge
          variant="outline"
          className={summary.is_fully_paid ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}
        >
          {summary.is_fully_paid ? "Paid" : "Open"}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border bg-slate-50 p-3 text-xs">
        <AmountTile label="Total" value={payableTotal} />
        <AmountTile label="Paid" value={summary.paid_amount} />
        <AmountTile label="Balance" value={summary.remaining_amount} strong />
      </div>

      {hasAdjustments && (
        <div className="mt-3 rounded-lg border bg-slate-50 p-3 text-xs text-slate-500">
          <div className="flex justify-between gap-3">
            <span>Approved quotation</span>
            <span className="font-medium text-slate-900">{formatPeso(summary.base_quotation_total ?? summary.quotation_total)}</span>
          </div>
          {(summary.approved_charges_total ?? 0) > 0 && (
            <div className="mt-1 flex justify-between gap-3">
              <span>Additional approved charges</span>
              <span className="font-medium text-slate-900">{formatPeso(summary.approved_charges_total ?? 0)}</span>
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

      {visibleCharges.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Additional Charges</p>
          {visibleCharges.map((charge) => (
            <div key={charge.id} className="flex items-start justify-between gap-3 rounded-lg border bg-slate-50 px-3 py-2 text-xs">
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{charge.title}</p>
                <p className="mt-0.5 text-slate-500">
                  {charge.type_label} · {charge.status_label}
                </p>
              </div>
              <p className={charge.type === "discount" ? "font-semibold text-emerald-600" : "font-semibold text-slate-900"}>
                {charge.type === "discount" ? "-" : ""}
                {formatPeso(charge.amount)}
              </p>
            </div>
          ))}
        </div>
      )}

      {summary.down_payment_required && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Down payment target: {formatPeso(summary.down_payment_amount)}.
          {summary.down_payment_remaining_amount > 0
            ? ` Remaining down payment: ${formatPeso(summary.down_payment_remaining_amount)}.`
            : " Down payment is complete."}
        </div>
      )}

      {actions.length > 0 ? (
        <div className="mt-4 space-y-2">
          {actions.map((action) => (
            <Button
              key={action.type}
              type="button"
              variant={action.primary ? "default" : "outline"}
              className="h-auto w-full justify-between gap-3 px-3 py-3 text-left"
              disabled={!canPayOnline}
              onClick={() => {
                setError(null);
                setSelectedAction(action);
              }}
            >
              <span className="min-w-0">
                <span className="block text-xs font-semibold">{action.title}</span>
                <span className="mt-0.5 block text-[11px] font-normal opacity-75">{action.description}</span>
              </span>
              <span className="shrink-0 text-xs font-semibold">{formatPeso(action.amount)}</span>
            </Button>
          ))}
          {!canPayOnline && (
            <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              Online PayPal payment is not available right now. If you pay by cash, SOG will record it on your work job.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
          {payableTotal <= 0
            ? "No approved payable quotation items yet."
            : "No remaining balance for this work job."}
        </div>
      )}

      {paidPayments.length > 0 && (
        <>
          <Separator className="my-4" />
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Payment History</p>
            {paidPayments.map((payment) => (
              <div key={payment.id} className="flex items-start justify-between gap-3 rounded-lg border bg-slate-50 px-3 py-2 text-xs">
                <div>
                  <p className="font-medium text-slate-900">{payment.type_label}</p>
                  <p className="mt-0.5 text-slate-500">
                    {payment.method_label}
                    {payment.paid_at ? ` · ${formatDate(payment.paid_at)}` : ""}
                  </p>
                </div>
                <p className="font-semibold text-emerald-600">{formatPeso(payment.amount)}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={Boolean(selectedAction)} onOpenChange={(open) => !open && setSelectedAction(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="size-4 text-primary" />
              {selectedAction?.title ?? "Pay with PayPal"}
            </DialogTitle>
            <DialogDescription>
              You will pay {selectedAction ? formatPeso(selectedAction.amount) : ""} using PayPal sandbox or live checkout.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              {error}
            </div>
          )}

          {selectedAction && config?.client_id && (
            <PayPalScriptProvider
              options={{
                clientId: config.client_id,
                currency: config.currency,
                intent: "capture",
                components: "buttons",
              }}
            >
              <PayPalButtons
                forceReRender={[selectedAction.type, selectedAction.amount]}
                style={{ layout: "vertical", shape: "rect", label: "paypal" }}
                disabled={processing}
                createOrder={async () => {
                  setProcessing(true);
                  setError(null);
                  try {
                    const response = await createCustomerWorkJobPaypalOrder(workJob.id, {
                      type: selectedAction.type,
                    });
                    paymentIdRef.current = response.data.id;
                    return response.order_id;
                  } catch (error) {
                    setError(errorMessage(error));
                    throw error;
                  } finally {
                    setProcessing(false);
                  }
                }}
                onApprove={async (data) => {
                  const paymentId = paymentIdRef.current;

                  if (!paymentId || !data.orderID || captureInFlightRef.current) return;

                  captureInFlightRef.current = true;
                  setProcessing(true);
                  setError(null);
                  try {
                    const response = await captureCustomerWorkJobPaypalOrder(workJob.id, {
                      payment_id: paymentId,
                      order_id: data.orderID,
                    });
                    onPaid(response.data);
                    setSelectedAction(null);
                  } catch (error) {
                    setError(errorMessage(error));
                  } finally {
                    setProcessing(false);
                    captureInFlightRef.current = false;
                    paymentIdRef.current = null;
                  }
                }}
                onError={(error) => setError(errorMessage(error))}
              />
            </PayPalScriptProvider>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function paymentActions(workJob: CustomerWorkJob): PaymentAction[] {
  const summary = workJob.payment_summary;

  if (!summary.can_accept_payment || summary.remaining_amount <= 0) return [];

  const actions: PaymentAction[] = [];

  if (summary.down_payment_required && summary.down_payment_remaining_amount > 0) {
    actions.push({
      type: "down_payment",
      title: "Pay Down Payment",
      description: "Required before the remaining balance is collected.",
      amount: summary.down_payment_remaining_amount,
      primary: true,
    });
  }

  if (summary.next_due_type === "additional_charge") {
    actions.push({
      type: "additional_charge",
      title: "Pay Additional Charge",
      description: "Settle approved extra charges added after payment.",
      amount: summary.additional_charge_amount ?? summary.next_due_amount ?? summary.remaining_amount,
      primary: true,
    });

    return actions;
  }

  if (!summary.down_payment_required) {
    actions.push({
      type: "full_payment",
      title: "Pay Balance",
      description: "Settle the open balance for this work job.",
      amount: summary.remaining_amount,
      primary: true,
    });
  } else if (summary.down_payment_remaining_amount <= 0) {
    actions.push({
      type: "final_payment",
      title: "Pay Remaining Balance",
      description: "Settle the balance after down payment.",
      amount: summary.remaining_amount,
      primary: true,
    });
  }

  if (
    summary.down_payment_required &&
    summary.down_payment_remaining_amount > 0 &&
    summary.remaining_amount > summary.down_payment_remaining_amount
  ) {
    actions.push({
      type: "full_payment",
      title: "Pay Full Amount",
      description: "Skip installments and settle the whole balance.",
      amount: summary.remaining_amount,
    });
  }

  return actions;
}

function AmountTile({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className={strong ? "mt-1 font-semibold text-primary" : "mt-1 font-medium text-slate-900"}>
        {formatPeso(value)}
      </p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;

  return "Payment could not be completed. Please try again.";
}
