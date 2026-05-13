import type { CartItem } from '@/types';
import { computeItemTotal, fmt } from '@/lib/quoteUtils';

interface Props {
    item: CartItem;
    onPiecesChange: (n: number) => void;
}

export function LivePriceBar({ item, onPiecesChange }: Props) {
    const total = computeItemTotal(item);

    return (
        <div
            className="flex items-center justify-between gap-4 rounded-xl px-4 py-3"
            style={{ background: 'white', border: '1.5px solid #e2e8f0' }}
        >
            {/* Qty stepper */}
            <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
                <span className="hidden text-[12px] font-bold text-slate-500 sm:inline">
                    Pieces
                </span>
                <button
                    type="button"
                    onClick={() => onPiecesChange(Math.max(1, item.pieces - 1))}
                    className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg text-[16px] font-bold transition-colors hover:bg-slate-100"
                    style={{
                        border: '1.5px solid #e2e8f0',
                        color: '#2c5282',
                        background: 'white',
                    }}
                >
                    −
                </button>
                <span className="min-w-[24px] text-center text-[16px] font-bold text-slate-900">
                    {item.pieces}
                </span>
                <button
                    type="button"
                    onClick={() => onPiecesChange(item.pieces + 1)}
                    className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg text-[16px] font-bold transition-colors hover:bg-slate-100"
                    style={{
                        border: '1.5px solid #e2e8f0',
                        color: '#2c5282',
                        background: 'white',
                    }}
                >
                    +
                </button>
            </div>

            {/* Estimated price */}
            <div className="min-w-0 text-right">
                <p className="mb-0.5 text-[10px] text-slate-400">Estimated</p>
                <p
                    className="text-[20px] leading-tight font-extrabold transition-colors sm:text-[22px]"
                    style={{ color: total > 0 ? '#2c5282' : '#cbd5e0' }}
                >
                    {total > 0 ? `₱${fmt(Math.round(total))}` : '—'}
                </p>
            </div>
        </div>
    );
}
