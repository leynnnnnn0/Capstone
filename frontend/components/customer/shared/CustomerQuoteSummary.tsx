"use client";

import { useState } from "react";
import { Calculator, CheckCircle2, Download, FileText, Layers, Package, PenLine } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CustomerSignatureDialog from "@/components/customer/shared/CustomerSignatureDialog";
import { quotationPdfUrl } from "@/features/admin-appointments/admin-appointment-api";
import { Separator } from "@/components/ui/separator";
import { formatPeso } from "@/features/customer/customer-utils";
import type { CustomerQuotation, CustomerQuotationItem } from "@/features/customer/types";

export default function CustomerQuoteSummary({
  quotation,
  signerName,
  onSigned,
}: {
  quotation?: CustomerQuotation | null;
  signerName?: string | null;
  onSigned?: () => void;
}) {
  const [signOpen, setSignOpen] = useState(false);

  if (!quotation || quotation.items.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-800">No quote items yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Quote details will appear once your selected items are prepared.
        </p>
      </div>
    );
  }

  const totalEstimate = quotation.total || quotation.subtotal - quotation.discount;
  const isSigned = quotation.signature_status === "signed";
  const needsResign = quotation.signature_status === "needs_resign";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <FileText className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-slate-950">Quotation</h2>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {quotation.created_at ? `Created ${formatDate(quotation.created_at)}` : "Quote summary"}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button asChild type="button" variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
            <a href={quotationPdfUrl(quotation.id)} target="_blank" rel="noreferrer">
              <Download className="size-3.5" />
              Download
            </a>
          </Button>
          <Button
            type="button"
            variant={isSigned ? "outline" : "default"}
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setSignOpen(true)}
          >
            {isSigned ? <CheckCircle2 className="size-3.5" /> : <PenLine className="size-3.5" />}
            {isSigned ? "Signed" : needsResign ? "Sign Again" : "Sign"}
          </Button>
          <Badge variant="outline" className="text-xs">
            {quotation.items.length} item{quotation.items.length === 1 ? "" : "s"}
          </Badge>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {quotation.items.map((item, index) => (
          <ReadonlyQuoteItem key={item.id} item={item} index={index} />
        ))}
      </div>

      <Separator className="my-5" />

      <div className="space-y-3">
        <SummaryRow label="All items subtotal" value={formatPeso(quotation.subtotal)} />
        {quotation.discount > 0 && (
          <SummaryRow label="Discount" value={`-${formatPeso(quotation.discount)}`} />
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 rounded-lg bg-emerald-50 px-4 py-4">
        <div className="flex items-center gap-3">
          <Calculator className="size-5 text-slate-900" />
          <div>
            <p className="text-sm font-semibold text-slate-950">Total Estimate</p>
            <p className="text-xs text-emerald-700">
              {quotation.items.length} quoted item{quotation.items.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <p className="text-sm font-semibold text-emerald-600">{formatPeso(totalEstimate)}</p>
      </div>

      {quotation.notes && (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm leading-relaxed text-amber-700">
          {quotation.notes}
        </p>
      )}

      {isSigned && quotation.customer_signed_at && (
        <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">
          Signed by {quotation.customer_signature_name ?? "customer"} on {formatDate(quotation.customer_signed_at)}.
        </p>
      )}

      {needsResign && (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
          This quotation changed after it was signed. Please review and sign again.
        </p>
      )}

      <CustomerSignatureDialog
        quotationId={quotation.id}
        defaultName={signerName}
        open={signOpen}
        onOpenChange={setSignOpen}
        onSigned={() => onSigned?.()}
      />
    </section>
  );
}

function ReadonlyQuoteItem({ item, index }: { item: CustomerQuotationItem; index: number }) {
  const optionsTotal = Number(item.options_amount || 0);

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200">
      <div className="flex items-start justify-between gap-4 p-4">
        <div className="flex min-w-0 gap-3">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
            {index + 1}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold leading-tight text-slate-950">{item.name}</h3>
            {item.description && (
              <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{item.description}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {item.width && item.height && (
                <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-700">
                  {item.width} x {item.height} cm
                </span>
              )}
              {item.thickness && (
                <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-700">
                  {item.thickness} mm
                </span>
              )}
              <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-700">
                {item.pieces} pc
              </span>
            </div>
          </div>
        </div>
        <p className="shrink-0 text-sm font-semibold text-primary">{formatPeso(item.total_amount)}</p>
      </div>

      {item.options.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50/70 px-4 py-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            <Layers className="size-4" />
            Material Options
          </div>
          <div className="space-y-1">
            {item.options.map((option) => (
              <div key={option.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-500">
                  {option.group_name}:{" "}
                  <span className="font-medium text-slate-950">{option.option_name}</span>
                </span>
                <span className="text-slate-500">
                  {Number(option.price_modifier) > 0
                    ? `+${formatPeso(Number(option.price_modifier))}`
                    : "Included"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-2">
            <Package className="size-4" />
            Base price
          </span>
          <span>{formatPeso(Number(item.total_amount) - optionsTotal)}</span>
        </div>
        {optionsTotal > 0 && (
          <div className="mt-1 flex items-center justify-between gap-3 text-xs text-emerald-600">
            <span>Options</span>
            <span>+{formatPeso(optionsTotal)}</span>
          </div>
        )}
      </div>
    </article>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
