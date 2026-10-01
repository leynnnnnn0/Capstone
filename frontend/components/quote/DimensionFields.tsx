"use client";

import NumericInput from "@/components/form/NumericInput";
import { Label } from "@/components/ui/label";
import type { Product } from "@/features/products/types";
import {
  computeMeasuredQuantity,
  displayedDimensionLimit,
  dimensionValueInMeters,
  isAreaUnit,
  isQuantityOnlyUnit,
  QUOTE_LIMITS,
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
      <div className={`grid gap-3 ${usesHeight ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        <NumberField
          label={`${product.unit === "meter" ? "Length" : "Width"} (${unitLabel})`}
          value={value.width}
          maxValue={displayedDimensionLimit("width", unit, product.unit)}
          onChange={(width) => onChange({ ...value, width })}
          optional={isQuantityOnlyUnit(product.unit)}
        />
        {usesHeight && (
          <NumberField
            label={`Height (${unitLabel})`}
            value={value.height}
            maxValue={displayedDimensionLimit("height", unit, product.unit)}
            onChange={(height) => onChange({ ...value, height })}
            optional={isQuantityOnlyUnit(product.unit)}
          />
        )}
        <NumberField
          label="Depth (mm)"
          value={value.thickness}
          maxValue={QUOTE_LIMITS.thicknessMillimeters}
          onChange={(thickness) => onChange({ ...value, thickness })}
          optional
        />
      </div>
      {isAreaUnit(product.unit) && measuredQuantity > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3">
          <span className="text-[11px] font-semibold text-slate-500">
            {product.unit === "sqft" ? "Calculated square feet" : "Calculated area"}
          </span>
          <span className="text-[14px] font-extrabold text-primary">
            {measuredQuantity.toFixed(2)} {product.unit}
          </span>
        </div>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  optional,
  maxValue,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
  maxValue: number;
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
        maxValue={maxValue}
        onValueChange={onChange}
      />
      <p className="mt-1 text-[10px] text-slate-400">Maximum {maxValue.toLocaleString("en-PH")}</p>
    </div>
  );
}
