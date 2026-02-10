import React from "react";
import { useColorScheme } from "react-native";
import Toast, {
  BaseToast,
  ErrorToast,
  ToastConfig,
} from "react-native-toast-message";

// Definim stilurile de bază pentru a replica aspectul Sonner/Shadcn
const toastConfig: ToastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "#10B981", backgroundColor: "#FFFFFF" }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
      }}
      text2Style={{
        fontSize: 13,
        color: "#6B7280",
      }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: "#EF4444", backgroundColor: "#FFFFFF" }}
      text1Style={{
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
      }}
      text2Style={{
        fontSize: 13,
        color: "#6B7280",
      }}
    />
  ),
  // Poți adăuga un stil custom pentru "info" sau "banking-alert"
};

export function Toaster() {
  const colorScheme = useColorScheme();

  // În React Native, tema se preia de obicei din sistem
  // sau dintr-un context global de tema (Dark/Light)
  return (
    <Toast
      config={toastConfig}
      position="top" // Pe mobile, top este mai vizibil
      topOffset={50} // Evită suprapunerea cu ceasul/status bar-ul
    />
  );
}
