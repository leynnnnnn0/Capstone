"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Loader2,
  MonitorSmartphone,
  Printer,
  RefreshCw,
  Ruler,
  ScanLine,
} from "lucide-react";
import { toast } from "sonner";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchAppointmentMeasurementSessions,
  fetchArMeasurementSummary,
  reviewArMeasurementSession,
} from "@/features/ar-measurements/ar-measurement-api";
import {
  appointmentArUrl,
  confidenceLabel,
  formatMeasurementDate,
  formatMeasurementDimensions,
  formatMeasurementNumber,
  isMeasurementEstimate,
  measurementDeviceRows,
  measurementStatusLabel,
} from "@/features/ar-measurements/ar-measurement-utils";
import type {
  ArMeasurement,
  ArMeasurementSession,
  ArMeasurementSessionStatus,
  ArMeasurementSummary,
  ReviewArMeasurementSessionPayload,
} from "@/features/ar-measurements/types";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

type AppointmentMeasurementRecordsProps = {
  appointmentId: string | number;
  appointmentNumber: string;
  customerName: string;
  serviceType: string;
  address: string;
  audience: "staff" | "customer";
  canReview?: boolean;
};

type ReviewStatus = ReviewArMeasurementSessionPayload["status"];

export default function AppointmentMeasurementRecords({
  appointmentId,
  appointmentNumber,
  customerName,
  serviceType,
  address,
  audience,
  canReview = audience === "staff",
}: AppointmentMeasurementRecordsProps) {
  const [sessions, setSessions] = useState<ArMeasurementSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedSession, setSelectedSession] =
    useState<ArMeasurementSession | null>(null);
  const [summary, setSummary] = useState<ArMeasurementSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("reviewed");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const appointmentContext = useMemo(
    () => ({
      id: Number(appointmentId),
      appointment_number: appointmentNumber,
      customer_name: customerName,
      service_type: serviceType,
      address,
    }),
    [address, appointmentId, appointmentNumber, customerName, serviceType],
  );

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await fetchAppointmentMeasurementSessions(
        appointmentId,
        audience,
      );
      setSessions(Array.isArray(response?.data) ? response.data : []);
    } catch {
      setLoadError(
        "Measurement records could not be loaded right now. The rest of this appointment is still available.",
      );
    } finally {
      setLoading(false);
    }
  }, [appointmentId, audience]);

  useEffect(() => {
    queueMicrotask(() => void loadSessions());
  }, [loadSessions]);

  async function loadSummary(reference: string) {
    setSummary(null);
    setSummaryError("");
    setSummaryLoading(true);

    try {
      const response = await fetchArMeasurementSummary(reference);
      setSummary(response.data);
    } catch {
      setSummaryError(
        "The server summary is unavailable. The saved measurement details are shown below.",
      );
    } finally {
      setSummaryLoading(false);
    }
  }

  function openSummary(session: ArMeasurementSession) {
    setSelectedSession(session);
    setReviewStatus(reviewStatusFor(session.status));
    setReviewNotes(session.review_notes ?? "");
    setReviewError("");
    void loadSummary(session.reference);
  }

  async function submitReview() {
    if (!selectedSession) return;

    const notes = reviewNotes.trim();
    if (reviewStatus === "needs_retake" && !notes) {
      setReviewError("Add retake instructions so the customer or technician knows what to capture again.");
      return;
    }

    setReviewing(true);
    setReviewError("");

    try {
      const response = await reviewArMeasurementSession(
        selectedSession.reference,
        {
          status: reviewStatus,
          ...(notes ? { review_notes: notes } : {}),
        },
      );
      const updated = response.data;

      setSessions((current) =>
        current.map((session) =>
          session.reference === updated.reference ? updated : session,
        ),
      );
      setSelectedSession(updated);
      setReviewStatus(reviewStatusFor(updated.status));
      setReviewNotes(updated.review_notes ?? "");
      await loadSummary(updated.reference);
      toast.success(
        reviewStatus === "approved"
          ? "Measurement record approved."
          : reviewStatus === "needs_retake"
            ? "Measurement retake requested."
            : "Measurement review saved.",
      );
    } catch (error) {
      setReviewError(
        error instanceof ApiError
          ? error.message
          : "The review could not be saved. Please try again.",
      );
    } finally {
      setReviewing(false);
    }
  }

  const recordCount = sessions.length;
  const selectedAppointment = summary?.appointment ?? appointmentContext;

  return (
    <section className="measurement-print-host overflow-hidden rounded-[1.25rem] border border-[#dce4ea] bg-white shadow-[0_18px_55px_rgba(22,45,74,0.055)]">
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-[#f7fafc] px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e9f1f7] text-[#315f8b]">
            <Ruler className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-950">
                AR measurement records
              </h2>
              {!loading && recordCount > 0 && (
                <Badge variant="outline" className="bg-white text-slate-600">
                  {recordCount} {recordCount === 1 ? "session" : "sessions"}
                </Badge>
              )}
            </div>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
              Saved room captures linked to this appointment. AR values remain
              estimates until an assigned technician approves them.
            </p>
          </div>
        </div>
        <Button asChild type="button" className="h-9 gap-2 self-start">
          <a href={appointmentArUrl(appointmentId)}>
            <ScanLine className="size-4" />
            Start AR measurement
          </a>
        </Button>
      </div>

      <div className="p-5">
        {loading ? (
          <MeasurementListSkeleton />
        ) : loadError ? (
          <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2.5">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" />
              <p className="text-xs leading-5 text-amber-900">{loadError}</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void loadSessions()}
              className="gap-1.5 bg-white"
            >
              <RefreshCw className="size-3.5" />
              Retry
            </Button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-8 text-center">
            <ScanLine className="mx-auto size-7 text-slate-400" />
            <h3 className="mt-3 text-sm font-semibold text-slate-900">
              No saved measurement sessions
            </h3>
            <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
              Open the AR measuring tool from this appointment to save a
              capture with device details and confidence readings.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <MeasurementSessionRow
                key={session.reference}
                session={session}
                onOpen={() => openSummary(session)}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(selectedSession)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSession(null);
            setSummary(null);
            setSummaryError("");
          }
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Measurement summary</DialogTitle>
            <DialogDescription>
              Capture {selectedSession?.reference}
            </DialogDescription>
          </DialogHeader>

          {selectedSession && (
            <>
              {summaryLoading && (
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  <Loader2 className="size-3.5 animate-spin" />
                  Loading verified summary totals…
                </div>
              )}
              {summaryError && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {summaryError}
                </p>
              )}

              <MeasurementReport
                session={selectedSession}
                summary={summary}
                appointment={selectedAppointment}
              />

              {audience === "staff" && canReview && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-start gap-2.5">
                    <ClipboardCheck className="mt-0.5 size-4 text-[#315f8b]" />
                    <div>
                      <h3 className="text-sm font-semibold text-slate-950">
                        Technician review
                      </h3>
                      <p className="mt-0.5 text-xs leading-5 text-slate-500">
                        Approval confirms this record has been checked. Request
                        a retake when any opening or confidence reading is not
                        usable.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-[13rem_1fr]">
                    <div className="space-y-1.5">
                      <Label htmlFor="measurement-review-status">
                        Review decision
                      </Label>
                      <Select
                        value={reviewStatus}
                        onValueChange={(value) => {
                          setReviewStatus(value as ReviewStatus);
                          setReviewError("");
                        }}
                      >
                        <SelectTrigger
                          id="measurement-review-status"
                          className="w-full bg-white"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="start">
                          <SelectItem value="reviewed">Mark reviewed</SelectItem>
                          <SelectItem value="approved">Approve measurements</SelectItem>
                          <SelectItem value="needs_retake">Request retake</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="measurement-review-notes">
                        Review notes
                        {reviewStatus === "needs_retake" ? " (required)" : ""}
                      </Label>
                      <Textarea
                        id="measurement-review-notes"
                        value={reviewNotes}
                        onChange={(event) => {
                          setReviewNotes(event.target.value);
                          setReviewError("");
                        }}
                        placeholder={
                          reviewStatus === "needs_retake"
                            ? "Describe which opening or angle needs to be captured again."
                            : "Optional notes about the measurement verification."
                        }
                        className="min-h-20 resize-none bg-white"
                      />
                    </div>
                  </div>
                  {reviewError && (
                    <p className="mt-3 text-xs font-medium text-red-600">
                      {reviewError}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.print()}
              disabled={!selectedSession}
              className="gap-2"
            >
              <Printer className="size-4" />
              Print summary
            </Button>
            {selectedSession && audience === "staff" && canReview && (
              <Button
                type="button"
                onClick={() => void submitReview()}
                disabled={reviewing}
                className="gap-2"
              >
                {reviewing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ClipboardCheck className="size-4" />
                )}
                {reviewing ? "Saving review…" : "Save review"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedSession && (
        <div className="measurement-print-report" aria-hidden="true">
          <MeasurementReport
            session={selectedSession}
            summary={summary}
            appointment={selectedAppointment}
            printable
          />
        </div>
      )}
    </section>
  );
}

function MeasurementSessionRow({
  session,
  onOpen,
}: {
  session: ArMeasurementSession;
  onOpen: () => void;
}) {
  const measurements = Array.isArray(session.measurements)
    ? session.measurements
    : [];
  const count = session.measurements_count ?? measurements.length;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#b9ccdc]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              status={session.status}
              label={session.status_label}
            />
            <ConfidenceBadge confidence={session.overall_confidence} />
            {isMeasurementEstimate(session) && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                <AlertTriangle className="size-3" />
                Estimate
              </span>
            )}
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-950">
            {count} {count === 1 ? "measured opening" : "measured openings"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Captured {formatMeasurementDate(session.captured_at)} ·{" "}
            {humanize(session.capture_version)} · {humanize(session.capture_mode)}
          </p>
          {measurements.length > 0 && (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">
              {measurements
                .slice(0, 3)
                .map(
                  (measurement) =>
                    `${measurement.label}: ${formatMeasurementDimensions(measurement)}`,
                )
                .join(" · ")}
              {measurements.length > 3 ? ` · +${measurements.length - 3} more` : ""}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpen}
          className="shrink-0 gap-1.5"
        >
          <FileText className="size-3.5" />
          View summary
        </Button>
      </div>
    </article>
  );
}

function MeasurementReport({
  session,
  summary,
  appointment,
  printable = false,
}: {
  session: ArMeasurementSession;
  summary: ArMeasurementSummary | null;
  appointment: ArMeasurementSummary["appointment"];
  printable?: boolean;
}) {
  const measurements =
    summary?.measurements ??
    (Array.isArray(session.measurements) ? session.measurements : []);
  const count =
    summary?.object_count ??
    session.measurements_count ??
    measurements.length;
  const deviceRows = measurementDeviceRows(session.device_metadata);
  const review = summary?.review ?? {
    review_notes: session.review_notes,
    reviewed_at: session.reviewed_at,
    reviewed_by: session.reviewed_by,
  };

  return (
    <div
      className={cn(
        "space-y-5",
        printable && "mx-auto max-w-[190mm] bg-white text-slate-950",
      )}
    >
      {printable && (
        <div className="border-b-2 border-[#162d4a] pb-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#315f8b]">
            SOG Glass & Aluminum Services
          </p>
          <h1 className="mt-2 text-2xl font-semibold">AR measurement summary</h1>
          <p className="mt-1 text-xs text-slate-500">
            Reference {session.reference}
          </p>
        </div>
      )}

      <div
        className={cn(
          "rounded-xl border p-4",
          isMeasurementEstimate(session)
            ? "border-amber-200 bg-amber-50"
            : "border-emerald-200 bg-emerald-50",
        )}
      >
        <div className="flex gap-2.5">
          {isMeasurementEstimate(session) ? (
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" />
          ) : (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" />
          )}
          <div>
            <p
              className={cn(
                "text-xs font-semibold",
                isMeasurementEstimate(session)
                  ? "text-amber-950"
                  : "text-emerald-950",
              )}
            >
              {isMeasurementEstimate(session)
                ? "AR estimate — technician verification required"
                : "Technician-reviewed measurement record"}
            </p>
            <p
              className={cn(
                "mt-1 text-xs leading-5",
                isMeasurementEstimate(session)
                  ? "text-amber-900"
                  : "text-emerald-900",
              )}
            >
              {isMeasurementEstimate(session)
                ? "Do not use these values for fabrication or installation until this record is approved."
                : "This record has been reviewed and approved by an authorized SOG team member."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ReportField label="Appointment" value={appointment.appointment_number} />
        <ReportField label="Customer" value={appointment.customer_name} />
        <ReportField label="Service" value={humanize(appointment.service_type)} />
        <ReportField label="Site address" value={appointment.address} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Openings" value={String(count)} />
        <Metric
          label="Confidence"
          value={confidenceLabel(session.overall_confidence)}
        />
        <Metric
          label="Linear total"
          value={
            summary
              ? `${formatMeasurementNumber(summary.totals.total_linear_m, 2)} m`
              : "Pending summary"
          }
        />
        <Metric
          label="Area total"
          value={
            summary
              ? `${formatMeasurementNumber(summary.totals.total_area_sqm, 2)} m²`
              : "Pending summary"
          }
        />
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#315f8b]">
          Measurements
        </h3>
        {measurements.length === 0 ? (
          <p className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            No individual measurement rows were returned.
          </p>
        ) : (
          <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
            {measurements.map((measurement, index) => (
              <MeasurementRow
                key={measurement.id ?? `${measurement.label}-${index}`}
                measurement={measurement}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <ScanLine className="size-4 text-[#315f8b]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#315f8b]">
              Capture details
            </h3>
          </div>
          <dl className="mt-3 space-y-2">
            <Definition label="Captured" value={formatMeasurementDate(session.captured_at)} />
            <Definition label="Source" value={humanize(session.source)} />
            <Definition label="Version" value={humanize(session.capture_version)} />
            <Definition label="Mode" value={humanize(session.capture_mode)} />
            <Definition
              label="Captured by"
              value={session.created_by?.full_name ?? "Not recorded"}
            />
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <MonitorSmartphone className="size-4 text-[#315f8b]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#315f8b]">
              Device metadata
            </h3>
          </div>
          {deviceRows.length > 0 ? (
            <dl className="mt-3 space-y-2">
              {deviceRows.map((row) => (
                <Definition
                  key={row.label}
                  label={row.label}
                  value={row.value}
                />
              ))}
            </dl>
          ) : (
            <p className="mt-3 text-xs text-slate-500">
              No device metadata was reported.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={session.status} label={session.status_label} />
          {review.reviewed_at && (
            <span className="text-xs text-slate-500">
              Reviewed {formatMeasurementDate(review.reviewed_at)}
            </span>
          )}
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-600">
          {review.review_notes || "No technician review notes yet."}
        </p>
        {review.reviewed_by && (
          <p className="mt-2 text-[11px] font-medium text-slate-500">
            Reviewed by {review.reviewed_by.full_name}
          </p>
        )}
      </div>

      {printable && (
        <p className="border-t border-slate-200 pt-4 text-[10px] leading-4 text-slate-500">
          Generated from the saved AR measurement record for{" "}
          {appointment.appointment_number}. Reference {session.reference}.
        </p>
      )}
    </div>
  );
}

function MeasurementRow({
  measurement,
  index,
}: {
  measurement: ArMeasurement;
  index: number;
}) {
  const segments = Array.isArray(measurement.segments_cm)
    ? measurement.segments_cm
    : [];

  return (
    <div
      className={cn(
        "grid gap-3 p-3 sm:grid-cols-[1.1fr_1fr_auto]",
        index > 0 && "border-t border-slate-200",
      )}
    >
      <div>
        <p className="text-xs font-semibold text-slate-950">
          {measurement.label || `Opening ${index + 1}`}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {humanize(measurement.object_type)}
          {measurement.model_id ? ` · ${measurement.model_id}` : ""}
        </p>
      </div>
      <div>
        <p className="text-xs font-medium text-slate-800">
          {formatMeasurementDimensions(measurement)}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {segments.length > 0
            ? `Segments: ${segments
                .map((segment) => `${formatMeasurementNumber(segment)} cm`)
                .join(" + ")}`
            : "No segment breakdown"}
        </p>
      </div>
      <div className="sm:text-right">
        <ConfidenceBadge confidence={measurement.confidence} />
        <p className="mt-1 text-[11px] text-slate-500">
          {formatMeasurementNumber(measurement.area_sqm, 2)} m²
        </p>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  label,
}: {
  status: ArMeasurementSessionStatus;
  label?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border",
        status === "approved" && "border-emerald-200 bg-emerald-50 text-emerald-800",
        status === "needs_retake" && "border-red-200 bg-red-50 text-red-700",
        status === "reviewed" && "border-blue-200 bg-blue-50 text-blue-800",
        status === "submitted" && "border-amber-200 bg-amber-50 text-amber-800",
      )}
    >
      {measurementStatusLabel(status, label)}
    </Badge>
  );
}

function ConfidenceBadge({
  confidence,
}: {
  confidence: ArMeasurement["confidence"];
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "bg-white",
        confidence === "high" && "border-emerald-200 text-emerald-700",
        confidence === "medium" && "border-blue-200 text-blue-700",
        confidence === "weak" && "border-amber-200 text-amber-700",
        (!confidence || confidence === "none") && "border-slate-200 text-slate-500",
      )}
    >
      {confidenceLabel(confidence)}
    </Badge>
  );
}

function ReportField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-medium text-slate-900">{value || "—"}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function Definition({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-2 text-xs">
      <dt className="text-slate-500">{label}</dt>
      <dd className="break-words font-medium text-slate-800">{value || "—"}</dd>
    </div>
  );
}

function MeasurementListSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading measurement records">
      {[0, 1].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-xl border border-slate-200 p-4"
        >
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-64 max-w-full rounded bg-slate-100" />
          <div className="mt-2 h-3 w-80 max-w-full rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function reviewStatusFor(status: ArMeasurementSessionStatus): ReviewStatus {
  return status === "submitted" ? "reviewed" : status;
}

function humanize(value: string) {
  if (!value) return "Not recorded";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
