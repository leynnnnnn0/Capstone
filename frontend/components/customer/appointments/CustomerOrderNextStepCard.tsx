import { customerRecordWaveClass } from "@/components/customer/shared/customer-surfaces";
import { ArrowRight, Check, Clock3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CustomerStatus } from "@/features/customer/status";
import type { CustomerAppointment } from "@/features/customer/types";
import { cn } from "@/lib/utils";

const milestones = [
  "Ocular inspection",
  "Quotation approval",
  "Sign quotation",
  "Create work job",
];

export default function CustomerOrderNextStepCard({
  appointment,
  canApproveQuotation = false,
  onReviewQuotation,
}: {
  appointment: CustomerAppointment;
  canApproveQuotation?: boolean;
  onReviewQuotation: () => void;
}) {
  if (appointment.status !== CustomerStatus.Completed || appointment.work_job) return null;

  const state = resolveState(appointment, canApproveQuotation);

  return (
    <section className={`@container rounded-xl border bg-card p-5 sm:p-6 ${customerRecordWaveClass}`}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md border text-muted-foreground">
            <Clock3 className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{state.title}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{state.description}</p>
          </div>
        </div>
        {state.action && (
          <Button type="button" className="shrink-0 gap-2" onClick={onReviewQuotation}>
            {state.action}
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>

      <ol aria-label="Order progress" className="mt-6 grid @min-[32rem]:grid-cols-4">
        {milestones.map((label, index) => (
          <Milestone
            key={label}
            label={label}
            status={index < state.currentStep ? "completed" : index === state.currentStep ? "current" : "upcoming"}
            last={index === milestones.length - 1}
          />
        ))}
      </ol>
    </section>
  );
}

function resolveState(appointment: CustomerAppointment, canApproveQuotation: boolean) {
  const quotation = appointment.quotation;
  const items = quotation?.items ?? [];
  const allApproved = items.length > 0 && items.every((item) => item.status === "approved");

  if (!quotation || items.length === 0) {
    return {
      title: "Measurements are under review",
      description: "Your ocular visit is complete. SOG is reviewing the site measurements and preparing your final quotation. You will receive a notification when it is ready.",
      currentStep: 1,
      action: null,
    };
  }

  if (canApproveQuotation) {
    return {
      title: "Your quotation is ready to review",
      description: "Review the quoted items and total, then approve the quotation to continue to signing.",
      currentStep: 1,
      action: "Review quotation",
    };
  }

  if (!allApproved) {
    return {
      title: "Your quotation is being finalized",
      description: "SOG is confirming the measurements, materials, and final pricing. The approved quotation will appear here before your order moves into fabrication.",
      currentStep: 1,
      action: null,
    };
  }

  if (quotation.signature_status !== "signed") {
    return {
      title: quotation.signature_status === "needs_resign" ? "Please review and sign again" : "Your quotation is ready to sign",
      description: quotation.signature_status === "needs_resign"
        ? "The approved quotation changed. Review the latest details and sign again so SOG can continue setting up your order."
        : "Review the approved items and sign the quotation. Down payment is only requested when SOG explicitly marks it as required on the future work job.",
      currentStep: 2,
      action: quotation.signature_status === "needs_resign" ? "Review Changes" : "Review & Sign",
    };
  }

  return {
    title: "Your order is being set up",
    description: "SOG has your signed quotation and is creating the work job. Once created, this page will link to live fabrication progress and the expected completion date.",
    currentStep: 3,
    action: null,
  };
}

function Milestone({ label, status, last }: {
  label: string;
  status: "completed" | "current" | "upcoming";
  last: boolean;
}) {
  return (
    <li aria-current={status === "current" ? "step" : undefined} className="relative flex min-w-0 items-start gap-3 pb-4 last:pb-0 @min-[32rem]:flex-col @min-[32rem]:items-center @min-[32rem]:gap-2 @min-[32rem]:px-2 @min-[32rem]:pb-0 @min-[32rem]:text-center">
      {!last && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-3.5 left-3.5 h-full w-px @min-[32rem]:left-1/2 @min-[32rem]:h-px @min-[32rem]:w-full",
            status === "completed" ? "bg-emerald-600" : "bg-slate-300",
          )}
        />
      )}
      <span
        aria-hidden="true"
        className={cn(
          "relative grid size-7 shrink-0 place-items-center rounded-full border",
          status === "completed" && "border-emerald-600 bg-emerald-600 text-white",
          status === "current" && "border-[#2c5282] bg-white text-[#2c5282]",
          status === "upcoming" && "border-slate-300 bg-[#f8fafc]",
        )}
      >
        {status === "completed" && <Check className="size-4" />}
        {status === "current" && <span className="size-2.5 rounded-full bg-current" />}
      </span>
      <span className={cn("pt-1 text-xs font-semibold leading-snug @min-[32rem]:pt-0", status === "current" ? "text-[#2c5282]" : "text-[#52687e]")}>
        {label}
        {status === "completed" && <span className="sr-only"> (completed)</span>}
        {status === "upcoming" && <span className="sr-only"> (upcoming)</span>}
      </span>
    </li>
  );
}
