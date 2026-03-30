import React from "react";
import { DimensionValue, StyleSheet, View } from "react-native";

interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  className?: string; // Păstrat pentru compatibilitate dacă folosești NativeWind
  color?: string;
  thickness?: number;
  length?: DimensionValue;
}

export function Separator({
  orientation = "horizontal",
  color = "#E5E7EB", // bg-border (standard Tailwind/Shadcn)
  thickness = StyleSheet.hairlineWidth, // Cel mai subțire separator posibil pe ecran
  length = "100%",
  style,
}: any) {
  const isHorizontal = orientation === "horizontal";

  return (
    <View
      style={[
        {
          backgroundColor: color,
        },
        isHorizontal
          ? { height: thickness, width: length }
          : { width: thickness, height: length },
        style,
      ]}
    />
  );
}
