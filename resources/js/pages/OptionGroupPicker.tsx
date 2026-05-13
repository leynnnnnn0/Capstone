import { Badge } from '@/components/ui/badge';
import type { ProductOptionGroup, SelectedOption } from '@/types'
import { fmt } from '@/lib/quoteUtils';

interface Props {
    groups: ProductOptionGroup[];
    selected: SelectedOption[];
    onChange: (updated: SelectedOption[]) => void;
}

export function OptionGroupPicker({ groups, selected, onChange }: Props) {
    if (groups.length === 0) return null;

    const handleToggle = (
        group: ProductOptionGroup,
        optionId: number,
        optionName: string,
        priceModifier: number,
    ) => {
        const existing = selected.find(
            (s) => s.product_option_group_id === group.id,
        );

        if (existing?.product_option_id === optionId) {
            // Deselect — only allowed on optional groups
            if (!group.is_required) {
                onChange(
                    selected.filter(
                        (s) => s.product_option_group_id !== group.id,
                    ),
                );
            }
            return;
        }

        // Replace or add
        const without = selected.filter(
            (s) => s.product_option_group_id !== group.id,
        );
        onChange([
            ...without,
            {
                product_option_group_id: group.id,
                product_option_id: optionId,
                group_name: group.name,
                option_name: optionName,
                price_modifier: priceModifier,
            },
        ]);
    };

    return (
        <div className="space-y-3">
            {groups.map((group) => {
                const selectedForGroup = selected.find(
                    (s) => s.product_option_group_id === group.id,
                );
                const isGroupSelected = !!selectedForGroup;

                return (
                    <div
                        key={group.id}
                        className="rounded-xl p-4 transition-colors"
                        style={{
                            background: '#f8fafc',
                            border: `1.5px solid ${isGroupSelected ? '#2c5282' : '#e2e8f0'}`,
                        }}
                    >
                        {/* Group header */}
                        <div className="mb-3 flex items-center gap-2">
                            <span className="text-[12px] font-bold text-slate-900">
                                {group.name}
                            </span>
                            {group.is_required ? (
                                <span
                                    className="inline-block h-1.5 w-1.5 rounded-full"
                                    style={{ background: '#2c5282' }}
                                />
                            ) : (
                                <Badge
                                    variant="outline"
                                    className="border-slate-200 px-1.5 py-0 text-[9px] text-slate-400"
                                >
                                    optional
                                </Badge>
                            )}
                        </div>

                        {/* Option chips */}
                        <div className="flex flex-wrap gap-2">
                            {group.product_options.map((opt) => {
                                const active =
                                    selectedForGroup?.product_option_id ===
                                    opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() =>
                                            handleToggle(
                                                group,
                                                opt.id,
                                                opt.name,
                                                opt.price_modifier,
                                            )
                                        }
                                        className="cursor-pointer rounded-lg text-[11px] font-semibold transition-all duration-150"
                                        style={{
                                            padding: '6px 11px',
                                            background: active
                                                ? '#2c5282'
                                                : 'white',
                                            color: active ? 'white' : '#475569',
                                            border: active
                                                ? '2px solid #2c5282'
                                                : '1.5px solid #e2e8f0',
                                        }}
                                    >
                                        {opt.name}
                                        {opt.price_modifier > 0 && (
                                            <span
                                                className="ml-1.5 text-[9px]"
                                                style={{
                                                    opacity: active
                                                        ? 0.75
                                                        : 0.5,
                                                }}
                                            >
                                                +₱{fmt(opt.price_modifier)}
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
    );
}
