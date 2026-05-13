import { Calculator } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { fmt } from '../../utils';
import type { LineItem } from '../../types';

interface PriceSummaryProps {
    items: LineItem[];
}

export function PriceSummary({ items }: PriceSummaryProps) {
    const grandTotal = items.reduce(
        (sum, item) => sum + parseFloat(item.total_amount || '0'),
        0,
    );

    return (
        <div className="rounded-lg border bg-muted/40 p-4">
            <div className="mb-3 flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Price Summary</span>
            </div>
            <div className="space-y-1.5">
                {items.map((item, idx) =>
                    item.total_amount && parseFloat(item.total_amount) > 0 ? (
                        <div
                            key={item._id}
                            className="flex justify-between text-sm"
                        >
                            <span className="max-w-[200px] truncate text-muted-foreground">
                                {idx + 1}. {item.name || 'Unnamed item'}
                            </span>
                            <span className="ml-2 shrink-0 font-medium">
                                ₱{fmt(item.total_amount)}
                            </span>
                        </div>
                    ) : null,
                )}
                <Separator className="my-2" />
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Grand Total</span>
                    <span className="text-lg font-bold text-primary">
                        ₱{fmt(grandTotal)}
                    </span>
                </div>
            </div>
        </div>
    );
}
