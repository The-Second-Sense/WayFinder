import PinConfirmationModal from "@/components/PinConfirmationModal";
import { borderRadius, fontSizes, ms, spacing } from "@/constants/responsive";
import { useMockCards } from "@/hooks/useMockCards";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "./apiService";

export default function AccountDetailsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { cards, ready: cardsReady } = useMockCards();
  const [showFullIBAN, setShowFullIBAN] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [accountActionLoading, setAccountActionLoading] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"block" | "close" | null>(null);
  const [failedPinAttempts, setFailedPinAttempts] = useState(0);
  const [pinLockedUntil, setPinLockedUntil] = useState<number | null>(null);
  const [accountInfo, setAccountInfo] = useState({
    accountId: 0,
    iban: "",
    accountNumber: "",
    accountType: "",
    currency: "RON",
    status: "Activ",
    openDate: "",
    holderName: "",
  });

  const formatDateOnly = (value: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value.length >= 10 ? value.slice(0, 10) : value;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchAccount = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const accounts = await Promise.race([
        apiService.getAccountsByUserId(user.id),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout încărcare cont")), 10000)
        ),
      ]);

      if (accounts.length > 0) {
        const acc = accounts[0];
        setAccountInfo({
          accountId: Number(acc.accountId ?? 0),
          iban: acc.iban ?? acc.accountNumber ?? "",
          accountNumber: acc.accountNumber ?? "",
          accountType: acc.accountType ?? "Cont curent",
          currency: acc.currency ?? "RON",
          status: acc.isActive === false ? "Blocat" : "Activ",
          openDate: acc.openDate ?? acc.createdAt ?? "",
          holderName: user.name ?? "",
        });
      } else {
        setLoadError("Nu am găsit conturi pentru acest utilizator.");
      }
    } catch (error: any) {
      console.error("[detalii] fetchAccount error:", error);
      setLoadError(error?.message || "Nu am putut încărca detaliile contului.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccount();
  }, [user?.id, user?.name]);

  const associatedCards = useMemo(
    () =>
      [...cards].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      ),
    [cards]
  );

  const formatIBAN = (iban: string) => {
    if (!iban) return "-";
    if (showFullIBAN) {
      return iban.match(/.{1,4}/g)?.join(" ") || iban;
    }
    if (iban.length <= 8) return iban;
    const first = iban.slice(0, 4);
    const last = iban.slice(-4);
    return `${first} •••• •••• •••• ${last}`;
  };

  const handleCopyIBAN = () => {
    Toast.show({
      type: "success",
      text1: "IBAN copiat",
      text2: "IBAN-ul a fost copiat în clipboard",
    });
  };

  const verifyTransferPin = (enteredPin: string) => {
    const now = Date.now();

    if (pinLockedUntil && now < pinLockedUntil) {
      const remainingSeconds = Math.ceil((pinLockedUntil - now) / 1000);
      throw new Error(`Prea multe încercări. Încearcă din nou în ${remainingSeconds}s.`);
    }

    const localPin =
      (typeof window !== "undefined" && typeof window.localStorage !== "undefined"
        ? JSON.parse(window.localStorage.getItem("currentUser") || "null")?.transferPin
        : undefined) || user?.transferPin;

    if (!localPin) {
      throw new Error("Datele utilizatorului lipsesc. Te rugăm să te autentifici din nou.");
    }

    if (enteredPin.trim() !== String(localPin).trim()) {
      const nextAttempts = failedPinAttempts + 1;
      if (nextAttempts >= 3) {
        const lockUntil = now + 60_000;
        setFailedPinAttempts(0);
        setPinLockedUntil(lockUntil);
        throw new Error("Prea multe încercări greșite. PIN blocat 60 secunde.");
      }
      setFailedPinAttempts(nextAttempts);
      throw new Error(`PIN incorect. Încercări rămase: ${3 - nextAttempts}.`);
    }

    setFailedPinAttempts(0);
    setPinLockedUntil(null);
    return true;
  };

  const mapAccountErrorMessage = (message: string, action: "block" | "close" | "unblock") => {
    const normalized = message.toLowerCase();
    if (action === "close" && normalized.includes("non-zero balance")) {
      return "Nu poți închide contul cât timp soldul este diferit de 0.";
    }
    if (normalized.includes("does not belong to user") || normalized.includes("forbidden")) {
      return "Nu ai acces la acest cont.";
    }
    if (normalized.includes("not found")) {
      return "Contul nu a fost găsit.";
    }
    if (normalized.includes("network")) {
      return "Eroare de rețea. Încearcă din nou.";
    }
    if (action === "close") return "Nu s-a putut închide contul.";
    if (action === "block") return "Nu s-a putut bloca contul.";
    return "Nu s-a putut debloca contul.";
  };

  const requestPinProtectedAction = (action: "block" | "close") => {
    if (!accountInfo.accountId) {
      Toast.show({
        type: "error",
        text1: "Lipsește contul",
        text2: "Nu există un cont valid pentru această acțiune.",
      });
      return;
    }

    setPendingAction(action);
    setPinError(null);
    setPinModalVisible(true);
  };

  const handleConfirmPinAction = async (pin: string) => {
    if (!pendingAction || !user?.id || !accountInfo.accountId) {
      setPinError("Date insuficiente pentru operațiune.");
      return;
    }

    setPinError(null);
    setAccountActionLoading(true);

    try {
      verifyTransferPin(pin);

      let message = "";
      if (pendingAction === "block") {
        message = await apiService.blockAccount(accountInfo.accountId, "User requested");
      } else {
        message = await apiService.closeAccount(accountInfo.accountId, user.id);
      }

      Toast.show({
        type: "success",
        text1: pendingAction === "block" ? "Cont blocat" : "Cont închis",
        text2: message || "Operațiune efectuată cu succes.",
      });

      setPinModalVisible(false);
      setPendingAction(null);
      await fetchAccount();
    } catch (error: any) {
      const message = error?.message || "Eroare";
      if (message.toLowerCase().includes("pin")) {
        setPinError(message);
        return;
      }

      Toast.show({
        type: "error",
        text1: "Eroare",
        text2: mapAccountErrorMessage(message, pendingAction),
      });
      setPinModalVisible(false);
      setPendingAction(null);
    } finally {
      setAccountActionLoading(false);
    }
  };

  const handleUnblockAccount = async () => {
    if (!accountInfo.accountId) {
      Toast.show({
        type: "error",
        text1: "Lipsește contul",
        text2: "Nu există un cont valid pentru această acțiune.",
      });
      return;
    }

    Alert.alert("Deblocare cont", "Confirmi deblocarea contului?", [
      { text: "Anulează", style: "cancel" },
      {
        text: "Deblochează",
        onPress: async () => {
          setAccountActionLoading(true);
          try {
            const message = await apiService.unblockAccount(accountInfo.accountId);
            Toast.show({
              type: "success",
              text1: "Cont deblocat",
              text2: message || "Cont deblocat cu succes.",
            });
            await fetchAccount();
          } catch (error: any) {
            Toast.show({
              type: "error",
              text1: "Eroare",
              text2: mapAccountErrorMessage(error?.message || "", "unblock"),
            });
          } finally {
            setAccountActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleBlockAccount = () => {
    if (accountInfo.status === "Inchis") {
      Toast.show({
        type: "error",
        text1: "Contul este închis",
        text2: "Nu mai poate fi blocat.",
      });
      return;
    }

    requestPinProtectedAction("block");
  };

  const handleCloseAccount = () => {
    requestPinProtectedAction("close");
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#FFED00" />
          <Text style={styles.stateText}>Se încarcă detaliile contului...</Text>
        </View>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.container}>
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalii Cont</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.centerState}>
          <Text style={styles.stateText}>{loadError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAccount}>
            <Text style={styles.retryButtonText}>Reîncearcă</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalii Cont</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View style={styles.accountTypeContainer}>
            <View style={styles.accountTypeInfo}>
              <Text style={styles.accountType}>{accountInfo.accountType || "Cont"}</Text>
              <View style={styles.statusBadge}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        accountInfo.status === "Activ"
                          ? "#16A34A"
                          : accountInfo.status === "Blocat"
                          ? "#CA8A04"
                          : "#B91C1C",
                    },
                  ]}
                />
                <Text style={styles.statusText}>{accountInfo.status}</Text>
              </View>
            </View>
          </View>

          <View style={styles.ibanContainer}>
            <Text style={styles.ibanLabel}>IBAN</Text>
            <Text style={styles.ibanNumber}>{formatIBAN(accountInfo.iban)}</Text>
            <View style={styles.ibanActions}>
              <TouchableOpacity style={styles.ibanButton} onPress={() => setShowFullIBAN((prev) => !prev)}>
                <Text style={styles.ibanButtonText}>{showFullIBAN ? "Ascunde" : "Arată"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ibanButton} onPress={handleCopyIBAN}>
                <Text style={styles.ibanButtonText}>Copiază</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Titular Cont</Text>
          <View style={styles.card}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nume complet</Text>
              <Text style={styles.detailValue}>{accountInfo.holderName || "-"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalii Cont</Text>
          <View style={styles.card}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Număr cont</Text>
              <Text style={[styles.detailValue, styles.monoFont]}>{accountInfo.accountNumber || "-"}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Monedă</Text>
              <Text style={styles.detailValue}>{accountInfo.currency}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Data deschidere</Text>
              <Text style={styles.detailValue}>{formatDateOnly(accountInfo.openDate)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Carduri Asociate</Text>
          {!cardsReady ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>Se încarcă lista de carduri...</Text>
            </View>
          ) : associatedCards.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>Nu există carduri asociate.</Text>
            </View>
          ) : (
            associatedCards.map((card) => (
              <View key={card.id} style={styles.cardItem}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{card.scheme} {card.cardType}</Text>
                  <Text style={styles.cardNumber}>{card.maskedPan}</Text>
                  <Text style={styles.cardMeta}>{card.cardFormat}</Text>
                </View>
                <View style={[styles.cardStatusBadge, card.isActive ? styles.activeBadge : styles.blockedBadge]}>
                  <Text style={styles.cardStatusText}>{card.isActive ? "Activ" : "Blocat"}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.dangerTitle}>Zonă Periculoasă</Text>
          <View style={styles.dangerCard}>
            <TouchableOpacity style={styles.dangerButton} onPress={handleBlockAccount} disabled={accountActionLoading}>
              <Text style={styles.dangerButtonText}>Blochează Contul</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.dangerButton, styles.neutralButton]} onPress={handleUnblockAccount} disabled={accountActionLoading}>
              <Text style={styles.dangerButtonText}>Deblochează Contul</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.dangerButton, styles.closeButton]} onPress={handleCloseAccount} disabled={accountActionLoading}>
              <Text style={styles.dangerButtonText}>Închide Contul</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <PinConfirmationModal
        visible={pinModalVisible}
        title={pendingAction === "close" ? "Închidere cont" : "Blocare cont"}
        message={
          pendingAction === "close"
            ? "Introdu PIN-ul pentru a închide contul"
            : "Introdu PIN-ul pentru a bloca contul"
        }
        loading={accountActionLoading}
        error={pinError}
        onCancel={() => {
          setPinModalVisible(false);
          setPinError(null);
          setPendingAction(null);
        }}
        onConfirm={handleConfirmPinAction}
      />
    </View>
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
  scrollView: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: "#FFED00",
    padding: spacing.xxl,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  accountTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  accountTypeInfo: {
    flex: 1,
  },
  accountType: {
    fontSize: fontSizes.xl,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: spacing.xs,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: fontSizes.md,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  ibanContainer: {
    backgroundColor: "#FFFFFF",
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: "#1A1A1A",
  },
  ibanLabel: {
    fontSize: fontSizes.sm,
    color: "#1A1A1A",
    opacity: 0.6,
    marginBottom: spacing.xs,
  },
  ibanNumber: {
    fontSize: fontSizes.lg,
    fontWeight: "600",
    color: "#1A1A1A",
    fontFamily: "Courier",
    marginBottom: spacing.md,
  },
  ibanActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  ibanButton: {
    flex: 1,
    backgroundColor: "#F5D908",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: "#1A1A1A",
    alignItems: "center",
  },
  ibanButtonText: {
    fontSize: fontSizes.md,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSizes.xl,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: "#1A1A1A",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#1A1A1A",
    opacity: 0.7,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#1A1A1A",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  monoFont: {
    fontFamily: "Courier",
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: "#1A1A1A",
    opacity: 0.1,
  },
  cardItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#1A1A1A",
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  cardNumber: {
    fontSize: 14,
    color: "#1A1A1A",
    opacity: 0.7,
    fontFamily: "Courier",
    marginBottom: 2,
  },
  cardMeta: {
    fontSize: 12,
    color: "#1A1A1A",
    opacity: 0.6,
  },
  cardStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1A1A1A",
  },
  activeBadge: {
    backgroundColor: "#FFED00",
  },
  blockedBadge: {
    backgroundColor: "#E5E7EB",
  },
  cardStatusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  emptyText: {
    fontSize: fontSizes.base,
    color: "#6B7280",
    textAlign: "center",
  },
  dangerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: "#B91C1C",
    marginBottom: spacing.md,
  },
  dangerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: "#EF4444",
    gap: spacing.md,
  },
  dangerButton: {
    backgroundColor: "#FEE2E2",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "#EF4444",
    alignItems: "center",
  },
  closeButton: {
    backgroundColor: "#FCA5A5",
  },
  neutralButton: {
    backgroundColor: "#FDE68A",
  },
  dangerButtonText: {
    fontSize: fontSizes.md,
    fontWeight: "700",
    color: "#7F1D1D",
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
  retryButton: {
    marginTop: spacing.lg,
    backgroundColor: "#1A1A1A",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: fontSizes.base,
    fontWeight: "700",
  },
});
