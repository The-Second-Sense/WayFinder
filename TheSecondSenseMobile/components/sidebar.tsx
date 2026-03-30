import { PanelLeft } from "lucide-react-native";
import React, { createContext, useContext, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// --- Contextul Sidebar ---
const SidebarContext = createContext({
  isOpen: false,
  toggleSidebar: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar }}>
      <View style={{ flex: 1 }}>{children}</View>
    </SidebarContext.Provider>
  );
}

// --- Componentele de UI ---

export function Sidebar({ children }: any) {
  const { isOpen } = useSidebar();

  if (!isOpen) return null;

  return (
    <View style={styles.sidebarContainer}>
      <SafeAreaView style={styles.sidebarInner}>
        <ScrollView>{children}</ScrollView>
      </SafeAreaView>
    </View>
  );
}

export function SidebarHeader({ children }: any) {
  return <View style={styles.header}>{children}</View>;
}

export function SidebarContent({ children }: any) {
  return <View style={styles.content}>{children}</View>;
}

export function SidebarMenuButton({
  label,
  icon: Icon,
  isActive,
  onPress,
}: any) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.menuButton, isActive && styles.activeButton]}
    >
      {Icon && <Icon size={20} color={isActive ? "#007AFF" : "#6B7280"} />}
      <Text style={[styles.menuText, isActive && styles.activeText]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function SidebarTrigger() {
  const { toggleSidebar } = useSidebar();
  return (
    <Pressable onPress={toggleSidebar} style={styles.trigger}>
      <PanelLeft size={24} color="#111827" />
    </Pressable>
  );
}

// --- Stiluri ---
const styles = StyleSheet.create({
  sidebarContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "80%",
    backgroundColor: "#F9FAFB",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    zIndex: 100,
    elevation: 5, // Pentru Android shadow
  },
  sidebarInner: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  content: { padding: 8 },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 12,
    marginVertical: 2,
  },
  activeButton: { backgroundColor: "#E0EFFF" },
  menuText: { fontSize: 16, color: "#374151" },
  activeText: { color: "#007AFF", fontWeight: "600" },
  trigger: { padding: 10 },
});
