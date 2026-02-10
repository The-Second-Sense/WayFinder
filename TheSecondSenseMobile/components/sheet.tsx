import { X } from "lucide-react-native";
import React from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export function Sheet({ open, onOpenChange, children }: any) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={() => onOpenChange(false)}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.dismissArea}
          onPress={() => onOpenChange(false)}
        />
        <View style={styles.content}>
          <SafeAreaView>
            {/* Handle pentru gesturi vizuale */}
            <View style={styles.handle} />
            {children}
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

export function SheetContent({ children, onOpenChange }: any) {
  return (
    <View style={styles.innerContent}>
      {children}
      <Pressable onPress={() => onOpenChange(false)} style={styles.closeButton}>
        <X size={20} color="#6B7280" />
      </Pressable>
    </View>
  );
}

export function SheetHeader({ children }: any) {
  return <View style={styles.header}>{children}</View>;
}

export function SheetTitle({ children }: any) {
  return <Text style={styles.title}>{children}</Text>;
}

export function SheetDescription({ children }: any) {
  return <Text style={styles.description}>{children}</Text>;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
  },
  content: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: SCREEN_HEIGHT * 0.3,
    maxHeight: SCREEN_HEIGHT * 0.9,
    paddingBottom: 20,
  },
  innerContent: {
    padding: 16,
    position: "relative",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 16,
    padding: 4,
  },
});
