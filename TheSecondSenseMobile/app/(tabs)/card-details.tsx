import { useAuth } from "@/app/contexts/AuthContext";
import { borderRadius, fontSizes, ms, spacing } from "@/constants/responsive";
import { useMockCards } from "@/hooks/useMockCards";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AccountDto, apiService } from "./apiService";

const formatIban = (iban: string) => iban.replace(/(.{4})/g, "$1 ").trim();

export default function CardDetailsScreen() {
  const router = useRouter();
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const { user } = useAuth();
  const { cards, ready } = useMockCards();
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setAccounts([]);
      setAccountsLoading(false);
      return;
    }

    setAccountsLoading(true);
    apiService
      .getAccountsByUserId(user.id)
      .then((loadedAccounts) => setAccounts(loadedAccounts))
      .catch(() => setAccounts([]))
      .finally(() => setAccountsLoading(false));
  }, [user?.id]);

  const selectedCard = useMemo(
    () => cards.find((card) => card.id === cardId) ?? null,
    [cards, cardId]
  );

  const linkedAccount = useMemo(() => {
    if (!selectedCard || accounts.length === 0) return null;
    if (selectedCard.linkedAccountId == null) return accounts[0];
    return (
      accounts.find((account) => account.accountId === selectedCard.linkedAccountId) ??
      accounts[0]
    );
  }, [selectedCard, accounts]);

  const balanceText = linkedAccount
    ? `${linkedAccount.balance.toFixed(2)} ${linkedAccount.currency}`
    : "N/A";

  const displayedCardNumber = selectedCard?.maskedPan || "N/A";
  const displayedIban = linkedAccount?.accountNumber?.trim() || selectedCard?.iban || "N/A";

  if (!ready || accountsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#FFED00" />
          <Text style={styles.stateText}>Se încarcă detaliile cardului...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedCard) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalii card</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerState}>
          <Text style={styles.errorTitle}>Cardul nu a fost găsit</Text>
          <Text style={styles.stateText}>Înapoi la lista de carduri și încearcă din nou.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalii card</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Număr card</Text>
          <Text style={styles.detailValue}>{displayedCardNumber}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>IBAN</Text>
          <Text style={styles.detailValue}>{formatIban(displayedIban)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>CVV</Text>
          <Text style={styles.detailValue}>{selectedCard.cvv ?? "---"}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Sold cont</Text>
          <Text style={styles.detailValue}>{balanceText}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
  content: {
    padding: spacing.lg,
  },
  detailRow: {
    backgroundColor: "#F9FAFB",
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  detailLabel: {
    fontSize: fontSizes.xs,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  detailValue: {
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  stateText: {
    marginTop: spacing.md,
    textAlign: "center",
    fontSize: fontSizes.base,
    color: "#666",
    lineHeight: ms(22),
  },
  errorTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
  },
});
