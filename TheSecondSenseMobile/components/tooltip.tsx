import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";

// Pe mobil, TooltipProvider nu este de obicei necesar decât dacă
// vrei să gestionezi o stare globală, dar păstrăm structura pentru compatibilitate.
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  // Clonează copiii pentru a le injecta funcția de toggle
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, {
        isVisible,
        setIsVisible,
      });
    }
    return child;
  });

  return <View>{childrenWithProps}</View>;
}

export function TooltipTrigger({ children, setIsVisible }: any) {
  return (
    <Pressable
      onPress={() => setIsVisible(true)}
      // Opțional: onLongPress={() => setIsVisible(true)}
    >
      {children}
    </Pressable>
  );
}

export function TooltipContent({ children, isVisible, setIsVisible }: any) {
  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={() => setIsVisible(false)}
    >
      <Pressable style={styles.overlay} onPress={() => setIsVisible(false)}>
        <View style={styles.content}>
          <Text style={styles.text}>{children}</Text>
          {/* Săgeata (Arrow) */}
          <View style={styles.arrow} />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.1)", // Overlay discret
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    backgroundColor: "#111827", // bg-primary din web
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    maxWidth: 250,
    position: "relative",
    // Shadow pentru adâncime
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    color: "#FFFFFF", // text-primary-foreground
    fontSize: 12,
    textAlign: "center",
  },
  arrow: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    width: 12,
    height: 12,
    backgroundColor: "#111827",
    transform: [{ rotate: "45deg" }],
    borderRadius: 2,
  },
});
