import { useTutorial } from "@/tutorial/TutorialContext";
import { router } from "expo-router";
import * as Speech from "expo-speech";
import {
  Building,
  CreditCard,
  Mic,
  PieChart,
  Receipt,
  Send,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AccountOverview } from "@/components/AccountOverview";
import { TransactionList } from "@/components/TransactionList";
import { QuickActions } from "@/components/QuickActions";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "./apiService";
import { spacing, fontSizes, borderRadius, iconSizes, ms } from "@/constants/responsive";

export default function DashboardScreen() {
  const { token } = useAuth();
  const [accountData, setAccountData] = useState({
    balance: 0,
    name: "Utilizator",
    accountNumber: "RO00 BNRB 0000 0000",
    monthlyChange: 0,
  });

  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [voiceSessionId] = useState(Math.random().toString());
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const [executeMode, setExecuteMode] = useState(true); // fals pentru plan

  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);
  const [isVoiceRegistered] = useState(true);

  const [botMessage, setBotMessage] = useState(
    "Te ascult... Ce operațiune dorești să facem?",
  );
  const [userTranscription, setUserTranscription] = useState("");

  const {startTutorial, notifyActionDone} = useTutorial();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [account, transactions] = await Promise.all([
        apiService.getAccount(),
        apiService.getTransactions(),
      ]);

      setAccountData(account);
      setTransactions(transactions);
    } catch (error) {
      setAccountData({
        balance: 12450.75,
        name: "Alex Ionescu",
        accountNumber: "RO49 INGB 0001 2233 4455",
        monthlyChange: +12.4,
      });
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

      if(data.steps && Array.isArray(data.steps)) {
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

      const data = await apiService.processVoiceCommand(text, voiceSessionId);

      setBotMessage(data.message);

      Speech.speak(data.message, {
        language: "ro-RO",
        rate: 0.9,
      });

      if(!executeMode && data.steps && Array.isArray(data.steps)) {
        startTutorial(data.steps);
      }

      if (data.requiresConfirmation) {
        setPendingAction(data.payload);
      } else {
        setPendingAction(null);
      }
    } catch (error) {
      setBotMessage("Momentan serviciul nu este disponibil.");
      Speech.speak("Momentan serviciul nu este disponibil.");
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const confirmAction = () => {
    if (!pendingAction) return;
    processVoiceCommand("CONFIRM");
    setPendingAction(null);
  };

  const cancelAction = () => {
    processVoiceCommand("CANCEL");
    setPendingAction(null);
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      targetId: "sendButton",
      icon: Send,
      label: "Trimite",
      onClick: () => router.push("/transaction"),
    },
    {
      targetId: "facturiButton",
      icon: Receipt,
      label: "Facturi",
      onClick: () => router.push("/facturi"),
    },
    {
      targetId: "carduriButton",
      icon: CreditCard,
      label: "Carduri",
      onClick: () => router.push("/cards"),
    },
    {
      targetId: "detaliiButton",
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
              {accountData.name}
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
            accountName="Cont Curent"
            accountNumber={accountData.accountNumber}
            monthlyChange={accountData.monthlyChange}
          />
        </View>

        <View style={styles.sectionContainer}>
          <QuickActions actions={actions} />
        </View>

        <View style={styles.statsCard}>
          <PieChart size={iconSizes.md} color="#EAB308" />
          <View style={{ flex: 1 }}>
            <Text style={styles.statsTitle}>Insight Cheltuieli</Text>
            <Text style={styles.statsSubtitle}>
              Luna aceasta ai economisit 450 RON.
            </Text>
          </View>
        </View>

        <View style={styles.transactionSection}>
          <Text style={styles.sectionTitle}>Activitate Recentă</Text>
          <TransactionList transactions={transactions.slice(0, 4)} scrollable={false} />
        </View>
      </ScrollView>

      {/* FAB */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[
            styles.fabMain,
            { width: executeMode ? ms(90) : ms(60), height: executeMode ? ms(90) : ms(60) },
          ]}
          onPress={handleVoiceCommandAction}
        >
          <Mic size={executeMode ? iconSizes.xl : iconSizes.lg} color="#000" />
        </TouchableOpacity>
      </View>

      {/* MODAL */}
      <Modal visible={isVoiceModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.assistantCard}>
            <Mic size={iconSizes.xxl} color="#000" />

            {isProcessingVoice && (
              <ActivityIndicator size="large" color="#FFED00" />
            )}

            <Text style={styles.botText}>{botMessage}</Text>

            <View style={styles.transcriptionBox}>
              <Text style={styles.transcriptionText}>
                {userTranscription || "Spune comanda ta..."}
              </Text>
            </View>

            {/* Confirmare */}
            {pendingAction && (
              <View style={styles.confirmBox}>
                <TouchableOpacity onPress={confirmAction}>
                  <Text style={styles.confirmBtn}>✅ Confirmă</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelAction}>
                  <Text style={styles.cancelBtn}>❌ Anulează</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              onPress={() => processVoiceCommand("Trimite 200 lei Mariei")}
            >
              <Text style={{ fontWeight: "600", marginTop: 10 }}>
                Simulează comandă
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsVoiceModalVisible(false)}>
              <Text style={{ marginTop: 10 }}>Închide</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingBottom: ms(120) },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  secureText: { fontSize: fontSizes.sm, color: "green", marginBottom: spacing.xs },
  greeting: { fontSize: fontSizes.sm, color: "#555" },
  userName: { fontWeight: "700", color: "#000" },
  topHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  mainCardContainer: { paddingHorizontal: spacing.lg },
  sectionContainer: { marginTop: spacing.md },
  actionButton: {
    width: "49%",
    backgroundColor: "#FFED00",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: ms(100),
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { 
    marginTop: spacing.sm, 
    fontWeight: "700", 
    fontSize: fontSizes.huge,
    textAlign: "center",
    color: "#000",
    lineHeight: fontSizes.base + 2,
  },
  statsCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: "#1A1A1A",
    borderRadius: borderRadius.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statsTitle: { color: "#fff", fontWeight: "600" },
  statsSubtitle: { color: "#ccc", fontSize: fontSizes.sm },
  sectionTitle: { fontSize: fontSizes.lg, fontWeight: "700" },
  transactionSection: { marginTop: spacing.xxl, paddingHorizontal: spacing.lg, marginBottom: spacing.xxxl },
  fabContainer: {
    position: "absolute",
    bottom: spacing.xxxl,
    right: spacing.lg,
  },
  fabMain: {
    borderRadius: ms(50),
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
    borderTopLeftRadius: ms(28),
    borderTopRightRadius: ms(28),
    padding: spacing.xxl,
    alignItems: "center",
  },
  botText: {
    fontSize: fontSizes.lg,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: spacing.sm,
  },
  transcriptionBox: {
    backgroundColor: "#F1F1F1",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    width: "100%",
  },
  transcriptionText: {
    color: "#333",
    textAlign: "center",
  },
  confirmBox: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  confirmBtn: { color: "green", fontWeight: "700" },
  cancelBtn: { color: "red", fontWeight: "700" },
});
