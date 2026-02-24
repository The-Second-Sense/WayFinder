import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { spacing, fontSizes, borderRadius, ms } from "@/constants/responsive";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";

interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  category: string;
  accountNumber: string;
}

interface BillPaymentScreenProps {
  onPayment?: (bill: Bill, amount: number) => void;
}

export default function BillPaymentScreen({
  onPayment,
}: BillPaymentScreenProps) {
  const router = useRouter();
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [recipientName, setRecipientName] = useState("");

  const popularBills: Bill[] = [
    {
      id: "1",
      name: "Curent Electric",
      amount: 685.0,
      dueDate: "28 Feb 2026",
      category: "utilities",
      accountNumber: "RO49AAAA1B31007593840000",
    },
    {
      id: "2",
      name: "Gaz Natural",
      amount: 234.5,
      dueDate: "25 Feb 2026",
      category: "utilities",
      accountNumber: "RO49AAAA1B31007593840001",
    },
    {
      id: "3",
      name: "Apă Canal",
      amount: 156.3,
      dueDate: "20 Feb 2026",
      category: "utilities",
      accountNumber: "RO49AAAA1B31007593840002",
    },
    {
      id: "4",
      name: "Internet & TV",
      amount: 89.0,
      dueDate: "15 Feb 2026",
      category: "telecom",
      accountNumber: "RO49AAAA1B31007593840003",
    },
    {
      id: "5",
      name: "Telefon Mobil",
      amount: 45.0,
      dueDate: "10 Feb 2026",
      category: "telecom",
      accountNumber: "RO49AAAA1B31007593840004",
    },
    {
      id: "6",
      name: "Asigurare Auto",
      amount: 450.0,
      dueDate: "05 Mar 2026",
      category: "insurance",
      accountNumber: "RO49AAAA1B31007593840005",
    },
  ];

  const handleSelectBill = (bill: Bill) => {
    setSelectedBill(bill);
    setAmount(bill.amount.toString());
    setAccountNumber(bill.accountNumber);
    setRecipientName(bill.name);
  };

  const handlePayment = () => {
    const parsedAmount = parseFloat(amount);

    if (
      !recipientName ||
      !accountNumber ||
      !parsedAmount ||
      parsedAmount <= 0
    ) {
      Toast.show({
        type: "error",
        text1: "Date incomplete",
        text2: "Te rugăm să completezi toate câmpurile",
      });
      return;
    }

    if (selectedBill && onPayment) {
      onPayment(selectedBill, parsedAmount);
    }

    Toast.show({
      type: "success",
      text1: "Plată efectuată",
      text2: `${parsedAmount.toFixed(2)} RON către ${recipientName}`,
    });

    // Reset form
    setSelectedBill(null);
    setAmount("");
    setAccountNumber("");
    setRecipientName("");
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "utilities":
        return "⚡";
      case "telecom":
        return "📱";
      case "insurance":
        return "🛡️";
      default:
        return "💳";
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {/* Back Button Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plăți Facturi</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Plătește Factura</Text>
          <Text style={styles.headerSubtitle}>
            Selectează o factură populară sau introdu manual detaliile
          </Text>
        </View>

        {/* Popular Bills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Facturi Populare</Text>
          <View style={styles.billsGrid}>
            {popularBills.map((bill) => (
              <TouchableOpacity
                key={bill.id}
                style={[
                  styles.billCard,
                  selectedBill?.id === bill.id && styles.billCardSelected,
                ]}
                onPress={() => handleSelectBill(bill)}
                activeOpacity={0.7}
              >
                <View style={styles.billCardHeader}>
                  <Text style={styles.billIcon}>
                    {getCategoryIcon(bill.category)}
                  </Text>
                  <Text style={styles.billAmount}>
                    {bill.amount.toFixed(2)} RON
                  </Text>
                </View>
                <Text style={styles.billName}>{bill.name}</Text>
                <Text style={styles.billDueDate}>Scadență: {bill.dueDate}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Manual Payment Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedBill ? "Detalii Plată" : "Plată Manuală"}
          </Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nume Destinatar</Text>
              <TextInput
                style={styles.input}
                value={recipientName}
                onChangeText={setRecipientName}
                placeholder="Numele companiei"
                placeholderTextColor="#1A1A1A66"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>IBAN / Cont</Text>
              <TextInput
                style={styles.input}
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="RO49AAAA1B31007593840000"
                placeholderTextColor="#1A1A1A66"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sumă (RON)</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="#1A1A1A66"
                keyboardType="decimal-pad"
              />
            </View>

            {selectedBill && (
              <View style={styles.selectedBillInfo}>
                <Text style={styles.selectedBillLabel}>Factură selectată:</Text>
                <Text style={styles.selectedBillName}>{selectedBill.name}</Text>
                <Text style={styles.selectedBillDate}>
                  Scadență: {selectedBill.dueDate}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.payButton,
                (!recipientName || !accountNumber || !amount) &&
                  styles.payButtonDisabled,
              ]}
              onPress={handlePayment}
              disabled={!recipientName || !accountNumber || !amount}
            >
              <Text style={styles.payButtonText}>
                Plătește{" "}
                {amount ? `${parseFloat(amount).toFixed(2)} RON` : "Factura"}
              </Text>
            </TouchableOpacity>

            {selectedBill && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setSelectedBill(null);
                  setAmount("");
                  setAccountNumber("");
                  setRecipientName("");
                }}
              >
                <Text style={styles.clearButtonText}>Șterge Selecția</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Payment Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Sfaturi</Text>
          <Text style={styles.tipText}>
            • Verifică întotdeauna numărul IBAN înainte de a plăti
          </Text>
          <Text style={styles.tipText}>
            • Poți salva facturi recurente pentru plăți mai rapide
          </Text>
          <Text style={styles.tipText}>
            • Plățile sunt procesate instant 24/7
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: spacing.sm,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: "#FFED00",
    padding: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  headerSubtitle: {
    fontSize: fontSizes.md,
    color: "#1A1A1A",
    opacity: 0.7,
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSizes.xl,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: spacing.lg,
  },
  billsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  billCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: "#1A1A1A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  billCardSelected: {
    backgroundColor: "#F5D908",
    borderColor: "#1A1A1A",
    borderWidth: 3,
  },
  billCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  billIcon: {
    fontSize: fontSizes.xxl,
  },
  billAmount: {
    fontSize: fontSizes.md,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  billName: {
    fontSize: fontSizes.md,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: spacing.xs,
  },
  billDueDate: {
    fontSize: fontSizes.sm,
    color: "#1A1A1A",
    opacity: 0.6,
  },
  form: {
    backgroundColor: "#FFFFFF",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: "#1A1A1A",
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSizes.md,
    fontWeight: "500",
    color: "#1A1A1A",
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 2,
    borderColor: "#1A1A1A",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSizes.base,
    color: "#1A1A1A",
    backgroundColor: "#FFFFFF",
  },
  selectedBillInfo: {
    backgroundColor: "#FFED00",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  selectedBillLabel: {
    fontSize: fontSizes.sm,
    color: "#1A1A1A",
    opacity: 0.7,
    marginBottom: spacing.xs,
  },
  selectedBillName: {
    fontSize: fontSizes.base,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  selectedBillDate: {
    fontSize: fontSizes.sm,
    color: "#1A1A1A",
    opacity: 0.7,
  },
  payButton: {
    backgroundColor: "#FFED00",
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1A1A1A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  payButtonDisabled: {
    backgroundColor: "#1A1A1A",
    opacity: 0.2,
  },
  payButtonText: {
    fontSize: fontSizes.base,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  clearButton: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1A1A1A",
    backgroundColor: "#FFFFFF",
  },
  clearButtonText: {
    fontSize: fontSizes.md,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  tipsSection: {
    backgroundColor: "#F5D908",
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: "#1A1A1A",
  },
  tipsTitle: {
    fontSize: fontSizes.base,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: spacing.md,
  },
  tipText: {
    fontSize: fontSizes.md,
    color: "#1A1A1A",
    marginBottom: spacing.sm,
    lineHeight: ms(20),
  },
});
