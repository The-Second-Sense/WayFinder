import React, { createContext, useContext } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";

// --- Configurare Variante (Echivalent CVA) ---
const COLORS = {
  primary: "#007AFF",
  accent: "#E0EFFF",
  muted: "#F3F4F6",
  border: "#E5E7EB",
  text: "#374151",
  textAccent: "#007AFF",
};

// --- Context pentru Grup ---
const ToggleGroupContext = createContext<{
  value?: string | string[];
  onValueChange?: (val: string) => void;
  variant?: "default" | "outline";
}>({});

// --- Componenta Toggle (Item Individual) ---
export function Toggle({
  children,
  pressed,
  onPressedChange,
  variant = "default",
  style,
}: any) {
  return (
    <Pressable
      onPress={() => onPressedChange?.(!pressed)}
      style={({ pressed: isHitting }) => [
        styles.toggleBase,
        variant === "outline" && styles.outlineVariant,
        pressed && styles.pressedState,
        isHitting && { opacity: 0.7 },
        style,
      ]}
    >
      <Text style={[styles.textBase, pressed && styles.textPressed]}>
        {children}
      </Text>
    </Pressable>
  );
}

// --- Componenta ToggleGroup ---
export function ToggleGroup({
  value,
  onValueChange,
  variant = "default",
  children,
  type = "single",
}: any) {
  const handleSelect = (itemValue: string) => {
    if (type === "single") {
      onValueChange?.(itemValue === value ? "" : itemValue);
    } else {
      const newValue = Array.isArray(value) ? [...value] : [];
      const index = newValue.indexOf(itemValue);
      if (index > -1) newValue.splice(index, 1);
      else newValue.push(itemValue);
      onValueChange?.(newValue);
    }
  };

  return (
    <ToggleGroupContext.Provider
      value={{ value, onValueChange: handleSelect, variant }}
    >
      <View style={styles.groupContainer}>{children}</View>
    </ToggleGroupContext.Provider>
  );
}

export function ToggleGroupItem({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  const context = useContext(ToggleGroupContext);
  const isPressed = Array.isArray(context.value)
    ? context.value.includes(value)
    : context.value === value;

  return (
    <Toggle
      variant={context.variant}
      pressed={isPressed}
      onPressedChange={() => context.onValueChange?.(value)}
      style={styles.groupItem}
    >
      {children}
    </Toggle>
  );
}

// --- Stiluri ---
const styles = StyleSheet.create({
  groupContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.muted,
    borderRadius: 10,
    padding: 2,
    alignSelf: "flex-start",
  },
  toggleBase: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  groupItem: {
    borderRadius: 8,
    marginHorizontal: 1,
  },
  outlineVariant: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "transparent",
  },
  pressedState: {
    backgroundColor: "#FFFFFF", // Stil "Segmented Control"
    // Umbră pentru item-ul selectat
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  textBase: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
  },
  textPressed: {
    color: "#000000",
    fontWeight: "600",
  },
});
