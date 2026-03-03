import { useTutorial } from "@/tutorial/TutorialContext";
import { router, useFocusEffect } from "expo-router";
import { TutorialTarget } from "@/tutorial/TutorialTarget";
import { spacing, fontSizes, borderRadius, ms, iconSizes } from "@/constants/responsive";
import * as Speech from "expo-speech";
import Voice from "@react-native-voice/voice";
import {
  Building,
  CreditCard,
  Mic,
  PieChart,
  Receipt,
  Send,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  NativeModules,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";

// @react-native-voice/voice requires native linking — unavailable on web / Expo Go
// Android registers the module as "Voice", iOS as "RCTVoice"
const voiceSTTAvailable =
  Platform.OS !== "web" &&
  (!!NativeModules.RCTVoice || !!NativeModules.Voice);
import { SafeAreaView } from "react-native-safe-area-context";

import { AccountOverview } from "@/components/AccountOverview";
import { TransactionList } from "@/components/TransactionList";
import { QuickActions } from "@/components/QuickActions";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "./apiService";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

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
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAudioBase64Ref = useRef<string | null>(null);
  const { isRecording, startRecording, stopRecording } = useAudioRecorder();

  const [executeMode, setExecuteMode] = useState(true); // fals pentru plan
  const [backendResponded, setBackendResponded] = useState(false);
  const [lastVoiceResponse, setLastVoiceResponse] = useState<any>(null); // stores full backend response

  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);
  const [errorPopup, setErrorPopup] = useState<string | null>(null);

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

  // Maps backend navigateToScreen value to an app route
  const resolveGuideRoute = (screen: string | undefined): string | null => {
    if (!screen) return null;
    const map: Record<string, string> = {
      TRANSFER_MONEY: '/transaction',
      TRANSFER: '/transaction',
      TRANSACTION: '/transaction',
      PAYMENT: '/facturi',
      FACTURI: '/facturi',
      CARDS: '/cards',
      CARD: '/cards',
      DETAILS: '/detalii',
      DETALII: '/detalii',
    };
    return map[screen.toUpperCase()] ?? `/${screen.toLowerCase()}`;
  };

  const processVoiceCommand = async (audioBase64: string, transcribedText: string) => {
    try {
      setIsProcessingVoice(true);
      const aiMode = executeMode ? 'AGENT' : 'GUIDE';

      const data = await apiService.processVoiceCommand(user?.id ?? '', audioBase64, aiMode);

      setLastVoiceResponse(data);
      setPendingCommand("");
      pendingAudioBase64Ref.current = null;
      console.log('[processVoiceCommand] Backend response:', data);
      if (aiMode === 'GUIDE') {
        console.log('[processVoiceCommand] Entering GUIDE mode with steps:', data.guidanceSteps);
        // — GUIDE mode: speak guidance, start tutorial overlay, navigate, close modal —
        const tts = data.guidanceMessage ?? data.message ?? 'Urmează pașii afișați.';
        setBotMessage(tts);
        Speech.speak(tts, { language: 'ro-RO', rate: 0.9 });

        // Map GuidanceStep[] → TutorialStep[]
        // targetId is now used directly from the backend's highlightButtonId
        const rawSteps: any[] = Array.isArray(data.guidanceSteps) ? data.guidanceSteps : [];
        console.log('[GUIDE] raw guidanceSteps:', JSON.stringify(rawSteps, null, 2));
        const tutorialSteps = rawSteps.map((s: any, i: number) => {
          // Backend GuidanceStep fields: elementId, instruction
          const targetId: string = s.elementId ?? '';
          const message: string = s.instruction ?? `Pasul ${i + 1}`;
          console.log(`[GUIDE] step ${i}: targetId="${targetId}" message="${message}"`);
          return {
            id: `guide-step-${i}`,
            targetId,
            action: 'press' as 'press' | 'input',
            message,
          };
        });

        // Close voice modal first so it doesn't interfere with measureInWindow,
        // then start the tutorial after the modal animation completes (~350ms)
        setIsVoiceModalVisible(false);
        setBackendResponded(false);

        if (tutorialSteps.length > 0) {
          setTimeout(() => startTutorial(tutorialSteps), 400);
        }
      } else {
        // — AGENT mode: show message, wait for user to confirm/dismiss —
        const msg = data.message ?? 'Comanda a fost procesată.';
        setBotMessage(msg);
        Speech.speak(msg, { language: 'ro-RO', rate: 0.9 });

        if (data.requiresConfirmation) {
          setPendingAction(data.payload);
        } else {
          setPendingAction(null);
        }
        setBackendResponded(true); // show OK / Nouă comandă buttons
      }
    } catch (error) {
      console.error('Voice command error:', error);
      setBotMessage('Momentan serviciul nu este disponibil.');
      Speech.speak('Momentan serviciul nu este disponibil.');
      setPendingCommand("");
      pendingAudioBase64Ref.current = null;
      setBackendResponded(true);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const confirmAction = async () => {
    const audio = pendingAudioBase64Ref.current;
    const text = pendingCommand;
    if (!audio || !text) return;
    await processVoiceCommand(audio, text);
    setPendingAction(null);
  };

  const cancelAction = () => {
    if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
    if (voiceSTTAvailable) Voice.stop().catch(() => {});
    pendingAudioBase64Ref.current = null;
    setPendingCommand("");
    setPendingAction(null);
    setBackendResponded(false);
    setLastVoiceResponse(null);
    setUserTranscription("");
    setIsProcessingVoice(false);
    setIsListeningForCommand(false);
    setBotMessage("Te ascult... Ce operațiune dorești să facem?");
    setIsVoiceModalVisible(false);
  };

  // Called when the user taps the mic in the modal
  const handleMicPress = async () => {
    if (isRecording || isProcessingVoice) return;

    // Reset any previous state
    pendingAudioBase64Ref.current = null;
    setPendingCommand("");
    setBackendResponded(false);
    setLastVoiceResponse(null);

    // 1. AI speaks a prompt
    const prompt = "Te ascult. Spune comanda.";
    setBotMessage(prompt);
    Speech.speak(prompt, { language: "ro-RO", rate: 0.9 });

    // 2. Wait for speech to finish (~2s), then start recording + Voice
    setTimeout(async () => {
      setIsListeningForCommand(true);
      setBotMessage("🎙 Ascult...");

      // Start audio recording (for backend)
      await startRecording();

      // Start local speech-to-text (native only)
      if (voiceSTTAvailable) {
        try {
          await Voice.start("ro-RO");
        } catch (e) {
          console.warn("Voice STT start error:", e);
        }
      }

      // 3. Auto-stop after 5 seconds
      recordingTimerRef.current = setTimeout(async () => {
        setIsListeningForCommand(false);
        setBotMessage("Se transcrie...");

        // Stop Voice STT — result arrives via onSpeechResults
        if (voiceSTTAvailable) {
          try { await Voice.stop(); } catch (e) {}
        }

        // Stop audio recording and save
        const audioBase64 = await stopRecording();
        if (audioBase64) {
          pendingAudioBase64Ref.current = audioBase64;
          // If STT is unavailable, bypass transcription and go straight to confirm
          if (!voiceSTTAvailable) {
            setPendingCommand("(comandă vocală)");
            setBotMessage("Audio capturat. Confirmi trimiterea comenzii?");
          }
        } else {
          setBotMessage("Nu am putut capta audio. Încearcă din nou.");
        }
      }, 7000);
    }, 3000);
  };

  useEffect(() => {
    if (!voiceSTTAvailable) return;
    // Local speech-to-text result handler
    Voice.onSpeechResults = (e) => {
      const text = e.value?.[0] ?? "";
      if (text) {
        setUserTranscription(text);
        setPendingCommand(text);
        const confirmMsg = `Ai spus: "${text}". Confirmi execuția comenzii?`;
        setBotMessage(confirmMsg);
        // No Speech.speak here — user confirms/cancels via buttons, not voice
      } else {
        setBotMessage("Nu am înțeles comanda. Încearcă din nou.");
        pendingAudioBase64Ref.current = null;
      }
    };
    Voice.onSpeechError = () => {
      setBotMessage("Eroare la recunoașterea vocii. Încearcă din nou.");
      pendingAudioBase64Ref.current = null;
    };
    return () => {
      Voice.destroy().then(Voice.removeAllListeners).catch(() => {});
    };
  }, []);

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) fetchData();
    }, [user?.id])
  );

  const handleVoiceCommandAction = () => {
    if (!user?.id) return;
    if (!user?.isVoiceAuthEnabled) {
      Alert.alert(
        "Amprentă Vocală Neînregistrată",
        "Nu ai o amprentă vocală înregistrată. Înregistrează-ți vocea din setările contului."
      );
      return;
    }
    setBackendResponded(false);
    setIsVoiceModalVisible(true);
    setTimeout(() => handleMicPress(), 300);
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
            {/* <Text style={styles.secureText}>🔒 Conexiune securizată</Text> */}
            <Text style={styles.greeting}>Bună ziua,</Text>
            <Text style={[styles.userName, { fontSize: fontSizes.xl }]}>
              {user?.name ?? "Utilizator"}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setExecuteMode(!executeMode)}>
            <Text style={{ color: "#007AFF", fontWeight: "600", fontSize: fontSizes.lg }}>
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
        <TutorialTarget targetId="nav-transfer-button">
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              notifyActionDone("nav-transfer-button", "press");
              router.push("/transaction");
            }}
          >
            <Send size={24} color="#000" />
            <Text style={styles.actionLabel}>Trimite</Text>
          </TouchableOpacity>
        </TutorialTarget>

        <TutorialTarget targetId="nav-facturi-button">
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              notifyActionDone("nav-facturi-button", "press");
              router.push("/facturi");
            }}
          >
            <Receipt size={24} color="#000" />
            <Text style={styles.actionLabel}>Facturi</Text>
          </TouchableOpacity>
        </TutorialTarget>

        <TutorialTarget targetId="nav-cards-button">
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              notifyActionDone("nav-cards-button", "press");
              router.push("/cards");
            }}
          >
            <CreditCard size={24} color="#000" />
            <Text style={styles.actionLabel}>Carduri</Text>
          </TouchableOpacity>
        </TutorialTarget>

        <TutorialTarget targetId="nav-detalii-button">
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              notifyActionDone("nav-detalii-button", "press");
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

      </ScrollView>

      {/* FAB - fixed above content */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fabMain, { width: 70, height: 70 }]}
          onPress={handleVoiceCommandAction}
        >
          <Mic size={40} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Error Popup */}
      <Modal visible={!!errorPopup} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.errorPopupCard}>
            <TouchableOpacity
              onPress={() => setErrorPopup(null)}
              style={styles.errorPopupClose}
            >
              <Text style={styles.errorPopupCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.errorPopupTitle}>Eroare</Text>
            <Text style={styles.errorPopupMessage}>{errorPopup}</Text>
          </View>
        </View>
      </Modal>

      {/* VOICE MODAL */}
      <Modal visible={isVoiceModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.assistantCard}>
            {/* AI / processing status icon */}
            {isProcessingVoice ? (
              <ActivityIndicator size="large" color="#FFED00" />
            ) : isListeningForCommand || isRecording ? (
              <View style={styles.listeningIndicator}>
                <Mic size={iconSizes.xxl} color="#FF3B30" />
              </View>
            ) : (
              <Mic size={iconSizes.xxl} color="#000" />
            )}

            <Text style={styles.botText}>{botMessage}</Text>

            {/* Example command hint */}
            {!pendingCommand && !isProcessingVoice && !isRecording && !isListeningForCommand && (
              <Text style={styles.exampleHint}>
                Ex: „Trimite 100 de lei lui Andrei"
              </Text>
            )}

            {/* Tap-to-record mic button removed — recording starts automatically after AI speaks */}

            {/* Show captured command waiting for confirmation */}
            {pendingCommand && (
              <View style={styles.transcriptionBox}>
                <Text style={styles.transcriptionLabel}>Comanda captată:</Text>
                <Text style={styles.transcriptionText}>{pendingCommand}</Text>
              </View>
            )}

            {/* Confirmation buttons — before sending to backend */}
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
                if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
                if (isRecording) stopRecording();
                if (voiceSTTAvailable) Voice.stop().catch(() => {});
                pendingAudioBase64Ref.current = null;
                setIsVoiceModalVisible(false);
                setIsListeningForCommand(false);
                setIsProcessingVoice(false);
                setPendingCommand("");
                setPendingAction(null);
                setBackendResponded(false);
                setLastVoiceResponse(null);
                setUserTranscription("");
                setBotMessage("Te ascult... Ce operațiune dorești să facem?");
              }}
              style={{ marginTop: spacing.lg }}
            >
              <Text style={{ marginTop: 10, color: "#1A1A1A", fontWeight: "600" }}>Închide</Text>
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
  greeting: { fontSize: 14, color: "#555" },
  userName: { fontWeight: "700", color: "#000" },
  topHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  mainCardContainer: { paddingHorizontal: 16 },
  sectionContainer: { marginTop: 15 },
  actionGrid: {
     flexDirection: "row",
    // flexWrap: "wrap",
     justifyContent: "space-between",
    // paddingHorizontal: 16,
    marginTop: 15,
  },
  actionButton: {
    // width: "70%",
     backgroundColor: "#FFED00",
     padding: 10,
    // paddingVertical: 18,
    // minHeight: 40,
     borderRadius: 15,
     alignItems: "center",
     justifyContent: "center",
    // marginBottom: 12,
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
  exampleHint: {
    fontSize: 13,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 10,
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
  recordMicBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFED00",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 50,
    marginTop: 12,
  },
  recordMicBtnActive: {
    backgroundColor: "#FFE0DE",
  },
  recordMicLabel: {
    fontWeight: "700",
    fontSize: fontSizes.base,
    color: "#1A1A1A",
  },
  listeningIndicator: {
    padding: 8,
    borderRadius: 50,
    backgroundColor: "#FFE0DE",
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  errorPopupCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 32,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  errorPopupClose: {
    position: "absolute",
    top: 12,
    right: 14,
    padding: 4,
  },
  errorPopupCloseText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#555",
  },
  errorPopupTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#dc2626",
    marginBottom: 10,
    marginTop: 8,
  },
  errorPopupMessage: {
    fontSize: 15,
    color: "#333",
    textAlign: "center",
    lineHeight: 22,
  },
});
