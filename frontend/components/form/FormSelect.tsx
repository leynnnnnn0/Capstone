"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SelectOption<TValue extends string> = {
  label: string;
  value: TValue;
};

type FormSelectProps<TValue extends string> = {
  id: string;
  label: string;
  value: TValue;
  options: SelectOption<TValue>[];
  onValueChange: (value: TValue) => void;
  placeholder?: string;
  error?: string;
};

export default function FormSelect<TValue extends string>({
  id,
  label,
  value,
  options,
  onValueChange,
  placeholder = "Select an option",
  error,
}: FormSelectProps<TValue>) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={(nextValue) => onValueChange(nextValue as TValue)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
