"use client";

import NumericInput from "@/components/form/NumericInput";
import { Label } from "@/components/ui/label";
import type { Product } from "@/features/products/types";
import {
  computeMeasuredQuantity,
  dimensionValueInMeters,
  isQuantityOnlyUnit,
} from "@/features/quotes/quote-utils";
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
  if (isQuantityOnlyUnit(product.unit)) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-[13px] text-slate-500">
        Priced per <strong>{product.unit}</strong>. Adjust pieces below.
      </div>
    );
  }

  const measuredQuantity = computeMeasuredQuantity(
    product.unit,
    dimensionValueInMeters(value.width, unit),
    dimensionValueInMeters(value.height, unit),
  );
  const unitLabel = unit === "cm" ? "cm" : "m";
  const usesHeight = product.unit !== "meter";

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
          value={value.width}
          onChange={(width) => onChange({ ...value, width })}
        />
        {usesHeight && (
          <>
            <span className="pb-2 font-bold text-slate-400">x</span>
            <NumberField
              label={`Height (${unitLabel})`}
              value={value.height}
              onChange={(height) => onChange({ ...value, height })}
            />
            {measuredQuantity > 0 && (
              <div className="rounded-xl bg-blue-50 px-4 py-2.5 text-center">
                <p className="text-[10px] text-slate-500">
                  {product.unit === "sqft" ? "Square feet" : "Area"}
                </p>
                <p className="text-[13px] font-extrabold text-primary">
                  {measuredQuantity.toFixed(2)} {product.unit}
                </p>
              </div>
            )}
          </>
        )}
      </div>
      <div className="max-w-[220px]">
        <NumberField
          label="Thickness (mm)"
          value={value.thickness}
          onChange={(thickness) => onChange({ ...value, thickness })}
          optional
        />
      </div>
    </div>
  );
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
