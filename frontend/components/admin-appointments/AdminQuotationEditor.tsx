"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Calculator, FileText, Package, Plus, RotateCcw, StickyNote } from "lucide-react";

import AdminQuotationLineItemRow from "@/components/admin-appointments/AdminQuotationLineItemRow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  createAppointmentQuotation,
  updateAppointmentQuotation,
} from "@/features/admin-appointments/admin-appointment-api";
import {
  customerItemsToLineItems,
  fmtPeso,
  lineItemToPayload,
  makeAdminLineItem,
  validateLineItems,
  type AdminLineItem,
} from "@/features/admin-appointments/admin-quotation-line-utils";
import type { AdminAppointment } from "@/features/admin-appointments/types";
import { fetchProducts } from "@/features/products/product-api";
import type { Product } from "@/features/products/types";

export default function AdminQuotationEditor({
  appointment,
  open,
  onOpenChange,
  onSaved,
}: {
  appointment: AdminAppointment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<AdminLineItem[]>([]);
  const [notes, setNotes] = useState(appointment.quotation?.notes ?? "");
  const [expiresAt, setExpiresAt] = useState(appointment.quotation?.expires_at ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const grandTotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.total_amount || 0), 0), [items]);

  useEffect(() => {
    if (!open) return;

    fetchProducts({ is_active: "1", per_page: "100" })
      .then((response) => {
        setProducts(response.data);
        setItems(
          appointment.quotation?.items.length
            ? customerItemsToLineItems(appointment.quotation.items, response.data)
            : [makeAdminLineItem()],
        );
        setNotes(appointment.quotation?.notes ?? "");
        setExpiresAt(appointment.quotation?.expires_at ?? "");
        setErrors({});
      })
      .finally(() => setLoading(false));
  }, [appointment, open]);

  function updateItem(id: string, updates: Partial<AdminLineItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    setErrors({});
  }

  function resetItems() {
    setItems(
      appointment.quotation?.items.length
        ? customerItemsToLineItems(appointment.quotation.items, products)
        : [makeAdminLineItem()],
    );
    setNotes(appointment.quotation?.notes ?? "");
    setExpiresAt(appointment.quotation?.expires_at ?? "");
    setErrors({});
  }

  async function save() {
    const nextErrors = validateLineItems(items);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      const payload = items.map(lineItemToPayload);
      if (appointment.quotation) await updateAppointmentQuotation(appointment.quotation.id, payload, notes, expiresAt);
      else await createAppointmentQuotation(appointment.id, payload, notes, expiresAt);
      onSaved();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[86vh] overflow-hidden rounded-t-xl p-0 sm:max-w-none">
        <SheetHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                {appointment.quotation ? "Edit Quotation" : "Create Quotation"}
              </SheetTitle>
              <SheetDescription>
                {appointment.quotation ? "Update line items, materials, and prices." : "Add line items, select materials, and compute prices."}
              </SheetDescription>
            </div>
            {grandTotal > 0 && (
              <div className="pr-12 text-right">
                <p className="text-xs text-muted-foreground">Grand Total</p>
                <p className="text-lg font-bold text-primary">₱{fmtPeso(grandTotal)}</p>
              </div>
            )}
          </div>
        </SheetHeader>

        {loading ? (
          <div className="space-y-4 px-6 py-5">
            <Skeleton className="h-16 w-full" />
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="h-[calc(86vh-145px)] space-y-5 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 md:grid-cols-[1fr_260px]">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold">
                  <StickyNote className="size-3.5" />
                  Quotation Notes
                </label>
                <Textarea
                  placeholder="Payment terms, delivery, warranty..."
                  rows={2}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="quotation-expires-at" className="flex items-center gap-1.5 text-xs font-semibold">
                  <CalendarDays className="size-3.5" />
                  Expiration Date <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <Input
                  id="quotation-expires-at"
                  type="date"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">Leave blank if this quotation does not expire.</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="size-4 text-primary" />
                  <span className="text-sm font-semibold">Line Items</span>
                  <Badge variant="outline">{items.length} item{items.length === 1 ? "" : "s"}</Badge>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setItems((current) => [...current, makeAdminLineItem()])}>
                  <Plus className="mr-1.5 size-3.5" />
                  Add Item
                </Button>
              </div>

              {errors.items && <p className="text-xs text-destructive">{errors.items}</p>}

              <div className="space-y-3">
                {items.map((item, index) => (
                  <AdminQuotationLineItemRow
                    key={item.id}
                    item={item}
                    index={index}
                    products={products}
                    errors={errors}
                    onUpdate={updateItem}
                    onRemove={(id) => setItems((current) => current.filter((item) => item.id !== id))}
                  />
                ))}
              </div>
            </div>

            <PriceSummary items={items} />
          </div>
        )}

        <SheetFooter className="flex-row items-center justify-between border-t bg-background px-6 py-4">
          <Button type="button" variant="ghost" onClick={resetItems} disabled={saving}>
            <RotateCcw className="size-4" />
            Reset
          </Button>
          <div className="ml-auto flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="button" onClick={save} disabled={saving || items.length === 0}>
              {saving ? "Saving..." : appointment.quotation ? "Update Quotation" : "Create Quotation"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function PriceSummary({ items }: { items: AdminLineItem[] }) {
  const grandTotal = items.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);

  return (
    <div className="rounded-lg border bg-muted/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Calculator className="size-4 text-primary" />
        <span className="text-sm font-semibold">Price Summary</span>
      </div>
      <div className="space-y-1.5">
        {items.map((item, index) => Number(item.total_amount) > 0 ? (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="truncate text-muted-foreground">{index + 1}. {item.name || "Unnamed item"}</span>
            <span className="ml-2 shrink-0 font-medium">₱{fmtPeso(item.total_amount)}</span>
          </div>
        ) : null)}
        <Separator className="my-2" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Grand Total</span>
          <span className="text-lg font-bold text-primary">₱{fmtPeso(grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}
