import { useTutorial } from "@/tutorial/TutorialContext";
import { router, useFocusEffect } from "expo-router";
import { TutorialTarget } from "@/tutorial/TutorialTarget";
import { spacing, fontSizes, borderRadius, ms, iconSizes } from "@/constants/responsive";
import * as Speech from "expo-speech";
import {
  Building,
  CreditCard,
  Mic,
  PieChart,
  Receipt,
  Send,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AccountOverview } from "@/components/AccountOverview";
import { TransactionList } from "@/components/TransactionList";
import { QuickActions } from "@/components/QuickActions";
import { VoiceControl } from "@/components/VoiceControl";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "./apiService";

export default function DashboardScreen() {
  const { token, user } = useAuth();
  const [accountData, setAccountData] = useState<{
    accountId: number | null;
    accountNumber: string;
    accountType: string;
    currency: string;
    balance: number;
  }>({
    accountId: null,
    accountNumber: "",
    accountType: "",
    currency: "RON",
    balance: 0,
  });

  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [voiceSessionId] = useState(Math.random().toString());
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [pendingCommand, setPendingCommand] = useState<string>(""); // Track the command waiting for confirmation
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isListeningForCommand, setIsListeningForCommand] = useState(false); // Track if waiting for user to speak

  const [executeMode, setExecuteMode] = useState(true); // fals pentru plan

  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);
  const [isVoiceRegistered] = useState(true);

  const [botMessage, setBotMessage] = useState(
    "Te ascult... Ce operațiune dorești să facem?",
  );
  const [userTranscription, setUserTranscription] = useState("");

  const { startTutorial, notifyActionDone } = useTutorial();

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch accounts — separated so a failure here doesn't block transactions
      let accountsData: any[] = [];
      if (user?.id) {
        console.log('[fetchData] user.id:', user.id);
        try {
          accountsData = await apiService.getAccountsByUserId(user.id);
        } catch (accErr) {
          console.error('[fetchData] Accounts fetch failed:', accErr);
        }
      } else {
        console.warn('[fetchData] No user.id — user object:', JSON.stringify(user));
      }

      // Fetch transactions independently
      let transactionsData: any[] = [];
      try {
        transactionsData = await apiService.getTransactions(user?.id ?? '');
      } catch (txErr) {
        console.error('[fetchData] Transactions fetch failed:', txErr);
      }

      if (accountsData.length > 0) {
        const acc = accountsData[0];
        setAccountData({
          accountId: acc.accountId ?? null,
          accountNumber: acc.accountNumber ?? "",
          accountType: acc.accountType ?? "",
          currency: acc.currency ?? "RON",
          balance: acc.balance ?? 0,
        });
      } else {
        console.warn('[fetchData] No accounts returned');
      }

      setTransactions(transactionsData);
    } finally {
      setIsLoading(false);
    }
  };

  const processVoiceCommandGuide = async (text: string) => {
    try {
      setIsProcessingVoice(true);
      setUserTranscription(text);

      const data = await apiService.processVoiceCommand(text, voiceSessionId);

      setBotMessage(data.message);

      Speech.speak(data.message, {
        language: "ro-RO",
        rate: 0.9,
      });

      if (data.steps && Array.isArray(data.steps)) {
        startTutorial(data.steps);
      }

      // if (data.requiresConfirmation) {
      //   setPendingAction(data.payload);
      // } else {
      //   setPendingAction(null);
      // }
    } catch (error) {
      setBotMessage("Momentan serviciul nu este disponibil.");
      Speech.speak("Momentan serviciul nu este disponibil.");
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const processVoiceCommand = async (text: string) => {
    try {
      setIsProcessingVoice(true);
      setUserTranscription(text);

      // In execute mode, if it's a regular command (not CONFIRM/CANCEL), just wait for confirmation
      if (executeMode && text !== "CONFIRM" && text !== "CANCEL") {
        setPendingCommand(text);
        setBotMessage("Ai spus: \"" + text + "\". Confirmă să execut comanda?");
        Speech.speak("Ai spus: " + text + ". Confirmă să execut comanda?", {
          language: "ro-RO",
          rate: 0.9,
        });
        setIsProcessingVoice(false);
        return;
      }

      // Send to backend for processing (execute mode confirmation or plan mode)
      const commandToSend = text === "CONFIRM" ? pendingCommand : text;
      const data = await apiService.processVoiceCommand(commandToSend, voiceSessionId);

      setBotMessage(data.message);

      Speech.speak(data.message, {
        language: "ro-RO",
        rate: 0.9,
      });

      if (!executeMode && data.steps && Array.isArray(data.steps)) {
        startTutorial(data.steps);
      }

      if (data.requiresConfirmation || executeMode) {
        setPendingAction(data.payload);
      } else {
        setPendingAction(null);
      }

      // Clear pending command after sending
      setPendingCommand("");
    } catch (error) {
      console.error('Voice command error:', error);
      setBotMessage("Momentan serviciul nu este disponibil.");
      Speech.speak("Momentan serviciul nu este disponibil.");
      setPendingCommand("");
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const confirmAction = async () => {
    if (executeMode && pendingCommand) {
      // In execute mode, send the pending command to backend
      await processVoiceCommand("CONFIRM");
    } else if (pendingAction) {
      // In plan mode, send confirmation
      await processVoiceCommand("CONFIRM");
    }
    setPendingAction(null);
  };

  const cancelAction = async () => {
    await processVoiceCommand("CANCEL");
    setPendingAction(null);
    setPendingCommand("");
  };

  const handleVoiceCommand = (command: string) => {
    if (command) {
      processVoiceCommand(command);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) fetchData();
    }, [user?.id])
  );

  const handleVoiceCommandAction = () => {
    if (!isVoiceRegistered) {
      Alert.alert(
        "Amprentă Vocală Necesară",
        "Trebuie să îți înregistrezi vocea pentru securitate.",
      );
      return;
    }
    setIsVoiceModalVisible(true);
  };

  const actions = [
    {
      icon: Send,
      label: "Trimite",
      onClick: () => router.push("/transaction"),
    },
    {
      icon: Receipt,
      label: "Facturi",
      onClick: () => router.push("/facturi"),
    },
    {
      icon: CreditCard,
      label: "Carduri",
      onClick: () => router.push("/cards"),
    },
    {
      icon: Building,
      label: "Detalii",
      onClick: () => router.push("/detalii"),
    },
  ];

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FFED00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.secureText}>🔒 Conexiune securizată</Text>
            <Text style={styles.greeting}>Bună ziua,</Text>
            <Text style={[styles.userName, { fontSize: executeMode ? 24 : 18 }]}>
              {user?.name ?? "Utilizator"}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setExecuteMode(!executeMode)}>
            <Text style={{ color: "#007AFF", fontWeight: "600" }}>
              {executeMode ? "Mod Execuție" : "Mod Planificare"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mainCardContainer}>
          <AccountOverview
            balance={accountData.balance}
            accountName={user?.name ?? ""}
            accountNumber={accountData.accountNumber}
            accountType={accountData.accountType}
            currency={accountData.currency}
          />
        </View>

        <View style={styles.actionGrid}>
        <TutorialTarget targetId="sendButton">
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              notifyActionDone("sendButton", "press");
              router.push("/transaction");
            }}
          >
            <Send size={24} color="#000" />
            <Text style={styles.actionLabel}>Trimite</Text>
          </TouchableOpacity>
        </TutorialTarget>

        <TutorialTarget targetId="facturiButton">
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              notifyActionDone("facturiButton", "press");
              router.push("/facturi");
            }}
          >
            <Receipt size={24} color="#000" />
            <Text style={styles.actionLabel}>Facturi</Text>
          </TouchableOpacity>
        </TutorialTarget>

        <TutorialTarget targetId="carduriButton">
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              notifyActionDone("carduriButton", "press");
              router.push("/cards");
            }}
          >
            <CreditCard size={24} color="#000" />
            <Text style={styles.actionLabel}>Carduri</Text>
          </TouchableOpacity>
        </TutorialTarget>

        <TutorialTarget targetId="detaliiButton">
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              notifyActionDone("detaliiButton", "press");
              router.push("/detalii");
            }}
          >
            <Building size={24} color="#000" />
            <Text style={styles.actionLabel}>Detalii</Text>
          </TouchableOpacity>
        </TutorialTarget>
      </View>

      <View style={styles.statsCard}>
        <PieChart size={22} color="#EAB308" />
        <View style={{ flex: 1 }}>
          <Text style={styles.statsTitle}>Insight Cheltuieli</Text>
          <Text style={styles.statsSubtitle}>
            Luna aceasta ai economisit 450 RON.
          </Text>
        </View>
      </View>

      <View style={styles.transactionSection}>
        <Text style={styles.sectionTitle}>Activitate Recentă</Text>
        <View style={styles.listWrapper}>
          <TransactionList transactions={transactions.slice(0, 4)} />
        </View>
      </View>

      {/* FAB */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[
            styles.fabMain,
            { width: executeMode ? 90 : 60, height: executeMode ? 90 : 60 },
          ]}
          onPress={handleVoiceCommandAction}
        >
          <Mic size={executeMode ? 40 : 28} color="#000" />
        </TouchableOpacity>
      </View>

      {/* VOICE MODAL */}
      <Modal visible={isVoiceModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.assistantCard}>
            {isProcessingVoice && (
              <ActivityIndicator size="large" color="#FFED00" />
            )}

            {!isProcessingVoice && <Mic size={iconSizes.xxl} color="#000" />}

            <Text style={styles.botText}>{botMessage}</Text>

            {/* Voice Control - Listen for commands */}
            {!pendingCommand && !isProcessingVoice && (
              <VoiceControl onCommand={handleVoiceCommand} isEnabled={true} />
            )}

            {/* Show transcription if we have a pending command */}
            {pendingCommand && (
              <View style={styles.transcriptionBox}>
                <Text style={styles.transcriptionLabel}>Comanda captată:</Text>
                <Text style={styles.transcriptionText}>{pendingCommand}</Text>
              </View>
            )}

            {/* Confirmation buttons */}
            {pendingCommand && !isProcessingVoice && (
              <View style={styles.confirmBox}>
                <TouchableOpacity onPress={confirmAction} style={styles.confirmBtnStyle}>
                  <Text style={styles.confirmBtn}>✅ Confirmă</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelAction} style={styles.cancelBtnStyle}>
                  <Text style={styles.cancelBtn}>❌ Anulează</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Close button */}
            <TouchableOpacity
              onPress={() => {
                setIsVoiceModalVisible(false);
                setPendingCommand("");
              }}
              style={{ marginTop: spacing.lg }}
            >
              <Text style={{ marginTop: 10, color: "#1A1A1A", fontWeight: "600" }}>Închide</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </ScrollView >
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingBottom: 100 },
  secureText: { fontSize: 12, color: "green", marginBottom: 4 },
  greeting: { fontSize: 13, color: "#555" },
  userName: { fontWeight: "700", color: "#000" },
  topHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  mainCardContainer: { paddingHorizontal: 16 },
  sectionContainer: { marginTop: 15 },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 12,
  },
  actionButton: {
    width: "70%",
    backgroundColor: "#FFED00",
    padding: 16,
    paddingVertical: 18,
    minHeight: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionLabel: { marginTop: 10, fontWeight: "700", fontSize: 16 },
  statsCard: {
    margin: 16,
    padding: 16,
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statsTitle: { color: "#fff", fontWeight: "600" },
  statsSubtitle: { color: "#ccc", fontSize: 12 },
  transactionSection: { marginTop: 25, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  listWrapper: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
  },
  fabContainer: {
    position: "absolute",
    bottom: 30,
    right: 20,
  },
  fabMain: {
    borderRadius: 50,
    backgroundColor: "#FFED00",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  assistantCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 25,
    alignItems: "center",
  },
  botText: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 10,
  },
  transcriptionBox: {
    backgroundColor: "#F1F1F1",
    padding: 15,
    borderRadius: 12,
    width: "100%",
    marginVertical: spacing.md,
  },
  transcriptionLabel: {
    color: "#666",
    fontSize: fontSizes.sm,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  transcriptionText: {
    color: "#1A1A1A",
    textAlign: "center",
    fontSize: fontSizes.base,
    fontWeight: "600",
  },
  confirmBox: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.lg,
    width: "100%",
    justifyContent: "center",

  },
  confirmBtnStyle: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    minWidth: ms(100),
    alignItems: "center",
  },
  cancelBtnStyle: {
    backgroundColor: "#FF5252",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    minWidth: ms(100),
    alignItems: "center",
  },
  confirmBtn: { color: "#fff", fontWeight: "700", fontSize: fontSizes.base },
  cancelBtn: { color: "#fff", fontWeight: "700", fontSize: fontSizes.base },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
});
