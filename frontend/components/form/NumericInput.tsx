"use client";

import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { sanitizeNumericInput } from "@/features/forms/validation";

type NumericInputProps = Omit<ComponentProps<typeof Input>, "onChange" | "value" | "type"> & {
  value: string | number;
  allowDecimal?: boolean;
  decimalScale?: number;
  onValueChange: (value: string) => void;
};

export default function NumericInput({
  value,
  allowDecimal = true,
  decimalScale,
  inputMode,
  onValueChange,
  onKeyDown,
  onPaste,
  ...props
}: NumericInputProps) {
  return (
    <Input
      {...props}
      type="text"
      inputMode={inputMode ?? (allowDecimal ? "decimal" : "numeric")}
      value={String(value ?? "")}
      onKeyDown={(event) => {
        if (["e", "E", "+", "-", ...(!allowDecimal ? ["."] : [])].includes(event.key)) {
          event.preventDefault();
          return;
        }

        onKeyDown?.(event);
      }}
      onPaste={(event) => {
        const pasted = event.clipboardData.getData("text");
        const sanitized = sanitizeNumericInput(pasted, { allowDecimal, decimalScale });

        if (pasted !== sanitized) {
          event.preventDefault();
          onValueChange(sanitized);
          return;
        }

        onPaste?.(event);
      }}
      onChange={(event) =>
        onValueChange(sanitizeNumericInput(event.target.value, { allowDecimal, decimalScale }))
      }
    />
  );
}
