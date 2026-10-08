"use client";

import type { ReactElement } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DisabledSubmitTooltip({
  reason,
  children,
}: {
  reason: string | null;
  children: ReactElement;
}) {
  if (!reason) return children;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="block w-full cursor-help"
            tabIndex={0}
            aria-label={reason}
          >
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8}>
          {reason}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
