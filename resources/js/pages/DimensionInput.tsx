import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Product } from '@/types';
import { parseNum } from '@/lib/quoteUtils';

interface Dims {
    width: string;
    height: string;
    thickness: string;
}

interface Props {
    product: Product;
    dims: Dims;
    onChange: (updated: Dims) => void;
}

export function DimensionInputs({ product, dims, onChange }: Props) {
    const needsWH = true;
    const needsLength = true;
    const fixedUnit = product.unit === 'piece' || product.unit === 'set';

    const set = (key: keyof Dims) => (e: React.ChangeEvent<HTMLInputElement>) =>
        onChange({ ...dims, [key]: e.target.value });

    const sqm = needsWH
        ? (parseNum(dims.width) * parseNum(dims.height)).toFixed(2)
        : null;

    if (fixedUnit) {
        return (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[13px] text-slate-500">
                    Priced per <strong>{product.unit}</strong>. No dimension
                    input needed — adjust pieces below.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {needsWH && (
                <div className="flex items-end gap-3">
                    {/* Width */}
                    <div className="flex-1">
                        <Label className="mb-1.5 block text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                            Width (m)
                        </Label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g. 1.20"
                            value={dims.width}
                            onChange={set('width')}
                        />
                    </div>

                    <span className="pb-2 font-bold text-slate-400">×</span>

                    {/* Height */}
                    <div className="flex-1">
                        <Label className="mb-1.5 block text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                            Height (m)
                        </Label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g. 2.10"
                            value={dims.height}
                            onChange={set('height')}
                        />
                    </div>

                    {/* Auto sqm badge */}
                    {sqm && parseFloat(sqm) > 0 && (
                        <div
                            className="flex-shrink-0 rounded-xl px-4 py-2.5 pb-2 text-center"
                            style={{ background: '#eef2f8' }}
                        >
                            <p className="mb-0.5 text-[10px] text-slate-500">
                                Area
                            </p>
                            <p className="text-[13px] font-extrabold text-[#2c5282]">
                                {sqm} sqm
                            </p>
                        </div>
                    )}
                </div>
            )}

         
            {/* Thickness — always shown when dimensions are relevant */}
            <div className="max-w-[220px]">
                <Label className="mb-1.5 block text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                    Thickness (mm){' '}
                    <span className="font-normal text-slate-400 normal-case">
                        optional
                    </span>
                </Label>
                <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g. 6"
                    value={dims.thickness}
                    onChange={set('thickness')}
                />
            </div>
        </div>
    );
}
