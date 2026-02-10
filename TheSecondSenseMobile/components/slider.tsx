import SliderComponent from "@react-native-community/slider";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

// Definim culorile pentru a păstra aspectul de "Banking" (Clean & Professional)
const COLORS = {
  primary: "#007AFF", // Albastru banking standard
  background: "#FFFFFF",
  muted: "#E5E7EB",
  ring: "rgba(0, 122, 255, 0.2)",
};

interface SliderProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  onValueChange?: (value: number) => void;
  step?: number;
  disabled?: boolean;
}

export function Slider({
  value,
  defaultValue,
  min = 0,
  max = 100,
  onValueChange,
  step = 1,
  disabled = false,
}: SliderProps) {
  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <SliderComponent
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        value={value ?? defaultValue}
        onValueChange={onValueChange}
        step={step}
        disabled={disabled}
        // Culori specifice pentru Android/iOS
        minimumTrackTintColor={COLORS.primary}
        maximumTrackTintColor={COLORS.muted}
        thumbTintColor={Platform.OS === "android" ? COLORS.primary : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 40,
    justifyContent: "center",
    marginVertical: 10,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  disabled: {
    opacity: 0.5,
  },
});
