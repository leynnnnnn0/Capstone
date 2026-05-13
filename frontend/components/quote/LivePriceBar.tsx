"use client";

import type { QuoteDraft } from "@/features/quotes/types";
import { computeItemTotal, formatCurrency } from "@/features/quotes/quote-utils";

export default function LivePriceBar({
  item,
  onPiecesChange,
}: {
  item: QuoteDraft;
  onPiecesChange: (pieces: number) => void;
}) {
  const total = computeItemTotal(item);

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden text-[12px] font-bold text-slate-500 sm:inline">Pieces</span>
        <button type="button" onClick={() => onPiecesChange(Math.max(1, item.pieces - 1))} className="h-8 w-8 rounded-lg border border-slate-200 text-primary">
          -
        </button>
        <span className="min-w-6 text-center text-[16px] font-bold text-slate-900">{item.pieces}</span>
        <button type="button" onClick={() => onPiecesChange(item.pieces + 1)} className="h-8 w-8 rounded-lg border border-slate-200 text-primary">
          +
        </button>
      </div>

      <div className="text-right">
        <p className="text-[10px] text-slate-400">Estimated</p>
        <p className={`text-[20px] font-extrabold sm:text-[22px] ${total > 0 ? "text-primary" : "text-slate-300"}`}>
          {total > 0 ? formatCurrency(Math.round(total)) : "-"}
        </p>
      </div>
    </div>
  );
}
