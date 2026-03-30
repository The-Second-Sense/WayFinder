import * as React from "react";
import { Text, View, type ViewProps } from "react-native";
import { cn } from "../hooks/utils";

// Format: { THEME_NAME: CSS_SELECTOR } - În Mobile folosim de obicei scheme de culori directe
const THEMES = { light: "light", dark: "dark" } as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType<{ size?: number; color?: string }>;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

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

function ChartContainer({
  className,
  children,
  config,
  ...props
}: ViewProps & {
  config: ChartConfig;
  children: React.ReactNode;
}) {
  return (
    <ChartContext.Provider value={{ config }}>
      {/* Aspect-video ajută la menținerea proporțiilor pe ecrane diferite */}
      <View
        data-slot="chart"
        className={cn(
          "flex aspect-video justify-center text-xs w-full",
          className,
        )}
        {...props}
      >
        {children}
      </View>
    </ChartContext.Provider>
  );
}

// În Mobile, nu avem tag-ul <style>. Această funcție ajută la extragerea culorii
// pentru a fi pasată direct props-urilor graficului nativ.
export function getChartColor(
  config: ChartConfig,
  key: string,
  theme: keyof typeof THEMES = "light",
) {
  const itemConfig = config[key];
  if (!itemConfig) return undefined;
  return itemConfig.theme ? itemConfig.theme[theme] : itemConfig.color;
}

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  label,
  labelClassName,
}: any) {
  const { config } = useChart();

  if (!active || !payload?.length) return null;

  return (
    <View
      className={cn(
        "bg-background border border-border/50 p-2.5 rounded-lg shadow-lg min-w-[120px]",
        className,
      )}
    >
      {!hideLabel && (
        <Text className={cn("font-medium mb-1", labelClassName)}>{label}</Text>
      )}
      <View className="gap-1.5">
        {payload.map((item: any, index: number) => {
          const key = item.name || item.dataKey;
          const itemConfig = config[key];
          const color = item.color || itemConfig?.color;

          return (
            <View key={index} className="flex-row items-center gap-2">
              {indicator === "dot" && (
                <View
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
              )}
              <View className="flex-1 flex-row justify-between items-center">
                <Text className="text-muted-foreground text-[10px]">
                  {itemConfig?.label || key}
                </Text>
                <Text className="text-foreground font-mono font-medium ml-2">
                  {item.value}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ChartLegendContent({ className, payload }: any) {
  const { config } = useChart();
  if (!payload?.length) return null;

  return (
    <View
      className={cn(
        "flex-row flex-wrap items-center justify-center gap-4 pt-4",
        className,
      )}
    >
      {payload.map((item: any, index: number) => {
        const key = item.dataKey || item.value;
        const itemConfig = config[key];

        return (
          <View key={index} className="flex-row items-center gap-1.5">
            <View
              className="h-2 w-2 rounded-[2px]"
              style={{ backgroundColor: item.color }}
            />
            <Text className="text-xs text-foreground">
              {itemConfig?.label || key}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export { ChartContainer, ChartLegendContent, ChartTooltipContent };
