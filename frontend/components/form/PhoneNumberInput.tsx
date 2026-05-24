"use client";

import type { ComponentProps } from "react";
import { Smartphone } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { localPhilippineMobile } from "@/features/forms/validation";
import { cn } from "@/lib/utils";

type PhoneNumberInputProps = Omit<ComponentProps<typeof InputGroupInput>, "onChange" | "value"> & {
  value: string;
  onValueChange: (value: string) => void;
  groupClassName?: string;
};

export default function PhoneNumberInput({
  value,
  onValueChange,
  groupClassName,
  className,
  placeholder = "9XX XXX XXXX",
  maxLength = 10,
  inputMode = "numeric",
  autoComplete = "tel-national",
  ...props
}: PhoneNumberInputProps) {
  return (
    <InputGroup className={cn("h-10", groupClassName)}>
      <InputGroupAddon>
        <Smartphone className="size-4 text-muted-foreground" />
        <InputGroupText>+63</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        {...props}
        className={className}
        value={localPhilippineMobile(value)}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        autoComplete={autoComplete}
        onKeyDown={(event) => {
          if (["e", "E", "+", "-", "."].includes(event.key)) event.preventDefault();
        }}
        onPaste={(event) => {
          event.preventDefault();
          onValueChange(localPhilippineMobile(event.clipboardData.getData("text")));
        }}
        onChange={(event) => onValueChange(localPhilippineMobile(event.target.value))}
      />
    </InputGroup>
  );
}
