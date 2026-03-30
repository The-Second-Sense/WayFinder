import { borderRadius, fontSizes, ms, spacing } from "@/constants/responsive";
import { useTutorial } from "@/tutorial/TutorialContext";
import { TutorialTarget } from "@/tutorial/TutorialTarget";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { useAuth } from "../contexts/AuthContext";
import {
  apiService,
  BillDto,
  ProviderDto,
} from "./apiService";

export default function BillManagementScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { notifyActionDone } = useTutorial();

  const [providers, setProviders] = useState<ProviderDto[]>([]);
  const [allBills, setAllBills] = useState<BillDto[]>([]);

  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [isLoadingBills, setIsLoadingBills] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const [selectedBill, setSelectedBill] = useState<BillDto | null>(null);
  const [showFormProviderPicker, setShowFormProviderPicker] = useState(false);
  const [showFilterProviderPicker, setShowFilterProviderPicker] = useState(false);

  const [formProviderId, setFormProviderId] = useState("");
  const [billFilterProviderId, setBillFilterProviderId] = useState("");
  const [billName, setBillName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [description, setDescription] = useState("");

  const selectedFormProvider = useMemo(
    () => providers.find((p) => p.id === formProviderId) ?? null,
    [formProviderId, providers]
  );

  const selectedFilterProvider = useMemo(
    () => providers.find((p) => p.id === billFilterProviderId) ?? null,
    [billFilterProviderId, providers]
  );

  const visibleBills = useMemo(
    () =>
      billFilterProviderId
        ? allBills.filter(
            (bill) =>
              bill.providerId === billFilterProviderId ||
              bill.providerName?.toLowerCase() === selectedFilterProvider?.name?.toLowerCase()
          )
        : allBills,
    [allBills, billFilterProviderId, selectedFilterProvider?.name]
  );

  const loadProviders = useCallback(async () => {
    setIsLoadingProviders(true);
    try {
      const data = await apiService.getProviders();
      setProviders(data);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Nu am putut încărca furnizorii",
        text2: error?.message || "Încearcă din nou.",
      });
    } finally {
      setIsLoadingProviders(false);
    }
  }, []);

  const loadBills = useCallback(async () => {
    if (!user?.id) return;

    setIsLoadingBills(true);
    try {
      const data = await apiService.getAllBillsByUserId(user.id);
      setAllBills(data);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Nu am putut încărca facturile",
        text2: error?.message || "Încearcă din nou.",
      });
    } finally {
      setIsLoadingBills(false);
    }
  }, [user?.id]);

  const loadInitial = useCallback(async () => {
    if (!user?.id) return;
    await Promise.all([loadProviders(), loadBills()]);
  }, [loadBills, loadProviders, user?.id]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  useEffect(() => {
    if (selectedBill && !visibleBills.some((bill) => bill.id === selectedBill.id)) {
      setSelectedBill(null);
    }
  }, [selectedBill, visibleBills]);

  const resetForm = () => {
    setFormProviderId("");
    setBillName("");
    setAmount("");
    setDueDate("");
    setAccountNumber("");
    setDescription("");
    setShowFormProviderPicker(false);
  };

  const handleCreateBill = async () => {
    if (!user?.id) return;

    const parsedAmount = Number(amount.replace(",", "."));

    if (!formProviderId || !billName.trim() || !dueDate.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Toast.show({
        type: "error",
        text1: "Date incomplete",
        text2: "Completează provider, nume factură, sumă și data scadenței.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await apiService.createBill({
        userId: user.id,
        providerId: formProviderId,
        billName: billName.trim(),
        amount: parsedAmount,
        currency: "RON",
        dueDate: dueDate.trim(),
        accountNumber: accountNumber.trim() || undefined,
        description: description.trim() || undefined,
      });

      Toast.show({
        type: "success",
        text1: "Factură adăugată",
        text2: `${created.billName} a fost salvată.`,
      });

      resetForm();
      await loadBills();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Nu am putut adăuga factura",
        text2: error?.message || "Verifică datele și încearcă din nou.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resolveProviderForBill = (bill: BillDto): ProviderDto | null => {
    if (bill.providerId) {
      const byId = providers.find((p) => p.id === bill.providerId);
      if (byId) return byId;
    }

    if (bill.providerName) {
      const byName = providers.find((p) => p.name.toLowerCase() === bill.providerName?.toLowerCase());
      if (byName) return byName;
    }

    return null;
  };

  const handlePaySelectedBill = async () => {
    if (!user?.id || !selectedBill) return;

    const provider = resolveProviderForBill(selectedBill);
    const targetAccountNumber = provider?.targetAccountNumber;

    if (!targetAccountNumber) {
      Toast.show({
        type: "error",
        text1: "Lipsește IBAN-ul providerului",
        text2: "Nu putem procesa plata fără targetAccountNumber.",
      });
      return;
    }

    setIsPaying(true);
    try {
      await apiService.confirmPlataFacturi({
        userId: user.id,
        confirmed: true,
        targetAccountNumber,
        amount: selectedBill.amount,
        currency: selectedBill.currency || "RON",
        description: selectedBill.billName,
      });

      await apiService.updateBillStatus(selectedBill.id, "PAID");

      Toast.show({
        type: "success",
        text1: "Factură plătită",
        text2: `${selectedBill.billName} a fost marcată ca PAID.`,
      });

      setSelectedBill(null);
      notifyActionDone("confirm-bill-payment-button", "press");
      await loadBills();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Plata a eșuat",
        text2: error?.message || "Încearcă din nou.",
      });
    } finally {
      setIsPaying(false);
    }
  };

  const handleDeleteBill = async (billId: string) => {
    try {
      await apiService.deleteBill(billId);
      if (selectedBill?.id === billId) {
        setSelectedBill(null);
      }
      Toast.show({ type: "success", text1: "Factura a fost ștearsă" });
      await loadBills();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Nu am putut șterge factura",
        text2: error?.message || "Încearcă din nou.",
      });
    }
  };

  const providerLabel = selectedFormProvider?.name || "Alege furnizor";
  const filterProviderLabel = selectedFilterProvider?.name || "Toți furnizorii";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bill Management</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBanner}>
          <Text style={styles.bannerTitle}>Adaugă și plătește facturi</Text>
          <Text style={styles.bannerSubtitle}>
            Creezi facturi manual, vezi lista ta și plătești instant.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Add Bill</Text>
          <View style={styles.formCard}>
            <Text style={styles.label}>Provider</Text>
            <TouchableOpacity
              style={styles.providerPicker}
              onPress={() => setShowFormProviderPicker((prev) => !prev)}
            >
              <Text style={styles.providerPickerText}>{providerLabel}</Text>
              <Text style={styles.providerPickerChevron}>{showFormProviderPicker ? "▲" : "▼"}</Text>
            </TouchableOpacity>

            {showFormProviderPicker && (
              <View style={styles.providerList}>
                {isLoadingProviders ? (
                  <ActivityIndicator color="#1A1A1A" />
                ) : (
                  providers.map((provider) => (
                    <TouchableOpacity
                      key={provider.id}
                      style={styles.providerItem}
                      onPress={() => {
                        setFormProviderId(provider.id);
                        setShowFormProviderPicker(false);
                      }}
                    >
                      <Text style={styles.providerItemName}>{provider.name}</Text>
                      {provider.category ? (
                        <Text style={styles.providerItemMeta}>{provider.category}</Text>
                      ) : null}
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            <Text style={styles.label}>Bill Name</Text>
            <TextInput
              style={styles.input}
              value={billName}
              onChangeText={setBillName}
              placeholder="Ex: Digi Internet Monthly"
              placeholderTextColor="#6B7280"
            />

            <Text style={styles.label}>Amount (RON)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="Ex: 45.99"
              placeholderTextColor="#6B7280"
            />

            <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="2026-04-15"
              placeholderTextColor="#6B7280"
            />

            <Text style={styles.label}>Account Number (optional)</Text>
            <TextInput
              style={styles.input}
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="CUST-123456"
              placeholderTextColor="#6B7280"
            />

            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="March billing period"
              placeholderTextColor="#6B7280"
              multiline
            />

            <TouchableOpacity
              style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
              onPress={handleCreateBill}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#1A1A1A" />
              ) : (
                <Text style={styles.primaryButtonText}>Adaugă Factura</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.sectionTitle}>2. View Bills</Text>
          </View>

          <Text style={styles.label}>Filtrează după furnizor</Text>
          <TutorialTarget targetId="provider-selector">
            <TouchableOpacity
              style={styles.providerPicker}
              onPress={() => setShowFilterProviderPicker((prev) => !prev)}
            >
              <Text style={styles.providerPickerText}>{filterProviderLabel}</Text>
              <Text style={styles.providerPickerChevron}>{showFilterProviderPicker ? "▲" : "▼"}</Text>
            </TouchableOpacity>
          </TutorialTarget>

          {showFilterProviderPicker && (
            <View style={styles.providerList}>
              <TouchableOpacity
                style={styles.providerItem}
                onPress={() => {
                  setBillFilterProviderId("");
                  setShowFilterProviderPicker(false);
                  notifyActionDone("provider-selector", "press");
                }}
              >
                <Text style={styles.providerItemName}>Toți furnizorii</Text>
              </TouchableOpacity>
              {providers.map((provider) => (
                <TouchableOpacity
                  key={provider.id}
                  style={styles.providerItem}
                  onPress={() => {
                    setBillFilterProviderId(provider.id);
                    setShowFilterProviderPicker(false);
                    notifyActionDone("provider-selector", "press");
                  }}
                >
                  <Text style={styles.providerItemName}>{provider.name}</Text>
                  {provider.category ? (
                    <Text style={styles.providerItemMeta}>{provider.category}</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {isLoadingBills ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color="#1A1A1A" />
              <Text style={styles.loadingText}>Se încarcă facturile...</Text>
            </View>
          ) : visibleBills.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Nu ai facturi în această listă</Text>
              <Text style={styles.emptyText}>Adaugă o factură nouă din formularul de mai sus.</Text>
            </View>
          ) : (
            <TutorialTarget targetId="bill-list">
              <View>
                {visibleBills.map((bill) => {
                  const isSelected = selectedBill?.id === bill.id;
                  const providerName = bill.providerName || "Provider necunoscut";
                  const status = bill.status || "PENDING";

                  return (
                    <TouchableOpacity
                      key={bill.id}
                      style={[styles.billCard, isSelected && styles.billCardSelected]}
                      activeOpacity={0.85}
                      onPress={() => {
                        setSelectedBill(bill);
                        notifyActionDone("bill-list", "press");
                      }}
                    >
                      <View style={styles.billTopRow}>
                        <Text style={styles.billTitle}>{bill.billName}</Text>
                        <Text style={[styles.statusBadge, status === "PAID" ? styles.statusPaid : styles.statusPending]}>
                          {status}
                        </Text>
                      </View>
                      <Text style={styles.billMeta}>{providerName}</Text>
                      <Text style={styles.billMeta}>Scadență: {bill.dueDate}</Text>
                      <Text style={styles.billAmount}>{bill.amount.toFixed(2)} {bill.currency || "RON"}</Text>

                      <View style={styles.billActionsRow}>
                        <TouchableOpacity
                          style={[styles.secondaryButton, status !== "PENDING" && styles.buttonDisabled]}
                          onPress={handlePaySelectedBill}
                          disabled={status !== "PENDING" || isPaying || !isSelected}
                        >
                          <Text style={styles.secondaryButtonText}>Plătește</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteBill(bill.id)}
                        >
                          <Text style={styles.deleteButtonText}>Șterge</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TutorialTarget>
          )}
        </View>

        {selectedBill && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Pay Bill</Text>
            <View style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>{selectedBill.billName}</Text>
              <Text style={styles.detailsLine}>Provider: {selectedBill.providerName || "-"}</Text>
              <Text style={styles.detailsLine}>Sumă: {selectedBill.amount.toFixed(2)} {selectedBill.currency || "RON"}</Text>
              <Text style={styles.detailsLine}>Scadență: {selectedBill.dueDate}</Text>
              <Text style={styles.detailsLine}>Status: {selectedBill.status}</Text>

              <TutorialTarget targetId="confirm-bill-payment-button">
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    (selectedBill.status !== "PENDING" || isPaying) && styles.buttonDisabled,
                  ]}
                  onPress={handlePaySelectedBill}
                  disabled={selectedBill.status !== "PENDING" || isPaying}
                >
                  {isPaying ? (
                    <ActivityIndicator color="#1A1A1A" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Pay Now</Text>
                  )}
                </TouchableOpacity>
              </TutorialTarget>
            </View>
          </View>
        )}
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
    borderBottomColor: "#E5E7EB",
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
  headerBanner: {
    backgroundColor: "#FFED00",
    padding: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  bannerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: spacing.xs,
  },
  bannerSubtitle: {
    fontSize: fontSizes.md,
    color: "#1A1A1A",
    opacity: 0.75,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: spacing.md,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: "#374151",
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  providerPicker: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: borderRadius.md,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  providerPickerText: {
    fontSize: fontSizes.base,
    color: "#111827",
    flexShrink: 1,
  },
  providerPickerChevron: {
    fontSize: fontSizes.sm,
    color: "#6B7280",
  },
  providerList: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: borderRadius.md,
    backgroundColor: "#FFFFFF",
    maxHeight: ms(220),
    paddingVertical: spacing.xs,
  },
  providerItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  providerItemName: {
    fontSize: fontSizes.base,
    color: "#111827",
    fontWeight: "600",
  },
  providerItemMeta: {
    fontSize: fontSizes.sm,
    color: "#6B7280",
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSizes.base,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    minHeight: ms(84),
    textAlignVertical: "top",
  },
  primaryButton: {
    marginTop: spacing.lg,
    backgroundColor: "#FFED00",
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "#E6D800",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
  },
  primaryButtonText: {
    color: "#1A1A1A",
    fontWeight: "700",
    fontSize: fontSizes.base,
  },
  listHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  loadingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: spacing.lg,
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.sm,
    color: "#374151",
    fontSize: fontSizes.sm,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: "#111827",
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: fontSizes.sm,
    color: "#6B7280",
  },
  billCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  billCardSelected: {
    borderColor: "#111827",
    borderWidth: 2,
  },
  billTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  billTitle: {
    flex: 1,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: "#111827",
    marginRight: spacing.sm,
  },
  statusBadge: {
    fontSize: fontSizes.xs,
    fontWeight: "700",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  statusPending: {
    color: "#92400E",
    backgroundColor: "#FEF3C7",
  },
  statusPaid: {
    color: "#065F46",
    backgroundColor: "#D1FAE5",
  },
  billMeta: {
    fontSize: fontSizes.sm,
    color: "#4B5563",
    marginBottom: 2,
  },
  billAmount: {
    marginTop: spacing.xs,
    fontSize: fontSizes.md,
    fontWeight: "700",
    color: "#111827",
  },
  billActionsRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    gap: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: fontSizes.sm,
  },
  deleteButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  deleteButtonText: {
    color: "#B91C1C",
    fontWeight: "700",
    fontSize: fontSizes.sm,
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  detailsTitle: {
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: "#111827",
    marginBottom: spacing.sm,
  },
  detailsLine: {
    fontSize: fontSizes.sm,
    color: "#374151",
    marginBottom: spacing.xs,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
