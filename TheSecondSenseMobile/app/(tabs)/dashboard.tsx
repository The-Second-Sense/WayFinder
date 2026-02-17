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
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AccountOverview } from "@/components/AccountOverview";
import { TransactionList } from "@/components/TransactionList";
import { TutorialTarget } from "@/tutorial/TutorialTarget";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "./apiService";

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

  const [seniorMode, setSeniorMode] = useState(true);

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

      {/* <View style={styles.sectionContainer}>
        <QuickActions actions={actions} />
      </View> */}

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

      {/* MODAL */}
      <Modal visible={isVoiceModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.assistantCard}>
            <Mic size={35} color="#000" />

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
  },
  transcriptionText: {
    color: "#333",
    textAlign: "center",
  },
  confirmBox: {
    flexDirection: "row",
    gap: 20,
    marginTop: 15,
  },
  confirmBtn: { color: "green", fontWeight: "700" },
  cancelBtn: { color: "red", fontWeight: "700" },
});
