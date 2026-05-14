"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, ChevronUp, Layers, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  fmtPeso,
  recalculateLineItem,
  selectProductDefaults,
  selectVariantDefaults,
  updateSelectedOption,
  type AdminLineItem,
} from "@/features/admin-appointments/admin-quotation-line-utils";
import type { Product } from "@/features/products/types";
import { optionGroupOptions, productOptionGroups, productVariants } from "@/features/products/product-utils";

export default function AdminQuotationLineItemRow({
  item,
  index,
  products,
  errors,
  onUpdate,
  onRemove,
}: {
  item: AdminLineItem;
  index: number;
  products: Product[];
  errors: Record<string, string>;
  onUpdate: (id: string, updates: Partial<AdminLineItem>) => void;
  onRemove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const selectedProduct = products.find((product) => String(product.id) === item.product_id) ?? null;
  const variants = selectedProduct ? productVariants(selectedProduct) : [];
  const groups = selectedProduct ? productOptionGroups(selectedProduct) : [];
  const currentVariant = variants.find((variant) => String(variant.width) === item.width && String(variant.height) === item.height);
  const errorPrefix = `items.${index}`;

  function updateField(field: keyof AdminLineItem, value: string) {
    onUpdate(item.id, recalculateLineItem(item, { [field]: value }, selectedProduct));
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setExpanded((value) => !value)}>
          <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">{index + 1}</div>
          <span className="min-w-0">
            <p className="text-sm font-semibold">{item.name || <span className="text-muted-foreground italic">Unnamed item</span>}</p>
            {Number(item.total_amount) > 0 && <p className="text-xs text-muted-foreground">₱{fmtPeso(item.total_amount)}</p>}
          </span>
        </button>
        <div className="flex items-center gap-2">
          {item.selected_options.length > 0 && <Badge variant="secondary">{item.selected_options.length} options</Badge>}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive"
            onClick={(event) => {
              event.stopPropagation();
              onRemove(item.id);
            }}
          >
            <Trash2 className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => setExpanded((value) => !value)}>
            {expanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-4 border-t px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldError label="Product" message={errors[`${errorPrefix}.product_id`]}>
              <Select
                value={item.product_id}
                onValueChange={(productId) => {
                  const product = products.find((candidate) => String(candidate.id) === productId);
                  if (product) onUpdate(item.id, selectProductDefaults(product));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select product..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => <SelectItem key={product.id} value={String(product.id)}>{product.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldError>
            {selectedProduct && variants.length > 0 && (
              <FieldError label="Standard Size (optional)">
                <Select value={currentVariant ? String(currentVariant.id) : ""} onValueChange={(variantId) => onUpdate(item.id, selectVariantDefaults(item, selectedProduct, variantId))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pick a standard size..." />
                  </SelectTrigger>
                  <SelectContent>
                    {variants.map((variant) => (
                      <SelectItem key={variant.id} value={String(variant.id)}>
                        {variant.width} x {variant.height} cm - ₱{fmtPeso(variant.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-[10px] text-muted-foreground">Selecting a size auto-fills dimensions and price.</p>
              </FieldError>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FieldError label="Item Name" message={errors[`${errorPrefix}.name`]}>
              <Input value={item.name} onChange={(event) => onUpdate(item.id, { name: event.target.value })} />
            </FieldError>
            <FieldError label="Description">
              <Input value={item.description} placeholder="Short description (optional)" onChange={(event) => onUpdate(item.id, { description: event.target.value })} />
            </FieldError>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <FieldError label="Width (cm)"><Input type="number" min="0" value={item.width} onChange={(event) => updateField("width", event.target.value)} /></FieldError>
            <FieldError label="Height (cm)"><Input type="number" min="0" value={item.height} onChange={(event) => updateField("height", event.target.value)} /></FieldError>
            <FieldError label="Thickness (mm)"><Input type="number" min="0" value={item.thickness} onChange={(event) => onUpdate(item.id, { thickness: event.target.value })} /></FieldError>
            <FieldError label="Pieces" message={errors[`${errorPrefix}.pieces`]}><Input type="number" min="1" value={item.pieces} onChange={(event) => updateField("pieces", event.target.value)} /></FieldError>
          </div>

          {selectedProduct && groups.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <span className="text-sm font-medium">Material Options</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {groups.map((group) => {
                  const selected = item.selected_options.find((option) => option.product_option_group_id === group.id);
                  return (
                    <FieldError key={group.id} label={group.name}>
                      <Select value={selected ? String(selected.product_option_id) : "__none__"} onValueChange={(optionId) => onUpdate(item.id, updateSelectedOption(item, selectedProduct, group.id, optionId))}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">- None -</SelectItem>
                          {optionGroupOptions(group).filter((option) => option.is_active).map((option) => (
                            <SelectItem key={option.id} value={String(option.id)}>
                              {option.name}{Number(option.price_modifier) > 0 ? ` (+₱${fmtPeso(option.price_modifier)})` : " (included)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldError>
                  );
                })}
              </div>
              {item.selected_options.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.selected_options.map((option) => (
                    <Badge key={option.product_option_group_id} variant="secondary">
                      {option.group_name}: {option.option_name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid gap-3 rounded-lg bg-muted/40 p-3 sm:grid-cols-3">
            <FieldError label="Base Price / Pc (₱)">
              <Input type="number" min="0" step="0.01" value={item.amount_per_piece} onChange={(event) => updateField("amount_per_piece", event.target.value)} />
            </FieldError>
            <FieldError label="Options Add-ons (₱)">
              <Input readOnly value={fmtPeso(item.options_amount)} className="cursor-not-allowed bg-muted" />
            </FieldError>
            <FieldError label="Total Amount (₱)">
              <Input readOnly value={fmtPeso(item.total_amount)} className="cursor-not-allowed border-primary/20 bg-primary/5 font-semibold" />
            </FieldError>
          </div>

          <FieldError label="Item Notes">
            <Textarea rows={2} value={item.notes} onChange={(event) => onUpdate(item.id, { notes: event.target.value })} className="resize-none" />
          </FieldError>
        </div>
      )}
    </div>
  );
}

function FieldError({ label, message, children }: { label: string; message?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label}
        {["Product", "Item Name", "Pieces"].includes(label) && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {message && <p className="text-xs text-destructive">{message}</p>}
    </div>
  );
}
