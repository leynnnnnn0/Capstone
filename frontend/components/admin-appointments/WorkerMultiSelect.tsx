"use client";

import { Label } from "@/components/ui/label";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import type { AdminWorker } from "@/features/admin-appointments/types";

export default function WorkerMultiSelect({
  workers,
  value,
  onChange,
  label = "Assigned Workers",
  error,
}: {
  workers: AdminWorker[];
  value: number[];
  onChange: (value: number[]) => void;
  label?: string;
  error?: string;
}) {
  const options: MultiSelectOption[] = workers.map((worker) => ({
    label: worker.full_name,
    value: String(worker.id),
  }));

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <MultiSelect
        options={options}
        defaultValue={value.map(String)}
        onValueChange={(nextValue) => onChange(nextValue.map(Number))}
        placeholder={workers.length ? "Select workers" : "No available workers for this slot"}
        maxCount={3}
        hideSelectAll
        className="w-full"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
