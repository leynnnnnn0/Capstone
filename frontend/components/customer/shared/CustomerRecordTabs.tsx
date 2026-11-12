import type { LucideIcon } from "lucide-react";
import { Tabs } from "radix-ui";

export const customerRecordTabPanelClass = "mt-5 min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function CustomerRecordTabs({
  label,
  tabs,
  attentionTab,
}: {
  label: string;
  tabs: { value: string; label: string; icon: LucideIcon }[];
  attentionTab?: string;
}) {
  return (
    <Tabs.List aria-label={label} className="flex flex-wrap gap-x-4 border-b border-border sm:gap-x-6">
      {tabs.map(({ value, label: tabLabel, icon: Icon }) => (
        <Tabs.Trigger
          key={value}
          value={value}
          aria-description={value === attentionTab ? "Action required" : undefined}
          className="group/tab inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 border-transparent px-1 text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-[state=active]:border-primary data-[state=active]:text-primary"
        >
          <Icon aria-hidden="true" className="size-4" />
          {tabLabel}
          {value === attentionTab && (
            <span aria-hidden="true" className="relative flex size-2 shrink-0">
              <span className="absolute inset-0 rounded-full bg-red-500 opacity-70 motion-safe:animate-ping motion-reduce:hidden group-data-[state=active]/tab:hidden" />
              <span className="relative size-full rounded-full bg-red-600" />
            </span>
          )}
        </Tabs.Trigger>
      ))}
    </Tabs.List>
  );
}
