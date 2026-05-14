"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode;
    color?: string;
  };
};

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) throw new Error("useChart must be used within a <ChartContainer />");
  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn("flex aspect-video justify-center text-xs", className)}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(([, item]) => item.color);
  if (!colorConfig.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
[data-chart=${id}] {
${colorConfig.map(([key, item]) => `  --color-${key}: ${item.color};`).join("\n")}
}
`,
      }}
    />
  );
}

type ChartTooltipContentProps = React.ComponentProps<"div"> & {
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    name?: string | number;
    color?: string;
    value?: unknown;
  }>;
  label?: React.ReactNode;
};

function ChartTooltipContent({
  active,
  payload,
  label,
  className,
}: ChartTooltipContentProps) {
  const { config } = useChart();

  if (!active || !payload?.length) return null;

  return (
    <div className={cn("grid min-w-[8rem] gap-1.5 rounded-lg border bg-background px-2.5 py-2 text-xs shadow-md", className)}>
      {label && <div className="font-medium">{label}</div>}
      <div className="grid gap-1.5">
        {payload.map((item) => {
          const key = String(item.dataKey ?? item.name ?? "");
          const itemConfig = config[key];

          return (
            <div key={key} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: item.color ?? itemConfig?.color }}
                />
                <span className="text-muted-foreground">{itemConfig?.label ?? item.name}</span>
              </div>
              <span className="font-mono font-medium tabular-nums">{formatValue(item.value)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatValue(value: unknown) {
  if (typeof value === "number") return value.toLocaleString("en-PH");
  return String(value ?? "");
}

export {
  ChartContainer,
  ChartTooltipContent,
};
