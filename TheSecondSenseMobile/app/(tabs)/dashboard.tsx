import { router } from "expo-router";
import {
  Bell,
  Building,
  CreditCard,
  Lock,
  MessageSquare,
  Mic,
  PieChart,
  Receipt,
  Send,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Importuri Componente (Asigură-te că aceste căi sunt corecte în proiectul tău)
import { AccountOverview } from "@/components/AccountOverview";
import { QuickActions } from "@/components/QuickActions";
import { TransactionList } from "@/components/TransactionList";
import { TransferForm } from "@/components/TransferForm";

export default function DashboardScreen() {
  // 1. STATE-URI
  const [accountData, setAccountData] = useState({
    balance: 0,
    name: "Utilizator",
    accountNumber: "RO00 BNRB 0000 0000",
    monthlyChange: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State-uri pentru Asistentul Vocal
  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);
  const [isVoiceRegistered, setIsVoiceRegistered] = useState(true); // Schimbă pe false pentru a testa blocarea
  const [botMessage, setBotMessage] = useState(
    "Te ascult... Ce operațiune dorești să facem?",
  );
  const [userTranscription, setUserTranscription] = useState("");

  // 2. FETCH DATA DIN API
  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Înlocuiește cu endpoint-urile tale reale
      const [accountRes, transactionsRes] = await Promise.all([
        fetch("https://api.exemplu.ro/account"),
        fetch("https://api.exemplu.ro/transactions"),
      ]);

      const accountJson = await accountRes.json();
      const transactionsJson = await transactionsRes.json();

      setAccountData(accountJson);
      setTransactions(transactionsJson);
    } catch (error) {
      console.error("Eroare la încărcare:", error);
      // Fallback date demo dacă API-ul nu e gata
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

  useEffect(() => {
    fetchData();
  }, []);

  // 3. HANDLERS
  const handleVoiceCommandAction = () => {
    if (!isVoiceRegistered) {
      Alert.alert(
        "Amprentă Vocală Necesară",
        "Pentru siguranța ta, trebuie să îți înregistrezi vocea înainte de a folosi comenzi vocale.",
        [
          { text: "Anulează" },
          {
            text: "Spre Înregistrare",
            onPress: () => router.push("/"),
          },
        ],
      );
      return;
    }
    setIsVoiceModalVisible(true);
    // Aici pornește logica voastră de bot (Voice recognition)
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
      onClick: () => Alert.alert("Info", "Modul Facturi"),
    },
    {
      icon: CreditCard,
      label: "Carduri",
      onClick: () => Alert.alert("Info", "Modul Carduri"),
    },
    {
      icon: Building,
      label: "Detalii",
      onClick: () => Alert.alert("IBAN", accountData.accountNumber),
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

      {/* HEADER PERSONALIZAT */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.greeting}>Bună ziua,</Text>
          <Text style={styles.userName}>{accountData.name}</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Bell size={22} color="#1A1A1A" />
          <View style={styles.notifBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* SOLD CONT */}
        <View style={styles.mainCardContainer}>
          <AccountOverview
            balance={accountData.balance}
            accountName="Cont Curent"
            accountNumber={accountData.accountNumber}
            monthlyChange={accountData.monthlyChange}
          />
        </View>

        {/* ACȚIUNI RAPIDE */}
        <View style={styles.sectionContainer}>
          <QuickActions actions={actions} />
        </View>

        {/* WIDGET ANALITICE */}
        <View style={styles.statsCard}>
          <View style={styles.statsIcon}>
            <PieChart size={22} color="#EAB308" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statsTitle}>Insight Cheltuieli</Text>
            <Text style={styles.statsSubtitle}>
              Luna aceasta ai economisit 450 RON.
            </Text>
          </View>
        </View>

        {/* FORMULAR TRANSFER RAPID */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <TransferForm
            onTransfer={(to, amt) =>
              Alert.alert("Succes", `Trimis ${amt} RON către ${to}`)
            }
          />
        </View>

        {/* PREVIEW TRANZACȚII */}
        <View style={styles.transactionSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Activitate Recentă</Text>
            <TouchableOpacity onPress={() => router.push("/transaction")}>
              <Text style={styles.seeAllText}>Vezi tot</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.listWrapper}>
            <TransactionList transactions={transactions.slice(0, 4)} />
          </View>
        </View>
      </ScrollView>

      {/* BUTOANE PLUTITOARE (FAB) */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fabSmall}
          onPress={() => Alert.alert("Chat", "Asistență disponibilă")}
        >
          <MessageSquare size={20} color="#1A1A1A" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fabMain, !isVoiceRegistered && styles.fabLocked]}
          onPress={handleVoiceCommandAction}
        >
          {isVoiceRegistered ? (
            <Mic size={28} color="#000" />
          ) : (
            <Lock size={22} color="#666" />
          )}
        </TouchableOpacity>
      </View>

      {/* MODAL ASISTENT VOCAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isVoiceModalVisible}
        onRequestClose={() => setIsVoiceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.assistantCard}>
            <View style={styles.modalHandle} />

            <View style={styles.voiceWaveContainer}>
              <Mic size={35} color="#000" />
            </View>

            <Text style={styles.botText}>{botMessage}</Text>

            <View style={styles.transcriptionBox}>
              <Text style={styles.transcriptionText}>
                {userTranscription || "Ex: 'Câți bani am în cont?'"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeAssistantBtn}
              onPress={() => setIsVoiceModalVisible(false)}
            >
              <X size={20} color="#666" />
              <Text style={styles.closeAssistantText}>Închide</Text>
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
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  greeting: { fontSize: 13, color: "#888" },
  userName: { fontSize: 18, fontWeight: "700", color: "#1A1A1A" },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  notifBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    backgroundColor: "#FF4D4D",
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  mainCardContainer: { paddingHorizontal: 16, marginTop: 5 },
  sectionContainer: { marginTop: 15 },
  statsCard: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  statsIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(234, 179, 8, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  statsTitle: { color: "#fff", fontWeight: "600", fontSize: 15 },
  statsSubtitle: { color: "#888", fontSize: 12, marginTop: 2 },
  transactionSection: { marginTop: 25, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#1A1A1A" },
  seeAllText: { color: "#007AFF", fontWeight: "600", fontSize: 14 },
  listWrapper: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  // FAB STYLES
  fabContainer: {
    position: "absolute",
    bottom: 30,
    right: 20,
    alignItems: "center",
    gap: 12,
  },
  fabMain: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFED00",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  fabSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  fabLocked: { backgroundColor: "#E0E0E0" },
  // MODAL STYLES
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
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#EEE",
    borderRadius: 3,
    marginBottom: 20,
  },
  voiceWaveContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFED00",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  botText: {
    fontSize: 19,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  transcriptionBox: {
    backgroundColor: "#F9F9F9",
    padding: 15,
    borderRadius: 12,
    width: "100%",
    marginVertical: 15,
  },
  transcriptionText: {
    color: "#777",
    fontStyle: "italic",
    textAlign: "center",
  },
  closeAssistantBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
  },
  closeAssistantText: { color: "#666", fontWeight: "600" },
});
