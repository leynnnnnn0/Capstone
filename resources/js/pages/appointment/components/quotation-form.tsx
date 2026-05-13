import { useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';
import {
    FileText,
    Plus,
    Package,
    AlertCircle,
    StickyNote,
    Pencil,
} from 'lucide-react';

import { makeBlankItem, fromExistingItem, validateItems, fmt } from '../utils';
import { FieldError } from '../validation/components/FieldError';
import { PriceSummary } from '../validation/components/PriceSummary';
import { LineItemRow } from '../validation/components/LineItemRow';
import type { LineItem, QuotationFormProps } from '../types';

export default function QuotationForm({
    appointmentId,
    products,
    existingQuotation = null,
}: QuotationFormProps) {
    const isEditMode = existingQuotation !== null;

    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<LineItem[]>(() =>
        isEditMode && existingQuotation!.quotation_items.length > 0
            ? existingQuotation!.quotation_items.map(fromExistingItem)
            : [makeBlankItem()],
    );
    const [clientErrors, setClientErrors] = useState<Record<string, string>>(
        {},
    );

    const {
        data,
        setData,
        post,
        put,
        processing,
        errors: serverErrors,
        reset,
    } = useForm({
        appointment_id: appointmentId,
        notes: existingQuotation?.notes ?? '',
        items: [] as Omit<LineItem, '_id'>[],
    });

    // Re-hydrate items when drawer opens in edit mode
    useEffect(() => {
        if (open && isEditMode) {
            const hydrated =
                existingQuotation!.quotation_items.map(fromExistingItem);
            setItems(hydrated);
            setData('notes', existingQuotation!.notes ?? '');
            syncItems(hydrated);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const syncItems = (list: LineItem[]) => {
        setData(
            'items',
            list.map(({ _id, ...rest }) => rest),
        );
    };

    const updateItem = (id: string, updates: Partial<LineItem>) => {
        setItems((prev) => {
            const updated = prev.map((item) =>
                item._id === id ? { ...item, ...updates } : item,
            );
            syncItems(updated);
            return updated;
        });
    };

    const addItem = () => {
        setItems((prev) => {
            const updated = [...prev, makeBlankItem()];
            syncItems(updated);
            return updated;
        });
    };

    const removeItem = (id: string) => {
        setItems((prev) => {
            const updated = prev.filter((item) => item._id !== id);
            syncItems(updated);
            return updated;
        });
    };

    const validate = (): boolean => {
        const errs = validateItems(items);
        setClientErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        syncItems(items);

        const onSuccess = () => {
            if (!isEditMode) {
                reset();
                setItems([makeBlankItem()]);
            }
            setClientErrors({});
            setOpen(false);
        };

        if (isEditMode) {
            put(`/quotations/${existingQuotation!.id}`, {
                preserveScroll: true,
                onSuccess,
            });
        } else {
            post('/quotations', {
                preserveScroll: true,
                onSuccess,
            });
        }
    };

    const handleReset = () => {
        if (isEditMode) {
            const hydrated =
                existingQuotation!.quotation_items.map(fromExistingItem);
            setItems(hydrated);
            setData('notes', existingQuotation!.notes ?? '');
            syncItems(hydrated);
        } else {
            setItems([makeBlankItem()]);
            reset();
        }
        setClientErrors({});
    };

    const grandTotal = items.reduce(
        (sum, item) => sum + parseFloat(item.total_amount || '0'),
        0,
    );
    const allErrors = { ...clientErrors, ...serverErrors } as Record<
        string,
        string
    >;

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <Button variant="outline" size="sm" className="w-fit">
                    {isEditMode ? (
                        <>
                            <Pencil className="h-3.5 w-3.5" />
                            Edit Quotation
                        </>
                    ) : (
                        <>
                            <FileText className="h-3.5 w-3.5" />
                            Create Quotation
                        </>
                    )}
                </Button>
            </DrawerTrigger>

            <DrawerContent className="flex flex-col">
                <DrawerHeader className="shrink-0 border-b px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <DrawerTitle className="flex items-center gap-2 text-base">
                                <FileText className="h-4 w-4 text-primary" />
                                {isEditMode
                                    ? 'Edit Quotation'
                                    : 'Create Quotation'}
                            </DrawerTitle>
                            <DrawerDescription className="mt-0.5 text-xs">
                                {isEditMode
                                    ? 'Update line items, materials, and prices.'
                                    : 'Add line items, select materials, and compute prices.'}
                            </DrawerDescription>
                        </div>
                        {grandTotal > 0 && (
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">
                                    Grand Total
                                </p>
                                <p className="text-lg font-bold text-primary">
                                    ₱{fmt(grandTotal)}
                                </p>
                            </div>
                        )}
                    </div>
                </DrawerHeader>

                {/* Scrollable body */}
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-1 flex-col overflow-hidden"
                >
                    <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                        {/* Quotation Notes */}
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-1.5 text-xs">
                                <StickyNote className="h-3.5 w-3.5" />
                                Quotation Notes
                            </Label>
                            <Textarea
                                placeholder="Payment terms, delivery, warranty…"
                                rows={2}
                                value={data.notes}
                                onChange={(e) =>
                                    setData('notes', e.target.value)
                                }
                            />
                            <FieldError message={serverErrors.notes} />
                        </div>

                        <Separator />

                        {/* Line Items */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-semibold">
                                        Line Items
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className="text-xs"
                                    >
                                        {items.length} item
                                        {items.length !== 1 ? 's' : ''}
                                    </Badge>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addItem}
                                >
                                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                                    Add Item
                                </Button>
                            </div>

                            {allErrors['items'] && (
                                <p className="flex items-center gap-1 text-xs text-destructive">
                                    <AlertCircle className="h-3 w-3" />
                                    {allErrors['items']}
                                </p>
                            )}

                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-sm text-muted-foreground">
                                    <Package className="mb-2 h-8 w-8 opacity-30" />
                                    <p>No items yet</p>
                                    <p className="text-xs opacity-70">
                                        Click "Add Item" to start
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {items.map((item, idx) => (
                                        <LineItemRow
                                            key={item._id}
                                            item={item}
                                            index={idx}
                                            products={products}
                                            onUpdate={updateItem}
                                            onRemove={removeItem}
                                            errors={allErrors}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Price Summary */}
                        {items.some(
                            (i) => parseFloat(i.total_amount || '0') > 0,
                        ) && <PriceSummary items={items} />}
                    </div>

                    {/* Footer */}
                    <DrawerFooter className="shrink-0 border-t px-6 py-4">
                        <div className="flex items-center justify-between gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleReset}
                            >
                                Reset
                            </Button>
                            <div className="flex items-center gap-2">
                                <DrawerClose asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                    >
                                        Cancel
                                    </Button>
                                </DrawerClose>
                                <Button
                                    type="submit"
                                    disabled={processing || items.length === 0}
                                    size="sm"
                                >
                                    {processing
                                        ? 'Saving…'
                                        : isEditMode
                                          ? 'Update Quotation'
                                          : 'Save Quotation'}
                                </Button>
                            </div>
                        </div>
                    </DrawerFooter>
                </form>
            </DrawerContent>
        </Drawer>
    );
}
