"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import * as RechartsPrimitive from "recharts";

const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
    theme?: Partial<Record<keyof typeof THEMES, string>>;
  }
>;

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        className={cn(
          "flex aspect-video justify-center text-xs text-[#5c3a25]",
          "[&_.recharts-cartesian-axis-tick_text]:fill-[#8f7461]",
          "[&_.recharts-cartesian-grid_line]:stroke-[#eadccf]",
          "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-[#d8c5b2]",
          "[&_.recharts-layer]:outline-none [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        data-chart={chartId}
        ref={ref}
        {...props}
      >
        <ChartStyle config={config} id={chartId} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "Chart";

function ChartStyle({ config, id }: { config: ChartConfig; id: string }) {
  const colorConfig = Object.entries(config).filter(([, item]) => item.theme || item.color);

  if (!colorConfig.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color = itemConfig.theme?.[theme as keyof typeof THEMES] || itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .filter(Boolean)
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  );
}

const ChartTooltip = RechartsPrimitive.Tooltip;

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean;
      hideIndicator?: boolean;
      indicator?: "line" | "dot" | "dashed";
      nameKey?: string;
      labelKey?: string;
    }
>(
  (
    {
      active,
      className,
      formatter,
      hideIndicator = false,
      hideLabel = false,
      indicator = "dot",
      label,
      labelFormatter,
      labelKey,
      nameKey,
      payload,
    },
    ref
  ) => {
    const { config } = useChart();

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) return null;
      const item = payload[0] as Record<string, unknown>;
      const key = `${labelKey || item.dataKey || item.name || "value"}`;
      const itemConfig = getPayloadConfigFromPayload(config, item, key);
      const value = !labelKey && typeof label === "string" ? config[label]?.label || label : itemConfig?.label;

      if (labelFormatter) {
        return <div className="font-black text-[#3a2619]">{labelFormatter(value as string, payload)}</div>;
      }

      if (!value) return null;
      return <div className="font-black text-[#3a2619]">{value}</div>;
    }, [config, hideLabel, label, labelFormatter, labelKey, payload]);

    if (!active || !payload?.length) return null;

    const nestLabel = payload.length === 1 && indicator !== "dot";

    return (
      <div
        className={cn("grid min-w-[9rem] items-start gap-1.5 rounded-lg border border-[#eadccf] bg-[#fffdf8] px-3 py-2 text-xs shadow-xl shadow-[#3a2619]/10", className)}
        ref={ref}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const payloadItem = item as Record<string, any>;
            const key = `${nameKey || payloadItem.name || payloadItem.dataKey || "value"}`;
            const itemConfig = getPayloadConfigFromPayload(config, payloadItem, key);
            const indicatorColor = payloadItem.payload?.fill || payloadItem.color;

            return (
              <div className={cn("flex w-full flex-wrap items-stretch gap-2", indicator === "dot" && "items-center")} key={`${payloadItem.dataKey}-${index}`}>
                {formatter && payloadItem.value !== undefined && payloadItem.name ? (
                  formatter(payloadItem.value, payloadItem.name, item, index, payloadItem.payload)
                ) : (
                  <>
                    {!hideIndicator && (
                      <div
                        className={cn(
                          "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                          indicator === "dot" && "h-2.5 w-2.5",
                          indicator === "line" && "w-1",
                          indicator === "dashed" && "w-0 border-[1.5px] border-dashed bg-transparent",
                          nestLabel && indicator === "dashed" && "my-0.5"
                        )}
                        style={
                          {
                            "--color-bg": indicatorColor,
                            "--color-border": indicatorColor,
                          } as React.CSSProperties
                        }
                      />
                    )}
                    <div className={cn("flex flex-1 justify-between gap-4 leading-none", nestLabel ? "items-end" : "items-center")}>
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="font-semibold text-[#8f7461]">{itemConfig?.label || payloadItem.name}</span>
                      </div>
                      {payloadItem.value !== undefined && (
                        <span className="font-mono font-black tabular-nums text-[#3a2619]">{Number(payloadItem.value).toLocaleString()}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
ChartTooltipContent.displayName = "ChartTooltip";

const ChartLegend = RechartsPrimitive.Legend;

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & { hideIcon?: boolean; nameKey?: string }
>(({ className, hideIcon = false, nameKey, payload, verticalAlign = "bottom" }, ref) => {
  const { config } = useChart();

  if (!payload?.length) return null;

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-bold text-[#6d5444]", verticalAlign === "top" ? "pb-3" : "pt-3", className)} ref={ref}>
      {payload.map((item) => {
        const key = `${nameKey || item.dataKey || item.value || "value"}`;
        const itemConfig = getPayloadConfigFromPayload(config, item as unknown as Record<string, unknown>, key);

        return (
          <div className="flex items-center gap-1.5" key={String(item.value)}>
            {!hideIcon && <div className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: item.color }} />}
            {itemConfig?.label || String(item.value)}
          </div>
        );
      })}
    </div>
  );
});
ChartLegendContent.displayName = "ChartLegend";

function getPayloadConfigFromPayload(config: ChartConfig, payload: Record<string, unknown>, key: string) {
  const payloadPayload = "payload" in payload && typeof payload.payload === "object" && payload.payload !== null ? (payload.payload as Record<string, unknown>) : undefined;
  let configLabelKey = key;

  if (key in payload && typeof payload[key] === "string") {
    configLabelKey = payload[key] as string;
  } else if (payloadPayload && key in payloadPayload && typeof payloadPayload[key] === "string") {
    configLabelKey = payloadPayload[key] as string;
  }

  return configLabelKey in config ? config[configLabelKey] : config[key];
}

export { ChartContainer, ChartLegend, ChartLegendContent, ChartStyle, ChartTooltip, ChartTooltipContent };
