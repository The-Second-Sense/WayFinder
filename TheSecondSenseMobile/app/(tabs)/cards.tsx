import { useAuth } from "@/app/contexts/AuthContext";
import { borderRadius, fontSizes, ms, spacing } from "@/constants/responsive";
import { useMockCards } from "@/hooks/useMockCards";
import { generateMockCard, MockCard } from "@/types/cards";
import { useRouter } from "expo-router";
import { ArrowLeft, Plus, Power, Trash2 } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AccountDto, apiService } from "./apiService";

const CardsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { cards, setCards, ready } = useMockCards();
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountWarning, setAccountWarning] = useState<string | null>(null);
  const [sourceAccountId, setSourceAccountId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newScheme, setNewScheme] = useState<"VISA" | "MASTERCARD">("VISA");
  const [newCardType, setNewCardType] = useState<"CREDIT" | "DEBIT">("DEBIT");
  const [newCardFormat, setNewCardFormat] = useState<"FIZIC" | "VIRTUAL">("FIZIC");

  useEffect(() => {
    if (!user?.id) {
      setAccounts([]);
      setSourceAccountId(null);
      setAccountsLoading(false);
      setError("Nu există un utilizator autentificat.");
      setAccountWarning(null);
      return;
    }

    setAccountsLoading(true);
    setError(null);
    setAccountWarning(null);

    apiService
      .getAccountsByUserId(user.id)
      .then((loadedAccounts) => {
        setAccounts(loadedAccounts);
        setSourceAccountId(loadedAccounts[0]?.accountId ?? null);
      })
      .catch((err: any) => {
        setAccounts([]);
        setSourceAccountId(null);
        setAccountWarning(err?.message || "Nu am putut încărca detaliile conturilor.");
      })
      .finally(() => {
        setAccountsLoading(false);
      });
  }, [user?.id]);

  const sortedCards = [...cards].sort((left, right) => {
    if (left.isActive !== right.isActive) {
      return left.isActive ? -1 : 1;
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });

  const handleAddMockCard = () => {
    setNewScheme("VISA");
    setNewCardType("DEBIT");
    setNewCardFormat("FIZIC");
    setShowAddModal(true);
  };

  const handleConfirmAddCard = () => {
    setCards((prev) => [
      ...prev,
      generateMockCard(user?.name ?? "User", sourceAccountId, {
        scheme: newScheme,
        cardType: newCardType,
        cardFormat: newCardFormat,
      }),
    ]);
    setShowAddModal(false);
  };

  const toggleCardActive = (cardId: string) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, isActive: !card.isActive } : card
      )
    );
  };

  const deleteCard = (cardId: string) => {
    setCards((prev) => prev.filter((card) => card.id !== cardId));
  };

  const resolveAccountLabel = (linkedAccountId: number | null) => {
    if (linkedAccountId == null) return null;

    const linkedAccount = accounts.find(
      (account) => account.accountId === linkedAccountId
    );

    if (!linkedAccount) {
      return `Cont #${linkedAccountId}`;
    }

    return linkedAccount.accountNumber
      ? `Cont ${linkedAccount.accountNumber}`
      : `Cont #${linkedAccountId}`;
  };

  const formatIban = (iban: string) =>
    iban.replace(/(.{4})/g, "$1 ").trim();

  const renderItem = ({ item }: { item: MockCard }) => {
    const isYellow = item.color === "#FFED00" || item.color === "#F5D908";
    const textColor = isYellow ? "#1A1A1A" : "#FFFFFF";
    const accountLabel = resolveAccountLabel(item.linkedAccountId);

    return (
      <View style={[styles.card, { backgroundColor: item.color }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderMain}>
            <Text style={[styles.cardType, { color: textColor }]}>{item.scheme}</Text>
            <Text style={[styles.cardLabel, { color: textColor }]}>{item.label}</Text>
            <Text style={[styles.cardSubtitleText, { color: isYellow ? "#555" : "rgba(255,255,255,0.75)" }]}>
              {item.cardType} · {item.cardFormat}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isYellow
                  ? "rgba(26,26,26,0.12)"
                  : "rgba(255,255,255,0.2)",
              },
            ]}
          >
            <Text style={[styles.statusText, { color: textColor }]}>
              {item.isActive ? "Activ" : "Inactiv"}
            </Text>
          </View>
        </View>

        <Text style={[styles.cardNumber, { color: textColor }]}>
          {item.maskedPan}
        </Text>
        {!!item.iban && (
          <Text style={[styles.cardIban, { color: isYellow ? "#555" : "rgba(255,255,255,0.65)" }]}>
            {formatIban(item.iban)}
          </Text>
        )}

        <View style={styles.cardFooter}>
          <View>
            <Text
              style={{
                color: isYellow ? "#555" : "#CCC",
                fontSize: fontSizes.xs,
              }}
            >
              CARD HOLDER
            </Text>
            <Text style={[styles.cardHolder, { color: textColor }]}>
              {item.holderName}
            </Text>
          </View>

          <View style={styles.cardMetaGroup}>
            <Text style={[styles.cardCurrency, { color: textColor }]}>{item.currency}</Text>
            {!!accountLabel && (
              <View
                style={[
                  styles.accountBadge,
                  {
                    backgroundColor: isYellow
                      ? "rgba(26,26,26,0.12)"
                      : "rgba(255,255,255,0.18)",
                  },
                ]}
              >
                <Text style={[styles.accountBadgeText, { color: textColor }]}>
                  {accountLabel}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.cardActionButton}
            onPress={() => toggleCardActive(item.id)}
          >
            <Power size={16} color={textColor} />
            <Text style={[styles.cardActionText, { color: textColor }]}>
              {item.isActive ? "Dezactivează" : "Activează"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cardActionButton}
            onPress={() => deleteCard(item.id)}
          >
            <Trash2 size={16} color={textColor} />
            <Text style={[styles.cardActionText, { color: textColor }]}>Șterge</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cardurile mele</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.toolbar}>
        <Text style={styles.toolbarText}>
          Cardurile sunt locale și pot partaja același cont sursă.
        </Text>
        {!!accountWarning && <Text style={styles.warningText}>{accountWarning}</Text>}
        <TouchableOpacity style={styles.addButton} onPress={handleAddMockCard}>
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Adaugă card</Text>
        </TouchableOpacity>
      </View>

      {!ready || accountsLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#FFED00" />
          <Text style={styles.stateText}>Se pregătesc cardurile...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorTitle}>Nu am putut încărca datele</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={sortedCards}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={cards.length === 0 ? styles.emptyListContainer : styles.listContainer}
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Text style={styles.emptyTitle}>Nu ai carduri disponibile</Text>
              <Text style={styles.stateText}>
                Apasă pe butonul de mai sus pentru a adăuga un card.
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Card nou</Text>

            <Text style={styles.modalSectionLabel}>Tip rețea</Text>
            <View style={styles.optionRow}>
              {(["VISA", "MASTERCARD"] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionPill, newScheme === option && styles.optionPillActive]}
                  onPress={() => setNewScheme(option)}
                >
                  <Text style={[styles.optionPillText, newScheme === option && styles.optionPillTextActive]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalSectionLabel}>Tip card</Text>
            <View style={styles.optionRow}>
              {(["DEBIT", "CREDIT"] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionPill, newCardType === option && styles.optionPillActive]}
                  onPress={() => setNewCardType(option)}
                >
                  <Text style={[styles.optionPillText, newCardType === option && styles.optionPillTextActive]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalSectionLabel}>Format</Text>
            <View style={styles.optionRow}>
              {(["FIZIC", "VIRTUAL"] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionPill, newCardFormat === option && styles.optionPillActive]}
                  onPress={() => setNewCardFormat(option)}
                >
                  <Text style={[styles.optionPillText, newCardFormat === option && styles.optionPillTextActive]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.ibanNote}>Un IBAN va fi generat automat.</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCancelText}>Anulează</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleConfirmAddCard}>
                <Text style={styles.modalConfirmText}>Creează card</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

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
  toolbar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  toolbarText: {
    fontSize: fontSizes.sm,
    color: "#6B7280",
    lineHeight: ms(20),
  },
  warningText: {
    fontSize: fontSizes.sm,
    color: "#B45309",
    lineHeight: ms(20),
  },
  addButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "#1A1A1A",
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: fontSizes.base,
    fontWeight: "700",
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  emptyListContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
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
  errorText: {
    marginTop: spacing.sm,
    textAlign: "center",
    fontSize: fontSizes.base,
    color: "#666",
    lineHeight: ms(22),
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
  },
  card: {
    width: "100%",
    minHeight: ms(220),
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    marginBottom: spacing.lg,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  cardHeaderMain: {
    flex: 1,
    gap: spacing.xs,
  },
  cardType: {
    fontSize: fontSizes.xl,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: 1,
  },
  cardLabel: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  statusText: {
    fontSize: fontSizes.xs,
    fontWeight: "700",
  },
  cardNumber: {
    fontSize: fontSizes.xl,
    fontWeight: "700",
    letterSpacing: 3,
    textAlign: "center",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: spacing.md,
  },
  cardMetaGroup: {
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  cardHolder: {
    fontSize: fontSizes.base,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  cardCurrency: {
    fontSize: fontSizes.base,
    fontWeight: "700",
    textAlign: "right",
  },
  accountBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    maxWidth: ms(150),
  },
  accountBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: "700",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  cardActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  cardActionText: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
  },
  cardSubtitleText: {
    fontSize: fontSizes.xs,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  cardIban: {
    fontSize: fontSizes.xs,
    letterSpacing: 1.5,
    textAlign: "center",
    marginVertical: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  modalContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  modalTitle: {
    fontSize: fontSizes.xl,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: spacing.sm,
  },
  modalSectionLabel: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: spacing.sm,
  },
  optionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  optionPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },
  optionPillActive: {
    borderColor: "#1A1A1A",
    backgroundColor: "#1A1A1A",
  },
  optionPillText: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: "#6B7280",
  },
  optionPillTextActive: {
    color: "#FFFFFF",
  },
  ibanNote: {
    fontSize: fontSizes.xs,
    color: "#9CA3AF",
    marginTop: spacing.sm,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: "#6B7280",
  },
  modalConfirm: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
  },
  modalConfirmText: {
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default CardsScreen;
