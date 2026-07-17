import Link from "next/link";
import { ArrowRight, Check, ClipboardCheck, Clock3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CustomerStatus } from "@/features/customer/status";
import type { CustomerAppointment } from "@/features/customer/types";

export default function CustomerOrderNextStepCard({ appointment }: { appointment: CustomerAppointment }) {
  if (appointment.status !== CustomerStatus.Completed || appointment.work_job) return null;

  const state = resolveState(appointment);

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-[#cbdde9] bg-gradient-to-br from-[#edf5fa] to-white p-5 shadow-[0_18px_60px_rgba(22,45,74,0.06)] sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#162d4a] text-white">
            <Clock3 className="size-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#608db9]">What happens next</p>
            <h2 className="mt-1 text-xl font-medium tracking-[-0.03em] text-[#101820]">{state.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5d6e7c]">{state.description}</p>
          </div>
        </div>
        {state.action && (
          <Button asChild className="shrink-0 gap-2 rounded-full">
            <Link href="#customer-quotation">
              {state.action}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-3">
        <Milestone done label="Ocular inspection complete" />
        <Milestone active label={state.milestone} />
        <Milestone label="Work job and fabrication tracking" />
      </div>
    </section>
  );
}

function resolveState(appointment: CustomerAppointment) {
  const quotation = appointment.quotation;
  const items = quotation?.items ?? [];
  const allApproved = items.length > 0 && items.every((item) => item.status === "approved");

  if (!quotation || items.length === 0) {
    return {
      title: "Measurements are under review",
      description: "Your ocular visit is complete. SOG is reviewing the site measurements and preparing your final quotation. You will receive a notification when it is ready.",
      milestone: "Preparing final quotation",
      action: null,
    };
  }

  if (!allApproved) {
    return {
      title: "Your quotation is being finalized",
      description: "SOG is confirming the measurements, materials, and final pricing. The approved quotation will appear here before your order moves into fabrication.",
      milestone: "Finalizing quotation",
      action: null,
    };
  }

  if (quotation.signature_status !== "signed") {
    return {
      title: quotation.signature_status === "needs_resign" ? "Please review and sign again" : "Your quotation is ready to sign",
      description: quotation.signature_status === "needs_resign"
        ? "The approved quotation changed. Review the latest details and sign again so SOG can continue setting up your order."
        : "Review the approved items and sign the quotation. Down payment is only requested when SOG explicitly marks it as required on the future work job.",
      milestone: "Waiting for your signature",
      action: quotation.signature_status === "needs_resign" ? "Review Changes" : "Review & Sign",
    };
  }

  return {
    title: "Your order is being set up",
    description: "SOG has your signed quotation and is creating the work job. Once created, this page will link to live fabrication progress and the expected completion date.",
    milestone: "Creating work job",
    action: null,
  };
}

function Milestone({ label, done, active }: { label: string; done?: boolean; active?: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold ${
      active ? "border-[#608db9] bg-white text-[#2c5282]" : done ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-[#dbe5ec] bg-white/60 text-[#8593a0]"
    }`}>
      <span className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
        active ? "bg-[#2c5282] text-white" : done ? "bg-emerald-600 text-white" : "bg-[#e7edf2] text-[#8593a0]"
      }`}>
        {done ? <Check className="size-3.5" /> : active ? <ClipboardCheck className="size-3.5" /> : "3"}
      </span>
      {label}
    </div>
  );
}
