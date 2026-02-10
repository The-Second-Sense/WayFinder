import { Picker } from "@react-native-picker/picker"; // npx expo install @react-native-picker/picker
import { Send } from "lucide-react-native";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

interface TransferFormProps {
  onTransfer: (recipient: string, amount: number, type: string) => void;
}

export function TransferForm({ onTransfer }: TransferFormProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [transferType, setTransferType] = useState("internal");

  const handleSubmit = () => {
    if (recipient && amount && transferType) {
      onTransfer(recipient, parseFloat(amount), transferType);
      setRecipient("");
      setAmount("");
      setTransferType("internal");
    }
  };

  return (
    <View style={styles.card}>
      {/* Card Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transferă Bani</Text>
      </View>

      {/* Card Content */}
      <View style={styles.content}>
        {/* Tip Transfer - Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tipul Transferului</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={transferType}
              onValueChange={(itemValue) => setTransferType(itemValue)}
              dropdownIconColor="#FFED00"
              style={styles.picker}
            >
              <Picker.Item
                label="Transfer Intern"
                value="internal"
                color={Platform.OS === "ios" ? "#FFED00" : "#1A1A1A"}
              />
              <Picker.Item
                label="Transfer Extern"
                value="external"
                color={Platform.OS === "ios" ? "#FFED00" : "#1A1A1A"}
              />
              <Picker.Item
                label="Plată Factură"
                value="bill"
                color={Platform.OS === "ios" ? "#FFED00" : "#1A1A1A"}
              />
            </Picker>
          </View>
        </View>

        {/* Destinatar - Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Destinatar</Text>
          <TextInput
            style={styles.input}
            placeholder="Nume sau cont"
            placeholderTextColor="rgba(255, 237, 0, 0.4)"
            value={recipient}
            onChangeText={setRecipient}
          />
        </View>

        {/* Suma - Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Sumă</Text>
          <View style={styles.amountWrapper}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="0.00"
              placeholderTextColor="rgba(255, 237, 0, 0.4)"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric" // Deschide tastatura numerică
            />
            <Text style={styles.currencySuffix}>RON</Text>
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
          ]}
          onPress={handleSubmit}
        >
          <Send size={18} color="#1A1A1A" style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>Transferă Bani</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 237, 0, 0.3)",
    overflow: "hidden",
    marginVertical: 10,
  },
  header: {
    backgroundColor: "#F5D908",
    padding: 16,
  },
  headerTitle: {
    color: "#1A1A1A",
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    padding: 16,
    gap: 15,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: "#FFED00",
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "rgba(255, 237, 0, 0.3)",
    borderRadius: 8,
    padding: 12,
    color: "#FFED00",
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "rgba(255, 237, 0, 0.3)",
    borderRadius: 8,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
  },
  picker: {
    color: "#FFED00",
  },
  amountWrapper: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  currencySuffix: {
    position: "absolute",
    right: 12,
    color: "rgba(255, 237, 0, 0.7)",
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#FFED00",
    flexDirection: "row",
    padding: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#1A1A1A",
    fontSize: 16,
    fontWeight: "bold",
  },
});
