"use client";

import { useMemo, useState } from "react";
import { MessageSquareHeart, Star } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitCustomerWorkJobRating } from "@/features/customer/customer-api";
import type { CustomerWorkJob } from "@/features/customer/types";
import { zodIssuesToFieldErrors } from "@/features/forms/validation";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

const ratingSchema = z.object({
  rating: z.number().int("Choose a rating.").min(1, "Choose a rating.").max(5, "Rating cannot exceed 5 stars."),
  comment: z.string().max(1000, "Comment must not exceed 1,000 characters.").optional(),
});

type RatingErrors = Partial<Record<"rating" | "comment" | "form", string>>;

export default function CustomerWorkJobRatingCard({
  workJob,
  onSaved,
}: {
  workJob: CustomerWorkJob;
  onSaved: (workJob: CustomerWorkJob) => void;
}) {
  const existingRating = workJob.rating ?? null;
  const canRate = workJob.status === "completed";
  const [rating, setRating] = useState(existingRating?.rating ?? 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(existingRating?.comment ?? "");
  const [errors, setErrors] = useState<RatingErrors>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedLabel = useMemo(() => ratingLabel(rating), [rating]);

  if (!canRate && !existingRating) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MessageSquareHeart className="size-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">
              Customer Satisfaction
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Rating opens once this work job is completed.
            </p>
          </div>
        </div>
      </section>
    );
  }

  function validateAndConfirm() {
    const parsed = ratingSchema.safeParse({ rating, comment: comment.trim() || undefined });

    if (!parsed.success) {
      setErrors(zodIssuesToFieldErrors<keyof RatingErrors>(parsed.error.issues));
      return;
    }

    setErrors({});
    setConfirmOpen(true);
  }

  async function saveRating() {
    const parsed = ratingSchema.safeParse({ rating, comment: comment.trim() || undefined });

    if (!parsed.success) {
      setErrors(zodIssuesToFieldErrors<keyof RatingErrors>(parsed.error.issues));
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      const response = await submitCustomerWorkJobRating(workJob.id, parsed.data);
      onSaved(response.data);
      toast.success(existingRating ? "Rating updated." : "Thank you. Your rating was saved.");
      setConfirmOpen(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to save rating.";
      const apiErrors = error instanceof ApiError ? error.errors : undefined;

      setErrors({
        form: message,
        rating: fieldError(apiErrors?.rating),
        comment: fieldError(apiErrors?.comment),
      });
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <MessageSquareHeart className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">
            Customer Satisfaction
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {existingRating ? "You can update your rating if needed." : "Tell us how the finished work went."}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <div className="flex items-center gap-1" onMouseLeave={() => setHoveredRating(0)}>
            {[1, 2, 3, 4, 5].map((value) => {
              const active = value <= (hoveredRating || rating);

              return (
                <button
                  key={value}
                  type="button"
                  className="rounded-md p-1 text-secondary transition hover:bg-secondary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                  onClick={() => {
                    setRating(value);
                    setErrors((current) => ({ ...current, rating: undefined }));
                  }}
                  onMouseEnter={() => setHoveredRating(value)}
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                >
                  <Star className={cn("size-6", active ? "fill-current" : "fill-none text-slate-300")} />
                </button>
              );
            })}
            <span className="ml-2 text-sm text-slate-500">{selectedLabel}</span>
          </div>
          {errors.rating && <p className="mt-1 text-xs text-destructive">{errors.rating}</p>}
        </div>

        <div>
          <Textarea
            value={comment}
            onChange={(event) => {
              setComment(event.target.value);
              setErrors((current) => ({ ...current, comment: undefined }));
            }}
            placeholder="Optional comment about the quality, timing, or service."
            className="min-h-24 resize-none text-sm"
            maxLength={1000}
          />
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className={errors.comment ? "text-destructive" : "text-slate-400"}>
              {errors.comment ?? "Optional, but helpful for our team."}
            </span>
            <span className="text-slate-400">{comment.length}/1000</span>
          </div>
        </div>

        {errors.form && (
          <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {errors.form}
          </p>
        )}

        <Button type="button" className="w-full" onClick={validateAndConfirm} disabled={saving}>
          {existingRating ? "Update Rating" : "Submit Rating"}
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{existingRating ? "Update satisfaction rating?" : "Submit satisfaction rating?"}</AlertDialogTitle>
            <AlertDialogDescription>
              This rating helps SOG Glass & Aluminum review completed work and improve service quality.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={saving} onClick={saveRating}>
              {saving ? "Saving..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function ratingLabel(rating: number) {
  if (rating <= 0) return "Choose a rating";
  if (rating === 1) return "Needs improvement";
  if (rating === 2) return "Fair";
  if (rating === 3) return "Good";
  if (rating === 4) return "Very good";

  return "Excellent";
}

function fieldError(error: string[] | string | undefined) {
  if (Array.isArray(error)) return error[0];

  return error;
}
