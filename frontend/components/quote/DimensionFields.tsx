"use client";

import NumericInput from "@/components/form/NumericInput";
import { Label } from "@/components/ui/label";
import type { Product } from "@/features/products/types";
import { parseNumber } from "@/features/quotes/quote-utils";
import type { DimensionUnit } from "@/features/quotes/types";

type Dims = {
  width: string;
  height: string;
  thickness: string;
};

export default function DimensionFields({
  product,
  value,
  onChange,
  unit,
  onUnitChange,
}: {
  product: Product;
  value: Dims;
  onChange: (value: Dims) => void;
  unit: DimensionUnit;
  onUnitChange: (unit: DimensionUnit) => void;
}) {
  if (product.unit === "piece" || product.unit === "set") {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-[13px] text-slate-500">
        Priced per <strong>{product.unit}</strong>. Adjust pieces below.
      </div>
    );
  }

  const area = parseNumber(value.width) * parseNumber(value.height);
  const unitLabel = unit === "cm" ? "cm" : "m";

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
          Measurement unit
        </p>
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
          {[
            { value: "cm" as DimensionUnit, label: "Centimeters" },
            { value: "m" as DimensionUnit, label: "Meters" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onUnitChange(option.value)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors ${
                unit === option.value
                  ? "bg-primary text-white"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-end gap-3">
        <NumberField
          label={`${product.unit === "meter" ? "Length" : "Width"} (${unitLabel})`}
          value={toDisplayValue(value.width, unit)}
          onChange={(width) => onChange({ ...value, width: toMeters(width, unit) })}
        />
        {product.unit === "sqm" && (
          <>
            <span className="pb-2 font-bold text-slate-400">x</span>
            <NumberField
              label={`Height (${unitLabel})`}
              value={toDisplayValue(value.height, unit)}
              onChange={(height) => onChange({ ...value, height: toMeters(height, unit) })}
            />
            {area > 0 && (
              <div className="rounded-xl bg-blue-50 px-4 py-2.5 text-center">
                <p className="text-[10px] text-slate-500">Area</p>
                <p className="text-[13px] font-extrabold text-primary">{area.toFixed(2)} sqm</p>
              </div>
            )}
          </>
        )}
      </div>
      <div className="max-w-[220px]">
        <NumberField label="Thickness (mm)" value={value.thickness} onChange={(thickness) => onChange({ ...value, thickness })} optional />
      </div>
    </div>
  );
}

function toDisplayValue(value: string, unit: DimensionUnit) {
  if (!value || unit === "m") return value;
  return formatValue(parseNumber(value) * 100);
}

function toMeters(value: string, unit: DimensionUnit) {
  if (!value || unit === "m") return value;
  return formatValue(parseNumber(value) / 100);
}

function formatValue(value: number) {
  return String(Math.round(value * 10000) / 10000);
}

function NumberField({
  label,
  value,
  onChange,
  optional,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
}) {
  return (
    <div className="flex-1">
      <Label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label} {optional && <span className="font-normal normal-case text-slate-400">optional</span>}
      </Label>
      <NumericInput
        value={value}
        placeholder="0.00"
        decimalScale={2}
        onValueChange={onChange}
      />
    </div>
  );
}
