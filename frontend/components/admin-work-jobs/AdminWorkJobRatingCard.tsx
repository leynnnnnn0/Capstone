"use client";

import { CalendarClock, MessageSquareHeart, Star, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { AdminWorkJob } from "@/features/admin-work-jobs/types";
import { formatCustomerDateTime } from "@/features/customer/customer-utils";
import { cn } from "@/lib/utils";

export default function AdminWorkJobRatingCard({ workJob }: { workJob: AdminWorkJob }) {
  const rating = workJob.rating ?? null;
  const isCompleted = workJob.status === "completed";

  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquareHeart className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Customer Satisfaction</h2>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {rating
              ? "Customer feedback for this completed work job."
              : isCompleted
                ? "Waiting for the customer to submit a rating."
                : "Rating becomes available after completion."}
          </p>
        </div>
        {rating && (
          <Badge variant="outline" className="border-secondary/30 bg-secondary/10 text-secondary-foreground">
            {rating.rating}/5
          </Badge>
        )}
      </div>

      {rating ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-1">
              <RatingStars rating={rating.rating} />
              <span className="ml-2 text-xs font-medium text-muted-foreground">
                {ratingLabel(rating.rating)}
              </span>
            </div>

            {rating.comment ? (
              <p className="mt-3 rounded-md border bg-background px-3 py-2 text-sm leading-relaxed text-foreground">
                {rating.comment}
              </p>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">No comment was added.</p>
            )}
          </div>

          <div className="grid gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <UserRound className="size-4 text-primary" />
              <span>
                By{" "}
                <span className="font-medium text-foreground">
                  {rating.customer?.full_name ?? workJob.full_name}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarClock className="size-4 text-primary" />
              <span>{formatCustomerDateTime(rating.submitted_at ?? rating.created_at)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
          {isCompleted
            ? "No satisfaction rating has been submitted yet."
            : "Complete this work job first before requesting feedback."}
        </div>
      )}
    </section>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-secondary">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={cn("size-4", value <= rating ? "fill-current" : "fill-none text-muted-foreground/40")}
        />
      ))}
    </div>
  );
}

function ratingLabel(rating: number) {
  if (rating === 1) return "Needs improvement";
  if (rating === 2) return "Fair";
  if (rating === 3) return "Good";
  if (rating === 4) return "Very good";

  return "Excellent";
}
