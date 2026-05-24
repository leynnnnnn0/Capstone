"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { PenLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signCustomerQuotation } from "@/features/customer/customer-api";
import type { CustomerQuotation } from "@/features/customer/types";
import { toast } from "sonner";

type SignatureAction = (
  quotationId: number,
  payload: { signer_name: string; signature: string },
) => Promise<{ data: CustomerQuotation }>;

export default function CustomerSignatureDialog({
  quotationId,
  defaultName,
  signAction = signCustomerQuotation,
  open,
  onOpenChange,
  onSigned,
}: {
  quotationId: number;
  defaultName?: string | null;
  signAction?: SignatureAction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSigned: (quotation: CustomerQuotation) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [name, setName] = useState(defaultName ?? "");
  const [hasSignature, setHasSignature] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setName(defaultName ?? "");
    setError("");
    clearCanvas();
  }, [defaultName, open]);

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (!canvas || !rect) return null;

    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function begin(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const next = point(event);
    if (!ctx || !next) return;

    drawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
    ctx.beginPath();
    ctx.moveTo(next.x, next.y);
  }

  function draw(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;

    const ctx = canvasRef.current?.getContext("2d");
    const next = point(event);
    if (!ctx || !next) return;

    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
    ctx.lineTo(next.x, next.y);
    ctx.stroke();
    setHasSignature(true);
  }

  function end(event: PointerEvent<HTMLCanvasElement>) {
    drawingRef.current = false;
    canvasRef.current?.releasePointerCapture(event.pointerId);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }

  async function submit() {
    const canvas = canvasRef.current;
    if (!canvas || !name.trim() || !hasSignature) return;

    try {
      setSubmitting(true);
      setError("");
      const response = await signAction(quotationId, {
        signer_name: name.trim(),
        signature: canvas.toDataURL("image/png"),
      });
      onSigned(response.data);
      onOpenChange(false);
      toast.success("Quotation signed successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign quotation.");
      toast.error(err instanceof Error ? err.message : "Could not sign quotation.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <PenLine className="size-4 text-primary" />
            Sign quotation
          </DialogTitle>
          <DialogDescription>
            Your signature approves the current approved quotation items. If the quote changes later, we will ask you to sign again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signer_name">Signer name</Label>
            <Input id="signer_name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Signature</Label>
            <canvas
              ref={canvasRef}
              width={720}
              height={220}
              className="h-36 w-full touch-none rounded-lg border bg-white"
              onPointerDown={begin}
              onPointerMove={draw}
              onPointerUp={end}
              onPointerCancel={end}
            />
            <Button type="button" variant="ghost" size="sm" onClick={clearCanvas}>
              Clear signature
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={!name.trim() || !hasSignature || submitting}>
            {submitting ? "Signing..." : "Approve and Sign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
