import { CreditCard, Receipt, Send, TrendingUp } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { TutorialTarget } from "@/tutorial/TutorialTarget";
import { useTutorial } from "@/tutorial/TutorialContext";
import { spacing, fontSizes, iconSizes, ms, borderRadius } from "@/constants/responsive";

interface QuickAction {
  targetId: string;
  icon: any;
  label: string;
  onClick: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  const { notifyActionDone } = useTutorial();
  const colors = ["#FFED00", "#F5D908"];
  return (
    <View style={styles.container}>
      <View style={styles.grid}>

      {actions.map((action, index) => {
        const Icon = action.icon;
        const bgColor = colors[index % 2];

        return (
          <TutorialTarget key={action.targetId} targetId={action.targetId}>
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => {
                notifyActionDone(action.targetId, "press");
                action.onClick();
              }}
            >
              <View style={[styles.iconWrapper, { backgroundColor: bgColor }]}>
                <Icon size={24} color="#1A1A1A" />
              </View>
              <Text style={styles.label}>{action.label}</Text>

            </Pressable>
          </TutorialTarget>
        );
      })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    //borderRadius: 16,
    padding: 16,
    //borderWidth: 2,
    //borderColor: "#1A1A1A",
    marginVertical: 10,
    // Umbră pentru card
    //shadowColor: "#000",
    //shadowOffset: { width: 0, height: 2 },
    //shadowOpacity: 0.1,
    //shadowRadius: 4,
    //elevation: 3,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  actionButton: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  actionLabel: {
    marginTop: spacing.xs,
    fontWeight: "700",
    fontSize: fontSizes.lg,
    textAlign: "center",
    color: "#000",
    lineHeight: fontSizes.base,
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

