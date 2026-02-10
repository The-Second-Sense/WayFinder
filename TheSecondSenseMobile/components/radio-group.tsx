import React, { createContext, useContext } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

// Context pentru a gestiona starea grupului (ca în Radix)
const RadioGroupContext = createContext<{
  value?: string;
  onValueChange?: (val: string) => void;
}>({});

export function RadioGroup({ value, onValueChange, children, style }: any) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <View style={[styles.groupContainer, style]}>{children}</View>
    </RadioGroupContext.Provider>
  );
}

export function RadioGroupItem({
  value,
  label,
  disabled,
}: {
  value: string;
  label?: string;
  disabled?: boolean;
}) {
  const context = useContext(RadioGroupContext);
  const isSelected = context.value === value;

  return (
    <Pressable
      disabled={disabled}
      onPress={() => context.onValueChange?.(value)}
      style={[styles.itemContainer, disabled && styles.disabled]}
    >
      <View
        style={[
          styles.radioOuter,
          isSelected && styles.radioOuterSelected,
          disabled && styles.radioOuterDisabled,
        ]}
      >
        {isSelected && <View style={styles.radioInner} />}
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  groupContainer: {
    gap: 12, // Echivalentul gap-3 din Tailwind
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB", // border-input
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  radioOuterSelected: {
    borderColor: "#007AFF", // text-primary (Banking Blue)
  },
  radioOuterDisabled: {
    borderColor: "#E5E7EB",
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: "#007AFF", // fill-primary
  },
  label: {
    fontSize: 16,
    color: "#374151",
  },
  disabled: {
    opacity: 0.5,
  },
});
