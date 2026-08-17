import * as React from "react";

import { cn } from "@/lib/utils";

function TableFrame({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.25rem] border border-[#dce4ea] bg-card shadow-[0_16px_45px_rgba(22,45,74,0.065)]",
        className,
      )}
      {...props}
    />
  );
}

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="w-full overflow-auto overscroll-x-contain">
      <table
        className={cn(
          "w-full caption-bottom border-separate border-spacing-0 text-xs text-foreground sm:text-sm",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      className={cn(
        "bg-[#f4f7f9] [&_tr]:border-b [&_tr]:border-[#dce4ea] [&_tr]:hover:bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      className={cn("bg-card [&_tr:last-child_td]:border-b-0", className)}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "group transition-colors duration-150 hover:bg-[#f7fafc] data-[state=selected]:bg-[#edf4f9]",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "h-11 border-b border-[#dce4ea] px-3 text-left align-middle text-[10px] font-bold uppercase tracking-[0.1em] text-[#667584] first:pl-4 last:pr-4 sm:h-12 sm:px-4 sm:text-[11px] sm:first:pl-5 sm:last:pr-5",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      className={cn(
        "border-b border-[#e7edf1] px-3 py-3 align-middle first:pl-4 last:pr-4 sm:px-4 sm:py-4 sm:first:pl-5 sm:last:pr-5",
        className,
      )}
      {...props}
    />
  );
}

export { Table, TableBody, TableCell, TableFrame, TableHead, TableHeader, TableRow };
