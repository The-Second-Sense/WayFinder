import { Check, ChevronDown } from "lucide-react-native";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";

// --- Sub-componente ---

export function Select({ children, value, onValueChange }: any) {
  const [isOpen, setIsOpen] = useState(false);

  // Clonează copiii pentru a le pasa starea de deschidere și valoarea
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, {
        isOpen,
        setIsOpen,
        value,
        onValueChange,
      });
    }
    return child;
  });

  return <View style={styles.container}>{childrenWithProps}</View>;
}

export function SelectTrigger({ value, setIsOpen, placeholder }: any) {
  return (
    <Pressable onPress={() => setIsOpen(true)} style={styles.trigger}>
      <Text style={[styles.valueText, !value && styles.placeholder]}>
        {value || placeholder || "Selectează opțiunea"}
      </Text>
      <ChevronDown size={18} color="#6B7280" />
    </Pressable>
  );
}

export function SelectContent({ isOpen, setIsOpen, children, title }: any) {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={() => setIsOpen(false)}
    >
      <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
        <View style={styles.sheetContent}>
          <View style={styles.handle} />
          {title && <Text style={styles.sheetTitle}>{title}</Text>}
          <View style={styles.listContainer}>{children}</View>
        </View>
      </Pressable>
    </Modal>
  );
}

export function SelectItem({
  value,
  label,
  currentValue,
  onValueChange,
  setIsOpen,
}: any) {
  const isSelected = value === currentValue;

  return (
    <Pressable
      style={[styles.item, isSelected && styles.itemSelected]}
      onPress={() => {
        onValueChange(value);
        setIsOpen(false);
      }}
    >
      <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
        {label}
      </Text>
      {isSelected && <Check size={18} color="#007AFF" />}
    </Pressable>
  );
}

// --- Stiluri ---

const styles = StyleSheet.create({
  container: { width: "100%" },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: "#F9FAFB",
  },
  valueText: { fontSize: 16, color: "#1F2937" },
  placeholder: { color: "#9CA3AF" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheetContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    alignSelf: "center",
    marginVertical: 10,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
    color: "#111827",
  },
  listContainer: { paddingHorizontal: 16 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F4F6",
  },
  itemSelected: {
    backgroundColor: "#F0F7FF",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  itemText: { fontSize: 16, color: "#374151" },
  itemTextSelected: { color: "#007AFF", fontWeight: "600" },
});
