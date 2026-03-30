import { borderRadius, fontSizes, iconSizes, ms, spacing } from "@/constants/responsive";
import { useTutorial } from "@/tutorial/TutorialContext";
import { TutorialTarget } from "@/tutorial/TutorialTarget";
import { router, useFocusEffect } from "expo-router";
import * as Speech from "expo-speech";
import {
  Building,
  CreditCard,
  LogOut,
  Mic,
  Receipt,
  Send
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  NativeModules,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// @react-native-voice/voice requires native linking — unavailable on web / Expo Go
// Android registers the module as "Voice", iOS as "RCTVoice"
const voiceSTTAvailable =
  Platform.OS !== "web" &&
  (!!NativeModules.RCTVoice || !!NativeModules.Voice);

// Expo Go does not include this native module; load it only when available.
let Voice: any = null;
if (voiceSTTAvailable) {
  try {
    Voice = require("@react-native-voice/voice").default;
  } catch {
    Voice = null;
  }
}

// Hide native password toggle only when running in a browser environment.
if (Platform.OS === "web" && typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    input[type="password"]::-webkit-credentials-auto-fill-button,
    input[type="password"]::-webkit-outer-autofill-button {
      display: none !important;
    }
    input[type="password"]::-ms-reveal {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}
const hasVoiceSTT = voiceSTTAvailable && !!Voice;

import { AccountOverview } from "@/components/AccountOverview";
import { TransactionList } from "@/components/TransactionList";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { fetchPhonebookContacts } from "@/hooks/usePhonebookContacts";
import { useAuth } from "../contexts/AuthContext";
import { apiService, BillDto, ContactLiteDto, ProviderDto, VoiceCandidate } from "./apiService";

type BillPaymentStep =
  | "idle"
  | "provider_selection"
  | "bill_selection"
  | "amount_input"
  | "confirmation";

const BILL_CATEGORY_KEYWORDS: Record<string, string[]> = {
  electricity: ["electricitate", "curent", "electrica", "enel", "energie", "lumina", "lumină"],
  gas: ["gaz", "incalzire", "încălzire", "heating", "eon", "engie"],
  water: ["apa", "apă", "water", "apa nova", "canal"],
  internet: ["internet", "digi", "vodafone", "orange", "cablu", "tv", "broadband"],
  telecom: ["telefon", "mobil", "carte", "plan", "abonament"],
};

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const extractAmountFromText = (text: string): number | undefined => {
  const amountMatch = normalizeText(text).match(/(\d+(?:[.,]\d+)?)/);
  if (!amountMatch?.[1]) return undefined;
  const parsed = Number(amountMatch[1].replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const extractCategoryFromText = (text: string): string | null => {
  const normalized = normalizeText(text);
  for (const [category, keywords] of Object.entries(BILL_CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => normalized.includes(normalizeText(keyword)))) {
      return category;
    }
  }
  return null;
};

const isBillIntent = (text: string) => {
  const normalized = normalizeText(text);
  return (
    normalized.includes("factur") ||
    normalized.includes("plat") ||
    extractCategoryFromText(normalized) !== null
  );
};

const normalizeGuideTargetId = (targetId: string | undefined) => {
  if (!targetId) return "";
  const normalized = targetId.trim().toLowerCase();
  const aliases: Record<string, string> = {
    "nav-facturi-button": "nav-bills-button",
  };
  return aliases[normalized] ?? normalized;
};

const isIbanFallbackMessage = (value: string | undefined) =>
  typeof value === "string" &&
  (/iban/i.test(value) || /targetaccountnumber\s+is\s+required/i.test(value));

const normalizeTransferFallbackMessage = (value: string | undefined) => {
  if (!value) return "Destinatarul nu are un cont Wayfinder. Te rog introdu IBAN-ul pentru transfer extern.";
  if (/targetaccountnumber\s+is\s+required/i.test(value)) {
    return "Destinatarul nu are un cont Wayfinder. Te rog introdu IBAN-ul pentru transfer extern.";
  }
  return value
    .replace(/foaia\s+de\s+contacte/gi, "contacte")
    .replace(/foaia\s+de\s+contact/gi, "contacte");
};

const shouldPromptManualTransferEntry = (data: any) => {
  const actionData = data?.actionData ?? {};
  return (
    !!data?.requiresManualEntry ||
    !!data?.requiresIbanEntry ||
    !!actionData?.requiresManualEntry ||
    !!actionData?.requiresIbanEntry ||
    isIbanFallbackMessage(data?.message)
  );
};

const IBAN_WARNING_REDIRECT_DELAY_MS = 1800;

const buildCandidateDetails = (candidate: VoiceCandidate) => {
  return candidate.phone ? `telefon ${candidate.phone}` : "";
};

export default function DashboardScreen() {
  const { token, user, logout } = useAuth();

  const handleLogout = async () => {
    router.replace("/(tabs)/login");
    await logout();
  };
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
  const latestFetchRequestRef = useRef(0);
  const { isRecording, startRecording, stopRecording } = useAudioRecorder();

  const [executeMode, setExecuteMode] = useState(true); // fals pentru plan
  const [backendResponded, setBackendResponded] = useState(false);
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [pendingOperationId, setPendingOperationId] = useState<string | null>(null);
  const [voiceCandidates, setVoiceCandidates] = useState<VoiceCandidate[]>([]);
  const [showCandidateList, setShowCandidateList] = useState(false);
  const [lastVoiceResponse, setLastVoiceResponse] = useState<any>(null); // stores full backend response
  const [providerMatches, setProviderMatches] = useState<ProviderDto[]>([]);
  const [billMatches, setBillMatches] = useState<BillDto[]>([]);
  const [manualBillAmount, setManualBillAmount] = useState("");
  const [billPaymentStep, setBillPaymentStep] = useState<BillPaymentStep>("idle");
  const contactsRef = useRef<ContactLiteDto[]>([])

  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);
  const [errorPopup, setErrorPopup] = useState<string | null>(null);
  const [showVoiceAuthPopup, setShowVoiceAuthPopup] = useState(false);

  const [botMessage, setBotMessage] = useState(
    "Te ascult... Ce operațiune dorești să facem?",
  );
  const [userTranscription, setUserTranscription] = useState("");

  const { startTutorial, notifyActionDone } = useTutorial();

  // Ref so stale closures (onSpeechResults useEffect) always call the latest version
  const processVoiceCmdRef = useRef<(audio: string, text: string) => Promise<void>>(async () => {});

  const fetchData = async () => {
    const requestId = ++latestFetchRequestRef.current;
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

      if (requestId !== latestFetchRequestRef.current) {
        return;
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
      if (requestId === latestFetchRequestRef.current) {
        setIsLoading(false);
      }
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
      BILLS: '/facturi',
      BILL: '/facturi',
      FACTURI: '/facturi',
      CARDS: '/cards',
      CARD: '/cards',
      DETAILS: '/detalii',
      DETALII: '/detalii',
    };
    return map[screen.toUpperCase()] ?? `/${screen.toLowerCase()}`;
  };

  const resetBillFlowState = () => {
    setProviderMatches([]);
    setBillMatches([]);
    setManualBillAmount("");
    setBillPaymentStep("idle");
  };

  const resolveProviderTargetAccount = async (providerId?: string, providerName?: string) => {
    if (!providerId && !providerName) return undefined;
    try {
      const providers = await apiService.getProviders();
      const matched = providerId
        ? providers.find((provider) => provider.id === providerId)
        : providers.find((provider) => normalizeText(provider.name) === normalizeText(providerName || ""));
      return matched?.targetAccountNumber;
    } catch {
      return undefined;
    }
  };

  const prepareBillConfirmation = async (
    bill: BillDto,
    preferredAmount?: number,
    knownTargetAccountNumber?: string
  ) => {
    const amount = preferredAmount ?? bill.amount;
    const targetAccountNumber =
      knownTargetAccountNumber ??
      (await resolveProviderTargetAccount(bill.providerId, bill.providerName));

    setPendingAction({
      actionType: "bill-payment",
      billId: bill.id,
      providerId: bill.providerId,
      providerName: bill.providerName,
      targetAccountNumber,
      amount,
      currency: bill.currency ?? "RON",
      description: bill.billName,
      recipientName: bill.providerName ?? "furnizor",
    });
    setRequiresConfirmation(true);
    setBackendResponded(true);
    setBillPaymentStep("confirmation");

    const providerLabel = bill.providerName ?? "furnizor";
    const msg = `Confirmați plata de ${amount} ${bill.currency ?? "RON"} la ${providerLabel}?`;
    setBotMessage(msg);
    Speech.speak(msg, { language: "ro-RO", rate: 0.9 });
  };

  const loadBillsForProvider = async (provider: ProviderDto, preferredAmount?: number) => {
    if (!user?.id) return;
    let bills: BillDto[] = [];
    try {
      bills = await apiService.getPendingBillsByProviderName(user.id, provider.name);
    } catch {
      bills = await apiService.getBillsByUserIdFiltered(user.id, {
        providerId: provider.id,
        status: "PENDING",
      });
    }

    if (bills.length === 0) {
      setPendingAction({
        actionType: "bill-payment",
        providerId: provider.id,
        providerName: provider.name,
        targetAccountNumber: provider.targetAccountNumber,
        amount: preferredAmount,
        currency: "RON",
        description: `Plată factură ${provider.name}`,
        recipientName: provider.name,
      });

      if (preferredAmount) {
        setRequiresConfirmation(true);
        setBackendResponded(true);
        setBillPaymentStep("confirmation");
        const msg = `Confirmați plata de ${preferredAmount} RON la ${provider.name}?`;
        setBotMessage(msg);
        Speech.speak(msg, { language: "ro-RO", rate: 0.9 });
      } else {
        setBillPaymentStep("amount_input");
        setBackendResponded(true);
        setRequiresConfirmation(false);
        const msg = `Nu aveți facturi la ${provider.name}. Introduceți suma pe care doriți s-o plătiți.`;
        setBotMessage(msg);
        Speech.speak(msg, { language: "ro-RO", rate: 0.9 });
      }
      return;
    }

    if (bills.length === 1) {
      await prepareBillConfirmation(bills[0], preferredAmount, provider.targetAccountNumber);
      return;
    }

    setBillMatches(bills);
    setPendingAction((prev: any) => ({
      ...(prev || {}),
      actionType: "bill-payment",
      providerId: provider.id,
      providerName: provider.name,
      targetAccountNumber: provider.targetAccountNumber,
      currency: "RON",
      amount: preferredAmount,
    }));
    setBillPaymentStep("bill_selection");
    setBackendResponded(true);
    setRequiresConfirmation(false);

    const msg = `Am găsit mai multe facturi la ${provider.name}. Alegeți factura pe care doriți să o plătiți.`;
    setBotMessage(msg);
    Speech.speak(msg, { language: "ro-RO", rate: 0.9 });
  };

  const handleBillIntentFlow = async (transcribedText: string) => {
    if (!user?.id) return false;

    if (!isBillIntent(transcribedText)) {
      return false;
    }

    resetBillFlowState();
    const preferredAmount = extractAmountFromText(transcribedText);
    const category = extractCategoryFromText(transcribedText);

    if (category) {
      let categoryBills: BillDto[] = [];
      try {
        categoryBills = await apiService.getPendingBillsByCategory(user.id, category);
      } catch {
        categoryBills = await apiService.getBillsByUserIdFiltered(user.id, {
          category,
          status: "PENDING",
        });
      }

      if (categoryBills.length === 0) {
        setPendingAction({
          actionType: "bill-payment",
          category,
          amount: preferredAmount,
          currency: "RON",
          description: `Plată factură ${category}`,
          recipientName: category,
        });

        if (preferredAmount) {
          setRequiresConfirmation(true);
          setBackendResponded(true);
          setBillPaymentStep("confirmation");
          const msg = `Confirmați plata de ${preferredAmount} RON pentru ${category}?`;
          setBotMessage(msg);
          Speech.speak(msg, { language: "ro-RO", rate: 0.9 });
        } else {
          setBillPaymentStep("amount_input");
          setBackendResponded(true);
          const msg = `Nu aveți facturi la ${category}. Introduceți suma pe care doriți s-o plătiți.`;
          setBotMessage(msg);
          Speech.speak(msg, { language: "ro-RO", rate: 0.9 });
        }
        return true;
      }

      if (categoryBills.length === 1) {
        await prepareBillConfirmation(categoryBills[0], preferredAmount);
        return true;
      }

      setBillMatches(categoryBills);
      setPendingAction({
        actionType: "bill-payment",
        category,
        amount: preferredAmount,
        currency: "RON",
      });
      setBillPaymentStep("bill_selection");
      setBackendResponded(true);
      setRequiresConfirmation(false);

      const msg = `Am găsit mai multe facturi la ${category}. Alegeți factura dorită.`;
      setBotMessage(msg);
      Speech.speak(msg, { language: "ro-RO", rate: 0.9 });
      return true;
    }

    const normalized = normalizeText(transcribedText);
    const providerTokenMatch = normalized.match(/(?:la|catre)\s+([a-z0-9\s\.\-&]+)/);
    const providerQuery = providerTokenMatch?.[1]?.trim() || normalized.replace(/[^a-z0-9\s\.\-&]/g, " ").trim();

    if (!providerQuery) {
      return false;
    }

    let resolvedProvider: ProviderDto | null = null;
    try {
      resolvedProvider = await apiService.findProviderByName(providerQuery);
    } catch {
      setBackendResponded(true);
      setRequiresConfirmation(false);
      const msg = "Furnizor incorect. Verificați numele furnizorului și încercați din nou.";
      setBotMessage(msg);
      Speech.speak(msg, { language: "ro-RO", rate: 0.9 });
      return true;
    }

    await loadBillsForProvider(resolvedProvider, preferredAmount);
    return true;
  };

  const handleBillProviderSelection = async (provider: ProviderDto) => {
    setProviderMatches([]);
    const preferredAmount = Number.isFinite(Number(pendingAction?.amount))
      ? Number(pendingAction.amount)
      : undefined;
    await loadBillsForProvider(provider, preferredAmount);
  };

  const handleBillSelection = async (bill: BillDto) => {
    setBillMatches([]);
    const preferredAmount = Number.isFinite(Number(pendingAction?.amount))
      ? Number(pendingAction.amount)
      : undefined;
    await prepareBillConfirmation(bill, preferredAmount, pendingAction?.targetAccountNumber);
  };

  const handleBillAmountContinue = () => {
    const parsedAmount = Number(manualBillAmount.replace(",", "."));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Sumă invalidă", "Introduceți o sumă validă pentru plată.");
      return;
    }

    setPendingAction((prev: any) => ({
      ...(prev || {}),
      actionType: "bill-payment",
      amount: parsedAmount,
      currency: prev?.currency ?? "RON",
    }));
    setBillPaymentStep("confirmation");
    setRequiresConfirmation(true);
    setBackendResponded(true);

    const recipient = pendingAction?.providerName ?? pendingAction?.category ?? "furnizor";
    const msg = `Confirmați plata de ${parsedAmount} RON la ${recipient}?`;
    setBotMessage(msg);
    Speech.speak(msg, { language: "ro-RO", rate: 0.9 });
  };

  const processVoiceCommand = async (audioBase64: string, transcribedText: string) => {
    try {
      setIsProcessingVoice(true);
      const aiMode = executeMode ? 'AGENT' : 'GUIDE';

      const contacts = aiMode === 'AGENT' ? contactsRef.current : undefined;
      const data = await apiService.processVoiceCommand(user?.id ?? '', audioBase64, aiMode, contacts);

      setLastVoiceResponse(data);
      setPendingCommand("");
      pendingAudioBase64Ref.current = null;
      console.log('[processVoiceCommand] Backend response:', JSON.stringify(data));
      if (aiMode === 'GUIDE') {
        const tts = data.guidanceMessage ?? data.message ?? 'Urmează pașii afișați.';
        setBotMessage(tts);
        Speech.speak(tts, { language: 'ro-RO', rate: 0.9 });

        const rawSteps: any[] = Array.isArray(data.guidanceSteps) ? data.guidanceSteps : [];
        const fallbackTargetId = normalizeGuideTargetId((data as any).highlightButtonId);
        const finalRawSteps =
          rawSteps.length > 0
            ? rawSteps
            : fallbackTargetId
              ? [{
                  stepNumber: 1,
                  instruction: data.guidanceMessage ?? data.message ?? 'Urmează pașii afișați.',
                  elementId: fallbackTargetId,
                  screenName: 'home',
                }]
              : [];
        console.log('[GUIDE] raw guidanceSteps:', JSON.stringify(rawSteps, null, 2));
        const tutorialSteps = finalRawSteps.map((s: any, i: number) => {
          const targetId: string = normalizeGuideTargetId(s.elementId);
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
          setTimeout(() => {
            startTutorial(tutorialSteps);
            const firstStepScreen = finalRawSteps[0]?.screenName;
            const firstStepRoute = resolveGuideRoute(firstStepScreen);
            if (firstStepRoute && String(firstStepScreen).toLowerCase() !== 'home') {
              router.push(firstStepRoute as any);
            }
          }, 400);
        } else {
          const route = resolveGuideRoute(data.navigateToScreen);
          if (route) {
            setTimeout(() => router.push(route as any), 400);
          }
        }
      } else {
        if (shouldPromptManualTransferEntry(data)) {
          const msg = data.message ?? 'Te rog introdu IBAN-ul sau numărul de telefon pentru a continua transferul.';
          setPendingAction(null);
          setPendingOperationId(null);
          setVoiceCandidates([]);
          setShowCandidateList(false);
          resetBillFlowState();
          setRequiresConfirmation(false);
          setBotMessage(msg);
          Speech.speak(msg, { language: 'ro-RO', rate: 0.9 });
          setBackendResponded(true);
          setIsVoiceModalVisible(false);
          setTimeout(() => router.push('/transaction'), IBAN_WARNING_REDIRECT_DELAY_MS);
          return;
        }

        const hasRecoveryPath =
          data.pendingConfirmation ||
          data.status === 'PENDING_CONFIRMATION' ||
          (Array.isArray(data.candidates) && data.candidates.length > 0);

        const backendReportedFailure =
          data.success === false ||
          (data as any).actionPerformed === false ||
          data.status === 'FAILED';

        if (backendReportedFailure && !hasRecoveryPath) {
          const msg = normalizeTransferFallbackMessage(
            data.message ?? 'Contactul nu a fost găsit sau nu are cont Wayfinder.'
          );
          setPendingAction(null);
          setPendingOperationId(null);
          setVoiceCandidates([]);
          setShowCandidateList(false);
          resetBillFlowState();
          setRequiresConfirmation(false);
          setBotMessage(msg);
          Speech.speak(msg, { language: 'ro-RO', rate: 0.9 });
          setBackendResponded(true);
          return;
        }

        if (data.pendingConfirmation || data.status === 'PENDING_CONFIRMATION') {
          const actionData = data.actionData ?? {};
          const backendBills: BillDto[] = Array.isArray(actionData.bills) ? actionData.bills : [];
          const selectedBillFromAction = actionData.selectedBill as BillDto | undefined;
          const matchedBillFromList = selectedBillFromAction?.id
            ? backendBills.find((bill) => bill.id === selectedBillFromAction.id)
            : undefined;
          const selectedBill: BillDto | null = selectedBillFromAction
            ? { ...(matchedBillFromList ?? {}), ...selectedBillFromAction }
            : backendBills[0] ?? null;
          const billsFound = typeof actionData.billsFound === "number" ? actionData.billsFound : backendBills.length;
          const pendingIntent = String((data as any).intent ?? actionData.intent ?? actionData.actionType ?? "").toUpperCase();
          const backendBillFlow =
            !!selectedBill ||
            billsFound > 0 ||
            pendingIntent.includes("PLATA_FACTURI") ||
            pendingIntent.includes("BILL");

          if (backendBillFlow) {
            const billAmountRaw =
              selectedBill?.amount ??
              backendBills[0]?.amount ??
              actionData.amount ??
              actionData.sum ??
              actionData.suma;
            const parsedBillAmount = Number(billAmountRaw);
            const billAmount = Number.isFinite(parsedBillAmount) && parsedBillAmount > 0
              ? parsedBillAmount
              : undefined;
            const billCurrency = selectedBill?.currency ?? actionData.currency ?? "RON";
            const providerName =
              selectedBill?.providerName ??
              backendBills[0]?.providerName ??
              actionData.providerName ??
              "furnizor";
            const billDescription =
              selectedBill?.description ??
              selectedBill?.billName ??
              actionData.description ??
              `Plata Factură ${providerName}`;
            const providerId = selectedBill?.providerId ?? actionData.providerId;
            const targetAccountNumber =
              (selectedBill as any)?.targetAccountNumber ??
              actionData.targetAccountNumber ??
              (await resolveProviderTargetAccount(providerId, providerName));
            const shouldSelectBill = backendBills.length > 1;
            const shouldConfirmDirectly = !shouldSelectBill;

            setPendingOperationId(data.pendingOperationId ?? null);
            setPendingAction({
              actionType: "bill-payment",
              billId: selectedBill?.id ?? actionData.billId,
              providerId,
              providerName,
              targetAccountNumber,
              amount: billAmount,
              currency: billCurrency,
              description: billDescription,
              recipientName: providerName,
            });

            if (shouldSelectBill) {
              setBillMatches(backendBills);
              setBillPaymentStep("bill_selection");
              setRequiresConfirmation(false);
            } else {
              setBillMatches([]);
              setBillPaymentStep("confirmation");
              setRequiresConfirmation(shouldConfirmDirectly);
            }

            const msg = data.message ?? "Confirmați plata facturii selectate?";
            setBotMessage(msg);
            Speech.speak(msg, { language: "ro-RO", rate: 0.9 });
            setBackendResponded(true);
            return;
          }

          const beneficiary = data.matchedBeneficiaries?.[0];
          const amount = data.extractedEntities?.amount ?? data.actionData?.amount;
          const currency = data.extractedEntities?.currency ?? 'RON';
          const recipientName =
            beneficiary?.name ??
            beneficiary?.nickname ??
            beneficiary?.officialName ??
            data.extractedEntities?.recipientName ??
            data.extractedEntities?.beneficiary;
          const description = data.extractedEntities?.description ?? data.actionData?.description;

          setPendingOperationId(data.pendingOperationId ?? null);
          setPendingAction({
            targetAccountNumber: beneficiary?.targetAccountNumber ?? data.actionData?.targetAccountNumber,
            amount,
            currency,
            recipientName,
            description,
          });
          setRequiresConfirmation(true);

          let msg: string;
          if (data.candidates && data.candidates.length > 1) {
            setVoiceCandidates(data.candidates);
            setShowCandidateList(true);
            const summary = data.candidates
              .map((candidate, index) => {
                const candidateDetails = buildCandidateDetails(candidate);
                return candidateDetails
                  ? `${index + 1}. ${candidate.name} (${candidateDetails})`
                  : `${index + 1}. ${candidate.name}`;
              })
              .join("; ");
            msg = `Am găsit mai mulți destinatari. Alege unul din listă: ${summary}`;
          } else {
            const normalizedDescription = description?.trim();
            if (amount != null && recipientName) {
              msg = normalizedDescription
                ? `Am înțeles: transfer ${amount} ${currency} către ${recipientName}, cu descrierea "${normalizedDescription}". Confirmi?`
                : `Am înțeles: transfer ${amount} ${currency} către ${recipientName}. Confirmi?`;
            } else {
              const baseMessage = data.message ?? 'Confirmați operațiunea?';
              msg = normalizedDescription
                ? `${baseMessage} Descriere: "${normalizedDescription}".`
                : baseMessage;
            }
          }
          setBotMessage(msg);
          Speech.speak(msg, { language: 'ro-RO', rate: 0.9 });
        } else {
          setPendingAction(null);
          setRequiresConfirmation(false);
          const msg = data.message ?? 'Comanda a fost procesată.';
          setBotMessage(msg);
          Speech.speak(msg, { language: 'ro-RO', rate: 0.9 });
        }
        setBackendResponded(true); // show OK / Nouă comandă buttons
      }
    } catch (error) {
      console.error('Voice command error:', error);
      const rawBackendMessage =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : 'Momentan serviciul nu este disponibil.';
      const backendMessage = normalizeTransferFallbackMessage(rawBackendMessage);
      const needsIbanEntry =
        isIbanFallbackMessage(rawBackendMessage) ||
        isIbanFallbackMessage(backendMessage);

      if (needsIbanEntry) {
        setIsVoiceModalVisible(false);
        setTimeout(() => router.push('/transaction'), IBAN_WARNING_REDIRECT_DELAY_MS);
      }

      setBotMessage(backendMessage);
      Speech.speak(backendMessage, { language: 'ro-RO', rate: 0.9 });
      setPendingCommand("");
      pendingAudioBase64Ref.current = null;
      setBackendResponded(true);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  processVoiceCmdRef.current = processVoiceCommand;

  const confirmAction = async () => {
    const audio = pendingAudioBase64Ref.current;
    const text = pendingCommand;
    if (!audio || !text) return;
    await processVoiceCommand(audio, text);
    // Do NOT clear pendingAction here — processVoiceCommand sets it when backend requiresConfirmation
  };

  const executeConfirmedAction = async (confirmed: boolean, selectedCandidateId?: string) => {
    if (!confirmed) {
      // User rejected transfer
      if (pendingOperationId) {
        await apiService.cancelVoiceOp(pendingOperationId).catch(() => {});
      }
      const msg = 'Operațiune anulată.';
      setBotMessage(msg);
      Speech.speak(msg, { language: 'ro-RO', rate: 0.9 });
      setPendingAction(null);
      setPendingOperationId(null);
      setVoiceCandidates([]);
      setShowCandidateList(false);
      setRequiresConfirmation(false);
      setIsProcessingVoice(false);
      return;
    }

    setIsProcessingVoice(true);
    try {
      let result: any;
      if (pendingAction?.actionType === "bill-payment") {
        const actionData = lastVoiceResponse?.actionData ?? {};
        const fallbackSelectedBill = actionData.selectedBill as BillDto | undefined;
        const fallbackBills: BillDto[] = Array.isArray(actionData.bills) ? actionData.bills : [];

        let targetAccountNumber = pendingAction?.targetAccountNumber as string | undefined;
        if (!targetAccountNumber) {
          targetAccountNumber =
            (fallbackSelectedBill as any)?.targetAccountNumber ??
            actionData.targetAccountNumber;
        }
        if (!targetAccountNumber) {
          targetAccountNumber = await resolveProviderTargetAccount(
            pendingAction?.providerId,
            pendingAction?.providerName,
          );
        }

        const rawAmount =
          pendingAction?.amount ??
          fallbackSelectedBill?.amount ??
          fallbackBills[0]?.amount ??
          actionData.amount ??
          actionData.sum ??
          actionData.suma;
        const parsedAmount = Number(rawAmount);
        const amount = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : undefined;
        const currency = (pendingAction?.currency as string | undefined) ?? "RON";
        const description =
          (pendingAction?.description as string | undefined) ??
          `Plata Factură ${pendingAction?.providerName ?? fallbackSelectedBill?.providerName ?? "furnizor"}`;

        if (!targetAccountNumber) {
          throw new Error("Nu am găsit contul furnizorului pentru această plată.");
        }

        if (!amount || amount <= 0) {
          throw new Error("Suma de plată este invalidă.");
        }

        console.log('[executeConfirmedAction] Bill payload fields:', JSON.stringify({
          userId: user?.id ?? "",
          confirmed: true,
          targetAccountNumber,
          amount,
          currency,
          description,
        }));

        result = await apiService.confirmPlataFacturi({
          userId: user?.id ?? "",
          confirmed: true,
          targetAccountNumber,
          amount,
          currency,
          description,
        });

        if (pendingAction?.billId) {
          try {
            await apiService.updateBillStatus(pendingAction.billId, "PAID");
          } catch {
            const warn = "Factura a fost plătită, dar nu s-a putut marca drept plătită.";
            setBotMessage(warn);
            Speech.speak(warn, { language: "ro-RO", rate: 0.9 });
          }
        }
      } else if (pendingOperationId) {
        result = await apiService.confirmVoiceOp(pendingOperationId);
      } else {
        const payload = {
          userId: user?.id ?? '',
          confirmed: true,
          targetAccountNumber: pendingAction?.targetAccountNumber as string | undefined,
          amount: pendingAction?.amount as number | undefined,
          currency: (pendingAction?.currency as string | undefined) ?? 'RON',
          description: pendingAction?.description as string | undefined,
        };
        console.log('[executeConfirmedAction] Payload:', JSON.stringify(payload));
        // Voice transactions no longer require PIN confirmation - voice auth is the primary security
        result = await apiService.confirmTransfer(payload);
      }

      console.log('[executeConfirmedAction] Full response:', JSON.stringify(result));
      
      // Extract all response fields
      const msg = result?.actionConfirmation ?? result?.message ?? 'Operațiunea a fost efectuată cu succes.';
      const transactionId = result?.transactionId;
      const actionPerformed = result?.actionPerformed ?? false;
      
      console.log('[executeConfirmedAction] Extracted - message:', msg, 'transactionId:', transactionId, 'actionPerformed:', actionPerformed);
      
      setBotMessage(msg);
      Speech.speak(msg, { language: 'ro-RO', rate: 0.9 });
      await fetchData();
    } catch (error: any) {
      const rawBackendMessage =
        typeof error?.message === 'string' && error.message.trim().length > 0
          ? error.message
          : 'A apărut o eroare la procesarea operațiunii.';
      const backendMessage = normalizeTransferFallbackMessage(rawBackendMessage);
      const needsIbanEntry = isIbanFallbackMessage(rawBackendMessage) || isIbanFallbackMessage(backendMessage);

      if (needsIbanEntry) {
        setIsVoiceModalVisible(false);
        setTimeout(() => router.push('/transaction'), IBAN_WARNING_REDIRECT_DELAY_MS);
      }

      const errorMsg = backendMessage;
      setBotMessage(errorMsg);
      Speech.speak(errorMsg, { language: 'ro-RO', rate: 0.9 });
    } finally {
      setPendingAction(null);
      setPendingOperationId(null);
      setVoiceCandidates([]);
      setShowCandidateList(false);
      resetBillFlowState();
      setRequiresConfirmation(false);
      setIsProcessingVoice(false);
    }
  };

  const cancelAction = () => {
    if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
    if (hasVoiceSTT) Voice.stop().catch(() => {});
    pendingAudioBase64Ref.current = null;
    setPendingCommand("");
    setPendingAction(null);
    setPendingOperationId(null);
    setVoiceCandidates([]);
    setShowCandidateList(false);
    resetBillFlowState();
    setRequiresConfirmation(false);
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
    resetBillFlowState();

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
      if (hasVoiceSTT) {
        try {
          await Voice.start("ro-RO");
        } catch (e) {
          console.warn("Voice STT start error:", e);
        }
      }

      // 3. Auto-stop after 5 seconds
      recordingTimerRef.current = setTimeout(async () => {
        setIsListeningForCommand(false);
        setBotMessage("Se proceseaza comanda...");

        // Stop audio recording first so the ref is set before onSpeechResults fires
        const audioBase64 = await stopRecording();
        if (audioBase64) {
          pendingAudioBase64Ref.current = audioBase64;
        }

        // Stop Voice STT — result arrives via onSpeechResults (ref is now set)
        if (hasVoiceSTT) {
          try { await Voice.stop(); } catch (e) {}
        }

        if (!audioBase64) {
          setBotMessage("Nu am putut capta audio. Încearcă din nou.");
         } 
        else if (!hasVoiceSTT) {
          const cmd = "(comandă vocală)";
          setPendingCommand(cmd);
          setBotMessage("Se procesează comanda...");
          processVoiceCommand(audioBase64, cmd);
        }
      }, 7000);
    }, 3000);
  };

  useEffect(() => {
    if (!hasVoiceSTT) return;
    // Local speech-to-text result handler
    Voice.onSpeechResults = (e: any) => {
      const text = e.value?.[0] ?? "";
      if (text) {
        setUserTranscription(text);
        setPendingCommand(text);
        const audio = pendingAudioBase64Ref.current;
        if (audio) {
          setBotMessage("Se procesează comanda...");
          processVoiceCmdRef.current(audio, text);
        } else {
          setBotMessage(`Ai spus: "${text}", dar nu s-a captat audio. Încearcă din nou.`);
        }
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

  const handleVoiceCommandAction = async () => {
    console.log('[handleVoiceCommandAction] user:', JSON.stringify(user));
    if (!user?.isVoiceAuthEnabled) {
      setShowVoiceAuthPopup(true);
      return;
    }
    // Lazy-load device contacts once per session for voice transfer resolution
    if (contactsRef.current.length === 0) {
      contactsRef.current = await fetchPhonebookContacts();
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
            <View style={styles.modeSegmentedControl}>
              <TouchableOpacity
                style={[
                  styles.modeSegment,
                  !executeMode && styles.modeSegmentActive,
                  styles.modeSegmentLeft,
                ]}
                onPress={() => setExecuteMode(false)}
              >
                <Text style={[styles.modeSegmentText, !executeMode && styles.modeSegmentTextActive]}>
                  Guide
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeSegment,
                  executeMode && styles.modeSegmentActive,
                  styles.modeSegmentRight,
                ]}
                onPress={() => setExecuteMode(true)}
              >
                <Text style={[styles.modeSegmentText, executeMode && styles.modeSegmentTextActive]}>
                  Act
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            style={{ position: "absolute", top: 15, right: 20, padding: spacing.xs }}
          >
            <LogOut size={iconSizes.md} color="#FF3B30" />
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

        <TutorialTarget targetId="nav-bills-button">
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              notifyActionDone("nav-bills-button", "press");
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

      <View style={styles.transactionSection}>
        <Text style={styles.sectionTitle}>Activitate Recentă</Text>
        <View style={styles.listWrapper}>
          <TransactionList transactions={transactions.slice(0, 4)} scrollable={false} />
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

      {/* Voice Auth Popup */}
      <Modal visible={showVoiceAuthPopup} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.errorPopupCard}>
            <Text style={[styles.errorPopupTitle, { color: "#1A1A1A" }]}>🎙 Amprentă Vocală</Text>
            <Text style={styles.errorPopupMessage}>
              Nu ai o amprentă vocală înregistrată. Dorești să o înregistrezi acum?
            </Text>
            <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
              <TouchableOpacity
                style={[styles.confirmBtnStyle, { backgroundColor: "#999", flex: 1 }]}
                onPress={() => setShowVoiceAuthPopup(false)}
              >
                <Text style={styles.confirmBtn}>Nu, renunț</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtnStyle, { backgroundColor: "#FFED00", flex: 1 }]}
                onPress={() => {
                  setShowVoiceAuthPopup(false);
                  router.push("/VoiceRegistration2");
                }}
              >
                <Text style={[styles.confirmBtn, { color: "#1A1A1A" }]}>Înregistrează</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

            {/* Show captured command waiting for confirmation */}
            {/* {pendingCommand && (
              <View style={styles.transcriptionBox}>
                <Text style={styles.transcriptionLabel}>Comanda captată:</Text>
                <Text style={styles.transcriptionText}>{pendingCommand}</Text>
              </View>
            )} */}

            {/* Confirmation buttons - before sending to backend */}
            {/* {pendingCommand && !isProcessingVoice && !backendResponded && (
              <View style={styles.confirmBox}>
                <TouchableOpacity onPress={confirmAction} style={styles.confirmBtnStyle}>
                  <Text style={styles.confirmBtn}>✅ Confirmă</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelAction} style={styles.cancelBtnStyle}>
                  <Text style={styles.cancelBtn}>❌ Anulează</Text>
                </TouchableOpacity>
              </View>
            )} */}

            {/* Multi-match candidate selection */}
            {showCandidateList && voiceCandidates.length > 1 && !isProcessingVoice && (
              <View style={styles.candidateList}>
                <Text style={styles.candidateTitle}>Alege destinatarul:</Text>
                {voiceCandidates.map((c, index) => {
                  const sameNameCount = voiceCandidates.filter((candidate) => candidate.name === c.name).length;
                  const title = sameNameCount > 1 ? `${c.name} (${index + 1})` : c.name;
                  const details = buildCandidateDetails(c);
                  const selectedCandidateId = c.id || c.phone || `${index}`;

                  return (
                    <TouchableOpacity
                      key={`${selectedCandidateId}-${index}`}
                      style={styles.candidateItem}
                      onPress={() => {
                        setShowCandidateList(false);
                        executeConfirmedAction(true, selectedCandidateId);
                      }}
                    >
                      <Text style={styles.candidateItemText}>{title}</Text>
                      {!!details && (
                        <Text style={styles.candidateSubText}>{details}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={[styles.cancelBtnStyle, { marginTop: spacing.md, alignSelf: 'center' }]}
                  onPress={() => executeConfirmedAction(false)}
                >
                  <Text style={styles.cancelBtn}>❌ Anulează</Text>
                </TouchableOpacity>
              </View>
            )}

            {billPaymentStep === "provider_selection" && providerMatches.length > 0 && !isProcessingVoice && (
              <View style={styles.candidateList}>
                <Text style={styles.candidateTitle}>Alege furnizorul:</Text>
                {providerMatches.map((provider) => (
                  <TouchableOpacity
                    key={provider.id}
                    style={styles.candidateItem}
                    onPress={() => handleBillProviderSelection(provider)}
                  >
                    <Text style={styles.candidateItemText}>{provider.name}</Text>
                    {!!provider.category && (
                      <Text style={styles.candidateSubText}>{provider.category}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {billPaymentStep === "bill_selection" && billMatches.length > 0 && !isProcessingVoice && (
              <View style={styles.candidateList}>
                <Text style={styles.candidateTitle}>Alege factura:</Text>
                {billMatches.map((bill, index) => (
                  <TouchableOpacity
                    key={`${bill.id}-${index}`}
                    style={styles.candidateItem}
                    onPress={() => handleBillSelection(bill)}
                  >
                    <Text style={styles.candidateItemText}>
                      {bill.providerName ?? "Furnizor"} - {bill.amount} {bill.currency ?? "RON"}
                    </Text>
                    {!!bill.description && (
                      <Text style={styles.candidateSubText}>{bill.description}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {billPaymentStep === "amount_input" && !isProcessingVoice && (
              <View style={styles.billAmountContainer}>
                <Text style={styles.candidateTitle}>Introduceți suma dorită</Text>
                <TextInput
                  style={styles.billAmountInput}
                  value={manualBillAmount}
                  onChangeText={setManualBillAmount}
                  keyboardType="decimal-pad"
                  placeholder="Ex: 100"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity style={styles.billAmountButton} onPress={handleBillAmountContinue}>
                  <Text style={styles.billAmountButtonText}>Continuă</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Post-backend confirmation - after backend responds with pendingConfirmation */}
            {backendResponded && requiresConfirmation && !isProcessingVoice && !showCandidateList && (
              <View style={styles.confirmBox}>
                <TouchableOpacity onPress={() => executeConfirmedAction(true)} style={styles.confirmBtnStyle}>
                  <Text style={styles.confirmBtn}>✅ Confirmă</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => executeConfirmedAction(false)} style={styles.cancelBtnStyle}>
                  <Text style={styles.cancelBtn}>❌ Anulează</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Close button */}
            <TouchableOpacity
              onPress={() => {
                if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
                if (isRecording) stopRecording();
                if (hasVoiceSTT) Voice.stop().catch(() => {});
                pendingAudioBase64Ref.current = null;
                setIsVoiceModalVisible(false);
                setIsListeningForCommand(false);
                setIsProcessingVoice(false);
                setPendingCommand("");
                setPendingAction(null);
                setPendingOperationId(null);
                setVoiceCandidates([]);
                setShowCandidateList(false);
                resetBillFlowState();
                setRequiresConfirmation(false);
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
  modeSegmentedControl: {
    marginTop: spacing.sm,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 999,
    overflow: "hidden",
    alignSelf: "flex-start",
    backgroundColor: "#F3F4F6",
  },
  modeSegment: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    minWidth: ms(72),
    alignItems: "center",
    justifyContent: "center",
  },
  modeSegmentLeft: {
    borderRightWidth: 1,
    borderRightColor: "#D1D5DB",
  },
  modeSegmentRight: {
    borderLeftWidth: 0,
  },
  modeSegmentActive: {
    backgroundColor: "#FFED00",
  },
  modeSegmentText: {
    color: "#4B5563",
    fontWeight: "600",
    fontSize: fontSizes.base,
  },
  modeSegmentTextActive: {
    color: "#111827",
    fontWeight: "700",
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
  candidateList: {
    width: '100%',
    marginTop: spacing.md,
  },
  candidateTitle: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  candidateItem: {
    backgroundColor: '#F5F5F5',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  candidateItemText: {
    fontWeight: '600',
    fontSize: fontSizes.base,
    color: '#1A1A1A',
  },
  candidateSubText: {
    color: '#666',
    fontSize: fontSizes.sm,
    marginTop: 2,
  },
  billAmountContainer: {
    width: "100%",
    marginTop: spacing.md,
    alignItems: "center",
  },
  billAmountInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.base,
    color: "#1A1A1A",
    backgroundColor: "#fff",
    marginTop: spacing.sm,
  },
  billAmountButton: {
    marginTop: spacing.md,
    backgroundColor: "#FFED00",
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  billAmountButtonText: {
    color: "#1A1A1A",
    fontWeight: "700",
    fontSize: fontSizes.base,
  },
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
  pinModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pinModalContainer: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '90%',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  pinModalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  pinModalSubtitle: {
    fontSize: fontSizes.base,
    color: '#666',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  pinInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.xl,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: spacing.lg,
    width: '100%',
    color: '#1A1A1A',
  },
  pinToggleButton: {
    alignSelf: 'flex-end',
    marginTop: -spacing.md,
    marginBottom: spacing.md,
  },
  pinToggleButtonText: {
    color: '#4b5563',
    fontWeight: '600',
    fontSize: fontSizes.sm,
  },
  pinModalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  pinButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinButtonCancel: {
    backgroundColor: '#F0F0F0',
  },
  pinButtonCancelText: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: fontSizes.base,
  },
  pinButtonConfirm: {
    backgroundColor: '#FFED00',
  },
  pinButtonConfirmText: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: fontSizes.base,
  },
  pinButtonDisabled: {
    opacity: 0.5,
  },
});
