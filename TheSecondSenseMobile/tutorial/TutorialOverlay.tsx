import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTutorial } from "./TutorialContext";

const PAD = 10;

export const TutorialOverlay = () => {
  const { active, currentStep, currentTargetLayout, currentIndex, steps, stopTutorial } = useTutorial();
  const overlayRef = useRef<View>(null);
  const [overlayY, setOverlayY] = useState(0);

  useEffect(() => {
    if (active && currentStep) {
      Speech.speak(currentStep.message, { language: "ro-RO", rate: 0.9 });
    }
    return () => { Speech.stop(); };
  }, [active, currentIndex]);

  const measureOverlay = () => {
    overlayRef.current?.measureInWindow((_x, y) => {
      setOverlayY(y);
    });
  };

  if (!active || !currentStep) return null;

  const hl = currentTargetLayout;

  return (
    <View
      ref={overlayRef}
      style={[StyleSheet.absoluteFill, styles.overlay]}
      pointerEvents="box-none"
      onLayout={measureOverlay}
    >
      {/* Highlight ring around the target - touches pass through */}
      {hl && (
        <View
          pointerEvents="none"
          style={[
            styles.highlight,
            {
              top: hl.y - overlayY - PAD,
              left: hl.x - PAD,
              width: hl.width + PAD * 2,
              height: hl.height + PAD * 2,
            },
          ]}
        />
      )}

      {/* Step card at the bottom */}
      <View style={styles.card} pointerEvents="box-none">
        <Text style={styles.counter}>Pasul {currentIndex + 1} din {steps.length}</Text>
        <Text style={styles.message}>{currentStep.message}</Text>
        {hl && (
          <Text style={styles.hint}>Apasa elementul evidentiat pentru a continua</Text>
        )}
        <TouchableOpacity style={styles.stopBtn} onPress={() => { Speech.stop(); stopTutorial(); }}>
          <Text style={styles.stopBtnText}>Opreste ghidarea</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    zIndex: 9999,
    elevation: 9999,
  },
  highlight: {
    position: "absolute",
    borderWidth: 3,
    borderColor: "#4CAF50",
    borderRadius: 14,
    backgroundColor: "rgba(76,175,80,0.12)",
  },
  card: {
    position: "absolute",
    bottom: 48,
    left: 16,
    right: 16,
    backgroundColor: "#1A1A2E",
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 12,
  },
  counter: {
    color: "#A0A0B0",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  message: {
    color: "#FFFFFF",
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 8,
  },
  hint: {
    color: "#4CAF50",
    fontSize: 13,
    fontStyle: "italic",
    marginBottom: 16,
  },
  stopBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#555",
    alignItems: "center",
  },
  stopBtnText: {
    color: "#A0A0B0",
    fontSize: 15,
    fontWeight: "600",
  },
});
