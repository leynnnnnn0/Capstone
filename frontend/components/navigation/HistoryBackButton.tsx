"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { hasPreviousPublicRoute } from "@/lib/public-route-history";

type HistoryBackButtonProps = {
  fallbackHref: string;
  label?: string;
  className?: string;
};

export default function HistoryBackButton({
  fallbackHref,
  label = "Back",
  className,
}: HistoryBackButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (hasPreviousPublicRoute()) {
          router.back();
          return;
        }

        router.push(fallbackHref);
      }}
      className={cn("inline-flex items-center gap-2", className)}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
