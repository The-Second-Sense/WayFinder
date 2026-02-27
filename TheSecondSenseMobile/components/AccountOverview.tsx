import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
// ATENȚIE: Importă doar ce există în librărie. LucideIcon nu este necesar aici.
import { Eye, EyeOff } from "lucide-react-native";

// 1. Exportăm interfața pentru a fi vizibilă și în App.tsx dacă e nevoie
export interface AccountOverviewProps {
  balance: number;
  accountNumber: string;
  accountName: string;
  accountType: string;
  currency: string;
}

export function AccountOverview({
  balance,
  accountNumber,
  accountName,
  accountType,
  currency,
}: AccountOverviewProps) {
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.accountName}>{accountName}</Text>
          <Pressable
            onPress={() => setShowAccountNumber(!showAccountNumber)}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            {showAccountNumber ? (
              <Eye size={20} color="#1A1A1A" />
            ) : (
              <EyeOff size={20} color="#1A1A1A" />
            )}
          </Pressable>
        </View>
        <Text style={styles.accountNumberText}>
          Cont {showAccountNumber ? accountNumber : '•••• •••• ' + accountNumber.slice(-4)}
        </Text>
        {accountType ? (
          <Text style={styles.accountTypeText}>{accountType}</Text>
        ) : null}
      </View>

      <View style={styles.content}>
        <View style={styles.balanceContainer}>
          <Text style={styles.label}>Sold Disponibil</Text>
          <Text style={styles.balanceText}>
            {`${Number(balance).toLocaleString("ro-RO", { minimumFractionDigits: 2 })} ${currency}`}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFED00",
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  header: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accountName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  accountNumberText: {
    fontSize: 14,
    color: "rgba(26, 26, 26, 0.7)",
    marginTop: 2,
  },
  accountTypeText: {
    fontSize: 13,
    color: "rgba(26, 26, 26, 0.6)",
    marginTop: 2,
    textTransform: "capitalize",
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(26, 26, 26, 0.05)",
  },
  content: {
    // Dacă ai eroare la "gap", folosește margin-uri la elementele copii
    rowGap: 16,
  },
  balanceContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: "rgba(26, 26, 26, 0.7)",
    marginBottom: 4,
  },
  balanceText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
});
