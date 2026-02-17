import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTutorial } from "./TutorialContext";

export const TutorialOverlay = () => {
  const { active, currentStep, currentTargetLayout } = useTutorial();

  if (!active || !currentStep || !currentTargetLayout) return null;

  const { x, y, width, height } = currentTargetLayout;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View
        style={[
          styles.highlight,
          {
            top: y - 6,
            left: x - 6,
            width: width + 12,
            height: height + 12,
          },
        ]}
      />

      <View style={styles.popup}>
        <Text style={styles.popupText}>{currentStep.message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  highlight: {
    position: "absolute",
    borderWidth: 3,
    borderColor: "red",
    borderRadius: 12,
  },
  popup: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 12,
  },
  popupText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
});
