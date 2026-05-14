import Link from "next/link";

import StatusBadge from "@/components/tracking/StatusBadge";
import type { TrackingResult } from "@/features/tracking/types";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTrackingTimestamp,
  getStatus,
} from "@/features/tracking/tracking-utils";

export default function TrackingResultCard({ result }: { result: TrackingResult }) {
  const isWorkJob = result.type === "work_job";
  const status = getStatus(result.status);
  const scheduledDate = isWorkJob
    ? formatDateTime(result.scheduled_date, result.scheduled_time_from, result.scheduled_time_until)
    : result.appointment_date
      ? formatDateTime(result.appointment_date, result.appointment_time_from, result.appointment_time_until)
      : null;

  const infoItems = [
    { label: "Full Name", value: result.full_name },
    { label: "Phone", value: result.phone_number },
    { label: "Email", value: result.email || "-" },
    { label: "Address", value: result.address || "-" },
    { label: "Service Type", value: result.service_type || "-" },
    ...(!isWorkJob && result.preferred_date
      ? [{ label: "Preferred Date", value: `${formatDate(result.preferred_date)} · ${result.preferred_time ?? ""}` }]
      : []),
    ...(scheduledDate ? [{ label: isWorkJob ? "Scheduled Date" : "Inspection Date", value: scheduledDate }] : []),
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-primary/10">
        <div className="flex flex-col gap-3 bg-primary px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/50">
              {isWorkJob ? "Work Job" : "Appointment"}
            </p>
            <p className="text-[20px] font-extrabold tracking-wide text-white sm:text-[24px]">
              {result.reference_number}
            </p>
            <p className="mt-0.5 text-[12px] text-white/60">{result.full_name}</p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[11px] font-bold text-white">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: status.dot }} />
              {status.label}
            </span>
            {result.workers.length > 0 && (
              <span className="text-[11px] text-white/60">{result.workers.join(", ")}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 border-b border-slate-100 px-6 py-5 sm:grid-cols-2">
          {infoItems.map((item) => (
            <div key={item.label}>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                {item.label}
              </p>
              <p className="break-words text-[13px] font-semibold leading-snug text-slate-800">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {result.has_quotation && result.items.length > 0 ? (
          <>
            <div className="border-b border-slate-100 px-6 py-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Items ({result.items.length})
              </p>
              <div className="space-y-2.5">
                {result.items.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-slate-900">{item.name}</p>
                      {item.size && <p className="mb-1 text-[11px] font-semibold text-primary">{item.size}</p>}
                      {item.options.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.options.map((option) => (
                            <span key={option} className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                              {option}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400">
                        {item.pieces} pc{item.pieces === 1 ? "" : "s"}
                      </p>
                      <p className="text-[13px] font-extrabold text-primary">
                        {formatCurrency(item.total_amount)}
                      </p>
                      {item.status && <StatusBadge status={item.status} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              {result.quotation_notes && (
                <p className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-700">
                  {result.quotation_notes}
                </p>
              )}
              <div className="ml-auto text-right">
                {result.discount > 0 && (
                  <p className="text-[10px] font-semibold text-green-600">
                    Discount -{formatCurrency(result.discount)}
                  </p>
                )}
                <p className="text-[10px] text-slate-400">Total</p>
                <p className="text-[26px] font-extrabold text-primary">
                  {formatCurrency(result.grand_total)}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="px-6 py-5">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="mb-1 text-[13px] font-bold text-slate-800">Quotation Not Yet Available</p>
              <p className="text-[12px] leading-relaxed text-slate-500">
                Your detailed quotation will appear here once our team prepares it.
              </p>
            </div>
          </div>
        )}

        <div className="border-t border-slate-100 px-6 py-5">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Updates
          </p>
          <div className="space-y-3">
            {result.remarks.length > 0 ? (
              result.remarks.map((remark, index) => {
                const remarkStatus = getStatus(remark.action);

                return (
                  <div key={`${remark.created_at}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-[12px] font-bold text-slate-800">{remark.by}</span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: remarkStatus.bg, color: remarkStatus.color }}
                      >
                        {remarkStatus.label}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatTrackingTimestamp(remark.created_at)}
                      </span>
                    </div>
                    <p className="text-[13px] leading-relaxed text-slate-600">{remark.message}</p>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                <p className="text-[13px] font-semibold text-slate-700">No updates yet.</p>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                  Updates from the SOG team will appear here once your request moves forward.
                </p>
              </div>
            )}
          </div>
        </div>

        {(result.additional_notes || result.notes) && (
          <div className="border-t border-slate-100 px-6 py-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Notes</p>
            <p className="text-[13px] leading-relaxed text-slate-600">
              {result.additional_notes || result.notes}
            </p>
          </div>
        )}
      </div>
      <div className="mt-6 text-center">
        <Link href="/get-quote" className="text-[12px] font-bold text-primary hover:underline">
          Start a new quote
        </Link>
      </div>
    </div>
  );
}
