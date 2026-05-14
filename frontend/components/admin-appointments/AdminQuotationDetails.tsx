"use client";

import { useMemo, useState } from "react";
import {
  Calculator,
  CheckCircle2,
  Download,
  FileText,
  ImageIcon,
  Images,
  Layers,
  Package,
  StickyNote,
} from "lucide-react";

import AdminQuotationItemImages from "@/components/admin-appointments/AdminQuotationItemImages";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { quotationPdfUrl, updateQuotationItemStatus } from "@/features/admin-appointments/admin-appointment-api";
import { fmtPeso } from "@/features/admin-appointments/admin-quotation-line-utils";
import type { CustomerQuotation, CustomerQuotationItem } from "@/features/customer/types";

const approvedStatus = "approved";

const itemStatuses = [
  { value: "for_acceptance", label: "For Acceptance" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "revision_needed", label: "Revision Needed" },
  { value: "on_hold", label: "On Hold" },
];

export default function AdminQuotationDetails({ quotation }: { quotation?: CustomerQuotation | null }) {
  const [items, setItems] = useState<CustomerQuotationItem[]>(quotation?.items ?? []);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [photoItemId, setPhotoItemId] = useState<number | null>(null);

  const activePhotoItem = items.find((item) => item.id === photoItemId) ?? null;
  const approvedItems = useMemo(() => items.filter((item) => item.status === approvedStatus), [items]);
  const allTotal = items.reduce((sum, item) => sum + Number(item.total_amount), 0);
  const approvedTotal = approvedItems.reduce((sum, item) => sum + Number(item.total_amount), 0);

  if (!quotation || items.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            Quotation
          </CardTitle>
          <CardDescription className="text-xs">No quotation yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  async function changeStatus(itemId: number, status: string) {
    const previousItems = items;
    setSavingId(itemId);
    setItems((current) => current.map((item) => item.id === itemId ? { ...item, status } : item));

    try {
      await updateQuotationItemStatus(itemId, status);
    } catch (error) {
      setItems(previousItems);
      throw error;
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Quotation</CardTitle>
            </div>
            <div className="flex items-center gap-1.5">
              <Button asChild variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                <a href={quotationPdfUrl(quotation.id)} target="_blank" rel="noreferrer">
                  <Download className="h-3 w-3" />
                  PDF
                </a>
              </Button>
              {approvedItems.length > 0 && (
                <Badge className="bg-green-600 text-[10px] text-white hover:bg-green-700">
                  {approvedItems.length} approved
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {items.length} item{items.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>
          <CardDescription className="text-xs">Created {formatQuoteDate(quotation.created_at, quotation.id)}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {quotation.notes && (
            <div className="rounded-lg bg-muted/40 p-3">
              <div className="mb-1.5 flex items-center gap-1.5">
                <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Notes</span>
              </div>
              <p className="text-sm">{quotation.notes}</p>
            </div>
          )}

          <div className="space-y-3">
            {items.map((item, index) => (
              <QuotationItemCard
                key={item.id}
                item={item}
                index={index}
                saving={savingId === item.id}
                onStatusChange={changeStatus}
                onOpenPhotos={() => setPhotoItemId(item.id)}
              />
            ))}
          </div>

          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 text-sm text-muted-foreground">
              <Package className="mb-2 h-8 w-8 opacity-30" />
              <p>No items in this quotation.</p>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>All items subtotal</span>
              <span>₱{fmtPeso(allTotal)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 dark:bg-green-950/20">
              <div className="flex items-center gap-1.5">
                <Calculator className="h-4 w-4" />
                <span className="text-sm font-semibold">Approved Total</span>
                <span className="text-[10px] text-green-600 dark:text-green-500">
                  ({approvedItems.length} of {items.length} items)
                </span>
              </div>
              <span className="text-xl font-bold text-green-700 dark:text-green-400">₱{fmtPeso(approvedTotal)}</span>
            </div>
            {approvedItems.length === 0 && (
              <p className="text-center text-[11px] text-muted-foreground">No items approved yet - approve items above to calculate the total.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {activePhotoItem && (
        <ItemPhotosDialog
          item={activePhotoItem}
          open={photoItemId !== null}
          onOpenChange={(open) => {
            if (!open) setPhotoItemId(null);
          }}
        />
      )}
    </>
  );
}

function QuotationItemCard({
  item,
  index,
  saving,
  onStatusChange,
  onOpenPhotos,
}: {
  item: CustomerQuotationItem;
  index: number;
  saving: boolean;
  onStatusChange: (itemId: number, status: string) => Promise<void>;
  onOpenPhotos: () => void;
}) {
  const isApproved = item.status === approvedStatus;
  const photoCount = (item.before_images?.length ?? 0) + (item.after_images?.length ?? 0);

  return (
    <div className="rounded-lg border transition-colors">
      <div className="flex items-start justify-between px-3 py-2.5">
        <div className="flex items-start gap-2.5">
          <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${isApproved ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-primary/10 text-primary"}`}>
            {index + 1}
          </div>
          <div>
            <p className="text-sm leading-tight font-semibold">{item.name}</p>
            {item.description && <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>}
            <div className="mt-1 flex flex-wrap gap-1.5">
              {(item.width || item.height) && <Badge variant="outline" className="text-[10px]">{item.width} x {item.height} cm</Badge>}
              {item.thickness && <Badge variant="outline" className="text-[10px]">{item.thickness} mm</Badge>}
              <Badge variant="outline" className="text-[10px]">{item.pieces} pc{item.pieces !== 1 ? "s" : ""}</Badge>
            </div>
          </div>
        </div>
        <div className="ml-2 shrink-0 text-right">
          <p className={`text-sm font-bold ${isApproved ? "text-green-700 dark:text-green-400" : ""}`}>₱{fmtPeso(item.total_amount)}</p>
          {item.pieces > 1 && <p className="text-[10px] text-muted-foreground">₱{fmtPeso(item.amount_per_piece)} x {item.pieces}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between border-t bg-muted/20 px-3 py-2">
        <Select value={item.status ?? "for_acceptance"} onValueChange={(status) => onStatusChange(item.id, status)} disabled={saving}>
          <SelectTrigger className="h-7 w-[150px] rounded-lg border-dashed text-[11px]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {itemStatuses.map((status) => <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Button type="button" variant="ghost" size="sm" onClick={onOpenPhotos} className="h-7 gap-1.5 text-[11px] text-muted-foreground hover:text-foreground">
          <Images className="h-3.5 w-3.5" />
          Photos
          {photoCount > 0 && <span className="ml-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">{photoCount}</span>}
        </Button>
      </div>

      {item.options.length > 0 && (
        <div className="border-t px-3 py-2">
          <div className="mb-1.5 flex items-center gap-1">
            <Layers className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">Material Options</span>
          </div>
          <div className="space-y-1">
            {item.options.map((option) => (
              <div key={option.id} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">{option.group_name}:</span>
                  <span className="text-xs font-medium">{option.option_name}</span>
                </div>
                {Number(option.price_modifier) > 0 ? (
                  <span className="text-xs font-medium text-green-600">+₱{fmtPeso(option.price_modifier)}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Included</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {Number(item.options_amount) > 0 && (
        <div className="border-t bg-muted/30 px-3 py-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Base price</span>
            <span>₱{fmtPeso(item.amount_per_piece)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Options</span>
            <span className="text-green-600">+₱{fmtPeso(item.options_amount)}</span>
          </div>
        </div>
      )}

      {item.notes && (
        <div className="border-t px-3 py-2">
          <p className="text-xs text-muted-foreground italic">{item.notes}</p>
        </div>
      )}
    </div>
  );
}

function ItemPhotosDialog({
  item,
  open,
  onOpenChange,
}: {
  item: CustomerQuotationItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const totalCount = (item.before_images?.length ?? 0) + (item.after_images?.length ?? 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            {item.name}
            {totalCount > 0 && <Badge variant="secondary" className="text-[10px]">{totalCount} photo{totalCount !== 1 ? "s" : ""}</Badge>}
          </DialogTitle>
        </DialogHeader>
        <AdminQuotationItemImages
          quotationItemId={item.id}
          beforeImages={item.before_images ?? []}
          afterImages={item.after_images ?? []}
          mode="content"
        />
      </DialogContent>
    </Dialog>
  );
}

function formatQuoteDate(date: string | undefined, quoteId: number) {
  if (!date) return `quote #${quoteId}`;

  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}
