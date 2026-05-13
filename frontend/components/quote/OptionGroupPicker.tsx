"use client";

import { Badge } from "@/components/ui/badge";
import type { Product } from "@/features/products/types";
import type { SelectedQuoteOption } from "@/features/quotes/types";
import {
  formatCurrency,
  optionGroupOptions,
  productOptionGroups,
  toggleQuoteOption,
} from "@/features/quotes/quote-utils";

export default function OptionGroupPicker({
  product,
  selected,
  onChange,
}: {
  product: Product;
  selected: SelectedQuoteOption[];
  onChange: (options: SelectedQuoteOption[]) => void;
}) {
  const groups = productOptionGroups(product);
  if (groups.length === 0) return null;

  return (
    <section className="mb-5">
      <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Options
      </p>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {groups.map((group) => {
          const selectedForGroup = selected.find(
            (option) => option.product_option_group_id === group.id,
          );

          return (
            <div
              key={group.id}
              className={`rounded-xl border p-4 transition-colors ${
                selectedForGroup ? "border-primary bg-blue-50/40" : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="text-[12px] font-bold text-slate-900">{group.name}</span>
                {group.is_required ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                ) : (
                  <Badge variant="outline" className="border-slate-200 px-1.5 py-0 text-[9px] text-slate-400">
                    optional
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {optionGroupOptions(group).map((option) => {
                  const active = selectedForGroup?.product_option_id === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => onChange(toggleQuoteOption(selected, group.id, option.id, product))}
                      className={`rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-all ${
                        active
                          ? "border-primary bg-primary text-white"
                          : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      {option.name}
                      {Number(option.price_modifier) > 0 && (
                        <span className="ml-1.5 text-[9px] opacity-70">
                          +{formatCurrency(option.price_modifier)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
