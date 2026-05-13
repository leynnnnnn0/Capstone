import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Trash2, ChevronDown, ChevronUp, Layers, Info } from 'lucide-react';

import { fmt, blockInvalidNumberKeys } from '../../utils';
import { FieldError } from './FieldError';
import type {
    LineItem,
    Product,
    ProductOptionGroup,
    ProductOption,
    SelectedOption,
} from '../../types';


interface LineItemRowProps {
    item: LineItem;
    index: number;
    products: Product[];
    onUpdate: (id: string, updates: Partial<LineItem>) => void;
    onRemove: (id: string) => void;
    errors: Record<string, string>;
}

export function LineItemRow({
    item,
    index,
    products,
    onUpdate,
    onRemove,
    errors,
}: LineItemRowProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const selectedProduct =
        products.find((p) => String(p.id) === item.product_id) ?? null;

    const recalculate = useCallback(
        (updates: Partial<LineItem>, currentItem: LineItem) => {
            const merged = { ...currentItem, ...updates };
            const w = parseFloat(merged.width || '0');
            const h = parseFloat(merged.height || '0');
            const pieces = parseFloat(merged.pieces || '1');
            const optionsAmount = parseFloat(merged.options_amount || '0');
            let amountPerPiece = parseFloat(merged.amount_per_piece || '0');

            if (
                merged.product_id &&
                selectedProduct &&
                selectedProduct.unit === 'sqm' &&
                w > 0 &&
                h > 0 &&
                !updates.amount_per_piece
            ) {
                const sqm = (w * h) / 10000;
                amountPerPiece = sqm * selectedProduct.price_per_unit;
                updates.amount_per_piece = amountPerPiece.toFixed(2);
            }

            const total = (amountPerPiece + optionsAmount) * pieces;
            return {
                ...updates,
                options_amount: merged.options_amount,
                total_amount: total.toFixed(2),
                ...(updates.amount_per_piece !== undefined
                    ? { amount_per_piece: updates.amount_per_piece }
                    : {}),
            };
        },
        [selectedProduct],
    );

    const update = (field: keyof LineItem, value: string) => {
        const updates = recalculate(
            { [field]: value } as Partial<LineItem>,
            item,
        );
        onUpdate(item._id, updates);
    };

    const handleProductChange = (productId: string) => {
        const product = products.find((p) => String(p.id) === productId);
        onUpdate(item._id, {
            product_id: productId,
            name: product?.name ?? '',
            description: '',
            amount_per_piece: '',
            options_amount: '0',
            total_amount: '0',
            selected_options: [],
        });
    };

    const handleVariantChange = (variantId: string) => {
        const variant = selectedProduct?.product_variants.find(
            (v) => String(v.id) === variantId,
        );
        if (!variant) return;
        const updates = recalculate(
            {
                width: String(variant.width),
                height: String(variant.height),
                amount_per_piece: String(variant.price),
            },
            item,
        );
        onUpdate(item._id, updates);
    };

    const handleOptionChange = (
        group: ProductOptionGroup,
        option: ProductOption,
    ) => {
        const alreadySelected = item.selected_options.find(
            (o) => o.product_option_group_id === group.id,
        );

        let newOptions: SelectedOption[];
        if (alreadySelected?.product_option_id === option.id) {
            newOptions = item.selected_options.filter(
                (o) => o.product_option_group_id !== group.id,
            );
        } else {
            newOptions = [
                ...item.selected_options.filter(
                    (o) => o.product_option_group_id !== group.id,
                ),
                {
                    product_option_group_id: group.id,
                    product_option_id: option.id,
                    group_name: group.name,
                    option_name: option.name,
                    price_modifier: Number(option.price_modifier),
                },
            ];
        }

        const optionsAmount = newOptions.reduce(
            (sum, o) => sum + Number(o.price_modifier),
            0,
        );
        const updates = recalculate(
            {
                selected_options: newOptions,
                options_amount: optionsAmount.toFixed(2),
            },
            item,
        );
        onUpdate(item._id, updates);
    };

    const handleOptionClear = (group: ProductOptionGroup) => {
        const newOptions = item.selected_options.filter(
            (o) => o.product_option_group_id !== group.id,
        );
        const optionsAmount = newOptions.reduce(
            (sum, o) => sum + Number(o.price_modifier),
            0,
        );
        const updates = recalculate(
            {
                selected_options: newOptions,
                options_amount: optionsAmount.toFixed(2),
            },
            item,
        );
        onUpdate(item._id, updates);
    };

    const currentVariant = selectedProduct?.product_variants.find(
        (v) =>
            String(v.width) === item.width && String(v.height) === item.height,
    );

    const errPrefix = `items.${index}`;

    return (
        <div className="rounded-lg border">
            {/* Header */}
            <div
                className="flex cursor-pointer items-center justify-between px-4 py-3"
                onClick={() => setIsExpanded((p) => !p)}
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {index + 1}
                    </div>
                    <div>
                        <p className="text-sm font-semibold">
                            {item.name || (
                                <span className="text-muted-foreground italic">
                                    Unnamed item
                                </span>
                            )}
                        </p>
                        {parseFloat(item.total_amount || '0') > 0 && (
                            <p className="text-xs text-muted-foreground">
                                ₱{fmt(item.total_amount)}
                                {parseInt(item.pieces) > 1
                                    ? ` · ${item.pieces} pcs`
                                    : ''}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {item.selected_options.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                            {item.selected_options.length} option
                            {item.selected_options.length !== 1 ? 's' : ''}
                        </Badge>
                    )}
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(item._id);
                        }}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
            </div>

            {/* Body */}
            {isExpanded && (
                <div className="space-y-4 border-t px-4 py-4">
                    {/* Product + Variant */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs">
                                Product{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={item.product_id}
                                onValueChange={handleProductChange}
                            >
                                <SelectTrigger
                                    className={`w-full ${
                                        errors[`${errPrefix}.product_id`]
                                            ? 'border-destructive'
                                            : ''
                                    }`}
                                >
                                    <SelectValue placeholder="Select product…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map((p) => (
                                        <SelectItem
                                            key={p.id}
                                            value={String(p.id)}
                                        >
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError
                                message={errors[`${errPrefix}.product_id`]}
                            />
                        </div>

                        {selectedProduct &&
                            selectedProduct.product_variants.length > 0 && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs">
                                        Standard Size (optional)
                                    </Label>
                                    <Select
                                        value={
                                            currentVariant
                                                ? String(currentVariant.id)
                                                : ''
                                        }
                                        onValueChange={handleVariantChange}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Pick a standard size…" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedProduct.product_variants.map(
                                                (v) => (
                                                    <SelectItem
                                                        key={v.id}
                                                        value={String(v.id)}
                                                    >
                                                        {v.width} × {v.height}{' '}
                                                        cm — ₱{fmt(v.price)}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[10px] text-muted-foreground">
                                        Selecting a size auto-fills dimensions
                                        and price.
                                    </p>
                                </div>
                            )}
                    </div>

                    {/* Name + Description */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs">
                                Item Name{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                placeholder="e.g. Sliding Glass Door"
                                value={item.name}
                                onChange={(e) =>
                                    onUpdate(item._id, {
                                        name: e.target.value,
                                    })
                                }
                                className={
                                    errors[`${errPrefix}.name`]
                                        ? 'border-destructive'
                                        : ''
                                }
                            />
                            <FieldError message={errors[`${errPrefix}.name`]} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Description</Label>
                            <Input
                                placeholder="Short description (optional)"
                                value={item.description}
                                onChange={(e) =>
                                    onUpdate(item._id, {
                                        description: e.target.value,
                                    })
                                }
                                className={
                                    errors[`${errPrefix}.description`]
                                        ? 'border-destructive'
                                        : ''
                                }
                            />
                            <FieldError
                                message={errors[`${errPrefix}.description`]}
                            />
                        </div>
                    </div>

                    {/* Dimensions */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Width (cm)</Label>
                            <Input
                                type="number"
                                min="0"
                                placeholder="120"
                                value={item.width}
                                onKeyDown={blockInvalidNumberKeys}
                                onChange={(e) =>
                                    update('width', e.target.value)
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Height (cm)</Label>
                            <Input
                                type="number"
                                min="0"
                                placeholder="120"
                                value={item.height}
                                onKeyDown={blockInvalidNumberKeys}
                                onChange={(e) =>
                                    update('height', e.target.value)
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Thickness (mm)</Label>
                            <Input
                                type="number"
                                min="0"
                                placeholder="6"
                                value={item.thickness}
                                onKeyDown={blockInvalidNumberKeys}
                                onChange={(e) =>
                                    onUpdate(item._id, {
                                        thickness: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">
                                Pieces{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                type="number"
                                min="1"
                                placeholder="1"
                                value={item.pieces}
                                onKeyDown={blockInvalidNumberKeys}
                                onChange={(e) =>
                                    update('pieces', e.target.value)
                                }
                                className={
                                    errors[`${errPrefix}.pieces`]
                                        ? 'border-destructive'
                                        : ''
                                }
                            />
                            <FieldError
                                message={errors[`${errPrefix}.pieces`]}
                            />
                        </div>
                    </div>

                    {/* Material Options */}
                    {selectedProduct &&
                        selectedProduct.product_option_groups.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium">
                                        Material Options
                                    </span>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {selectedProduct.product_option_groups.map(
                                        (group) => {
                                            const selected =
                                                item.selected_options.find(
                                                    (o) =>
                                                        o.product_option_group_id ===
                                                        group.id,
                                                );
                                            return (
                                                <div
                                                    key={group.id}
                                                    className="space-y-1.5"
                                                >
                                                    <Label className="text-xs">
                                                        {group.name}
                                                    </Label>
                                                    <Select
                                                        value={
                                                            selected
                                                                ? String(
                                                                      selected.product_option_id,
                                                                  )
                                                                : '__none__'
                                                        }
                                                        onValueChange={(
                                                            optionId,
                                                        ) => {
                                                            if (
                                                                optionId ===
                                                                '__none__'
                                                            ) {
                                                                handleOptionClear(
                                                                    group,
                                                                );
                                                                return;
                                                            }
                                                            const option =
                                                                group.product_options.find(
                                                                    (o) =>
                                                                        String(
                                                                            o.id,
                                                                        ) ===
                                                                        optionId,
                                                                );
                                                            if (option)
                                                                handleOptionChange(
                                                                    group,
                                                                    option,
                                                                );
                                                        }}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue
                                                                placeholder={`Select ${group.name}…`}
                                                            />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem
                                                                value="__none__"
                                                                className="text-muted-foreground italic"
                                                            >
                                                                — None —
                                                            </SelectItem>
                                                            {group.product_options
                                                                .filter(
                                                                    (o) =>
                                                                        o.is_active,
                                                                )
                                                                .map(
                                                                    (
                                                                        option,
                                                                    ) => (
                                                                        <SelectItem
                                                                            key={
                                                                                option.id
                                                                            }
                                                                            value={String(
                                                                                option.id,
                                                                            )}
                                                                        >
                                                                            {
                                                                                option.name
                                                                            }
                                                                            {Number(
                                                                                option.price_modifier,
                                                                            ) >
                                                                            0
                                                                                ? ` (+₱${fmt(option.price_modifier)})`
                                                                                : ' (included)'}
                                                                        </SelectItem>
                                                                    ),
                                                                )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                                {item.selected_options.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {item.selected_options.map((o) => (
                                            <Badge
                                                key={o.product_option_group_id}
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                {o.group_name}: {o.option_name}
                                                {Number(o.price_modifier) >
                                                    0 && (
                                                    <span className="ml-1 text-green-600">
                                                        +₱
                                                        {fmt(o.price_modifier)}
                                                    </span>
                                                )}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                    {/* Pricing Breakdown */}
                    <div className="grid grid-cols-3 gap-3 rounded-lg bg-muted/40 p-3">
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-1 text-xs">
                                Base Price / Pc (₱)
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Auto-computed from dimensions if
                                            product uses sqm. Override manually
                                            if needed.
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </Label>
                            <div className="relative">
                                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-xs text-muted-foreground">
                                    ₱
                                </span>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="pl-6 text-sm"
                                    value={item.amount_per_piece}
                                    onKeyDown={blockInvalidNumberKeys}
                                    onChange={(e) =>
                                        update(
                                            'amount_per_piece',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">
                                Options Add-ons (₱)
                            </Label>
                            <div className="relative">
                                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-xs text-muted-foreground">
                                    ₱
                                </span>
                                <Input
                                    readOnly
                                    className="cursor-not-allowed bg-muted pl-6 text-sm"
                                    value={fmt(item.options_amount)}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">
                                Total Amount (₱)
                            </Label>
                            <div className="relative">
                                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-xs text-muted-foreground">
                                    ₱
                                </span>
                                <Input
                                    readOnly
                                    className="cursor-not-allowed border-primary/20 bg-primary/5 pl-6 text-sm font-semibold"
                                    value={fmt(item.total_amount)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Item Notes */}
                    <div className="space-y-1.5">
                        <Label className="text-xs">Item Notes</Label>
                        <Textarea
                            placeholder="Any specific notes for this item…"
                            rows={2}
                            value={item.notes}
                            onChange={(e) =>
                                onUpdate(item._id, { notes: e.target.value })
                            }
                            className={
                                errors[`${errPrefix}.notes`]
                                    ? 'border-destructive'
                                    : ''
                            }
                        />
                        <FieldError message={errors[`${errPrefix}.notes`]} />
                    </div>
                </div>
            )}
        </div>
    );
}
