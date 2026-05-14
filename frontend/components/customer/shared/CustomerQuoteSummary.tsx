import {
  formatPeso,
  quotationItemImage,
  quotationItemSubtitle,
} from "@/features/customer/customer-utils";
import type { CustomerQuotation } from "@/features/customer/types";
import { normalizeAssetUrl } from "@/features/products/product-utils";
import Image from "next/image";

export default function CustomerQuoteSummary({ quotation }: { quotation?: CustomerQuotation | null }) {
  if (!quotation || quotation.items.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-bold text-slate-800">No quote items yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Quote details will appear once your selected items are prepared.
        </p>
      </div>
    );
  }

  const totalEstimate = quotation.subtotal - quotation.discount;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-lg font-black text-slate-950">Quote Summary</p>
        <p className="text-sm font-black text-primary">QTE-{String(quotation.id).padStart(4, "0")}</p>
      </div>
      <div className="space-y-4">
        {quotation.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <QuoteItemImage src={normalizeAssetUrl(quotationItemImage(item))} name={item.name} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900">{item.name}</p>
                  <div className="mt-0.5 space-y-0.5">
                    {quotationItemSubtitle(item).map((line) => (
                      <p key={line} className="truncate text-xs font-medium text-slate-500">
                        {line}
                      </p>
                    ))}
                    <p className="text-xs font-medium text-slate-500">
                      {item.pieces} pc{item.pieces === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <p className="shrink-0 text-sm font-black text-slate-900">{formatPeso(item.total_amount)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
        <SummaryRow label="Subtotal" value={formatPeso(quotation.subtotal)} />
        {quotation.discount > 0 && <SummaryRow label="Discount" value={`-${formatPeso(quotation.discount)}`} />}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <p className="text-lg font-black text-slate-950">Total Estimate</p>
        <p className="text-xl font-black text-primary">{formatPeso(totalEstimate)}</p>
      </div>
      {quotation.notes && (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-700">
          {quotation.notes}
        </p>
      )}
    </div>
  );
}

function QuoteItemImage({ src, name }: { src: string; name: string }) {
  if (!src) {
    return (
      <div className="flex size-16 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        No image
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={name}
      width={64}
      height={64}
      unoptimized
      className="size-16 shrink-0 rounded-md border border-slate-100 object-cover"
    />
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="font-black text-slate-800">{value}</span>
    </div>
  );
}
