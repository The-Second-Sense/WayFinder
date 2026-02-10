import { CreditCard, Receipt, Send, TrendingUp } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface QuickAction {
  icon: any;
  label: string;
  onClick: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  // Culori alternate pentru design
  const colors = ["#FFED00", "#F5D908"];

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {actions.map((action, index) => {
          const Icon = action.icon;
          // Alegem culoarea bazat pe index (par/impar)
          const bgColor = colors[index % 2];

          return (
            <Pressable
              key={index}
              onPress={action.onClick}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <View style={[styles.iconWrapper, { backgroundColor: bgColor }]}>
                <Icon size={24} color="#1A1A1A" />
              </View>
              <Text style={styles.label}>{action.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#1A1A1A",
    marginVertical: 10,
    // Umbră pentru card
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionButton: {
    width: "48%", // Aproape jumătate pentru a crea 2 coloane cu spațiu între ele
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  buttonPressed: {
    backgroundColor: "rgba(255, 237, 0, 0.1)",
    borderColor: "rgba(26, 26, 26, 0.2)",
  },
  iconWrapper: {
    padding: 12,
    borderRadius: 99,
    marginBottom: 8,
    // Umbră pentru cerculețul iconiței
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "center",
  },
});

export { CreditCard, Receipt, Send, TrendingUp };

