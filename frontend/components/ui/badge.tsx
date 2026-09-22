import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none tracking-normal shadow-none transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#176b47] text-white",
        secondary: "border-transparent bg-[#edf2f6] text-[#425466]",
        outline: "border-[#d7e0e7] bg-white text-[#34495e]",
        destructive: "border-transparent bg-[#c83b46] text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
