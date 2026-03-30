import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { borderRadius, fontSizes, ms, spacing } from "@/constants/responsive";

type PinConfirmationModalProps = {
  visible: boolean;
  title: string;
  message: string;
  loading?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: (pin: string) => void;
};

export default function PinConfirmationModal({
  visible,
  title,
  message,
  loading = false,
  error,
  onCancel,
  onConfirm,
}: PinConfirmationModalProps) {
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (visible) {
      setPin("");
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={(text) => setPin(text.replace(/[^0-9]/g, "").slice(0, 4))}
            keyboardType="numeric"
            secureTextEntry
            placeholder="0000"
            placeholderTextColor="#999"
            maxLength={4}
            editable={!loading}
          />

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel} disabled={loading}>
              <Text style={styles.cancelButtonText}>Anulează</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, (loading || pin.length !== 4) && styles.disabledButton]}
              onPress={() => onConfirm(pin)}
              disabled={loading || pin.length !== 4}
            >
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.confirmButtonText}>Confirmă</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  container: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#fff",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  message: {
    fontSize: fontSizes.sm,
    color: "#4B5563",
    textAlign: "center",
    marginBottom: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: borderRadius.md,
    height: ms(50),
    textAlign: "center",
    fontSize: fontSizes.xl,
    letterSpacing: 6,
    color: "#111827",
    marginBottom: spacing.sm,
  },
  errorText: {
    color: "#DC2626",
    fontSize: fontSizes.sm,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#374151",
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    backgroundColor: "#111827",
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: ms(40),
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.55,
  },
});
