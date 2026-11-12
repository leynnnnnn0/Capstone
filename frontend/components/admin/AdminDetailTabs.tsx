"use client";

import { useState, type ReactNode } from "react";
import { Tabs } from "radix-ui";

export default function AdminDetailTabs({
  label,
  tabs,
  attentionTab,
}: {
  label: string;
  attentionTab?: string;
  tabs: { value: string; label: string; content: ReactNode }[];
}) {
  const [selectedTab, setSelectedTab] = useState("overview");
  const activeTab = tabs.some(({ value }) => value === selectedTab) ? selectedTab : "overview";

  return (
    <Tabs.Root value={activeTab} onValueChange={setSelectedTab}>
      <Tabs.List aria-label={label} className="flex flex-wrap gap-x-5 border-b">
        {tabs.map(({ value, label: tabLabel }) => (
          <Tabs.Trigger
            key={value}
            value={value}
            aria-description={value === attentionTab ? "Action required" : undefined}
            className="group/tab inline-flex min-h-11 items-center gap-2 border-b-2 border-transparent px-1 text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-[state=active]:border-primary data-[state=active]:text-primary"
          >
            {tabLabel}
            {value === attentionTab && (
              <span aria-hidden="true" className="relative flex size-2 shrink-0">
                <span className="absolute inset-0 rounded-full bg-red-500 opacity-70 motion-safe:animate-ping group-data-[state=active]/tab:hidden" />
                <span className="relative size-full rounded-full bg-red-600" />
              </span>
            )}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {tabs.map(({ value, content }) => (
        <Tabs.Content
          key={value}
          value={value}
          forceMount
          className="mt-4 min-w-0 space-y-4 outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=inactive]:hidden"
        >
          {content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
