import React, { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet } from "react-native";

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export function Switch({
  checked = false,
  onCheckedChange,
  disabled = false,
}: SwitchProps) {
  // Valoare animată pentru mișcarea butonului (Thumb)
  const animatedValue = useRef(new Animated.Value(checked ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: checked ? 1 : 0,
      duration: 200,
      useNativeDriver: false, // Background color și poziția nu suportă mereu native driver
    }).start();
  }, [checked]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 14], // Mișcare de la stânga la dreapta
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["#E5E7EB", "#007AFF"], // De la gri (unchecked) la albastru banking (checked)
  });

  return (
    <Pressable
      disabled={disabled}
      onPress={() => onCheckedChange?.(!checked)}
      style={[styles.container, disabled && styles.disabled]}
    >
      <Animated.View style={[styles.track, { backgroundColor }]}>
        <Animated.View
          style={[styles.thumb, { transform: [{ translateX }] }]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 32,
    height: 18,
    justifyContent: "center",
  },
  track: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    justifyContent: "center",
  },
  thumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
    // Shadow pentru un aspect "elevated" pe mobile
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  disabled: {
    opacity: 0.5,
  },
});
