import * as React from "react";

import { cn } from "@/lib/utils";

function TableFrame({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border bg-card",
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
        "bg-muted/40 [&_tr]:border-b [&_tr]:hover:bg-transparent",
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
        "group transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
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
        "h-10 border-b px-3 text-left align-middle text-xs font-medium text-muted-foreground first:pl-4 last:pr-4 sm:px-4",
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
        "border-b px-3 py-3 align-middle first:pl-4 last:pr-4 sm:px-4",
        className,
      )}
      {...props}
    />
  );
}

export { Table, TableBody, TableCell, TableFrame, TableHead, TableHeader, TableRow };
