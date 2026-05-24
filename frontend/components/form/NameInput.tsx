"use client";

import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { sanitizePersonName } from "@/features/forms/validation";

type NameInputProps = Omit<ComponentProps<typeof Input>, "onChange" | "value"> & {
  value: string;
  onValueChange: (value: string) => void;
};

export default function NameInput({
  value,
  onValueChange,
  autoComplete = "name",
  inputMode = "text",
  ...props
}: NameInputProps) {
  return (
    <Input
      {...props}
      value={value}
      autoComplete={autoComplete}
      inputMode={inputMode}
      onChange={(event) => onValueChange(sanitizePersonName(event.target.value))}
    />
  );
}
