import React, { createContext, useContext, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";

// Activăm animațiile pentru Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TabsContext = createContext<{
  activeTab?: string;
  setActiveTab: (value: string) => void;
}>({ setActiveTab: () => {} });

export function Tabs({ defaultValue, children, style }: any) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  const handleSetTab = (value: string) => {
    // Creează o tranziție fluidă între tab-uri
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(value);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleSetTab }}>
      <View style={[styles.tabsContainer, style]}>{children}</View>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, style }: any) {
  return <View style={[styles.tabsList, style]}>{children}</View>;
}

export function TabsTrigger({
  value,
  title,
  icon: Icon,
}: {
  value: string;
  title: string;
  icon?: any;
}) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <Pressable
      onPress={() => setActiveTab(value)}
      style={[styles.trigger, isActive && styles.activeTrigger]}
    >
      {Icon && (
        <Icon
          size={16}
          color={isActive ? "#111827" : "#6B7280"}
          style={{ marginRight: 6 }}
        />
      )}
      <Text style={[styles.triggerText, isActive && styles.activeTriggerText]}>
        {title}
      </Text>
    </Pressable>
  );
}

export function TabsContent({ value, children }: any) {
  const { activeTab } = useContext(TabsContext);
  if (activeTab !== value) return null;
  return <View style={styles.content}>{children}</View>;
}

// --- Stiluri ---

const styles = StyleSheet.create({
  tabsContainer: {
    width: "100%",
  },
  tabsList: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6", // bg-muted
    borderRadius: 12,
    padding: 4,
    height: 44,
    alignItems: "center",
  },
  trigger: {
    flex: 1,
    flexDirection: "row",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  activeTrigger: {
    backgroundColor: "#FFFFFF", // bg-card
    // Shadow pentru efectul de ridicare (elevated)
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  triggerText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280", // text-muted-foreground
  },
  activeTriggerText: {
    color: "#111827", // text-foreground
  },
  content: {
    marginTop: 12,
    flex: 1,
  },
});
