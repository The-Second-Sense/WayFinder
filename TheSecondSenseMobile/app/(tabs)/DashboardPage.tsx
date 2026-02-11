import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

// Importurile componentelor tale native
import { AccountOverview } from "@/components/AccountOverview";
import { QuickActions } from "@/components/QuickActions";
import { Transaction, TransactionList } from "@/components/TransactionList";
import { TransferForm } from "@/components/TransferForm";
import { VoiceControl } from "@/components/VoiceControl";

// Importăm iconițele necesare pentru array-ul de acțiuni
import { CreditCard, Receipt, Send, TrendingUp } from "lucide-react-native";

// 1. Definim datele de test (Mock Data)
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    type: "debit",
    amount: 45.5,
    description: "Starbucks",
    category: "food",
    date: "04 Feb",
    time: "09:15",
  },
  {
    id: "2",
    type: "credit",
    amount: 2500.0,
    description: "Salariu",
    category: "transfer",
    date: "01 Feb",
    time: "10:00",
  },
  {
    id: "3",
    type: "debit",
    amount: 120.0,
    description: "ZARA",
    category: "shopping",
    date: "30 Ian",
    time: "18:30",
  },
  {
    id: "4",
    type: "debit",
    amount: 350.0,
    description: "Factură Enel",
    category: "utilities",
    date: "28 Ian",
    time: "12:00",
  },
];

export default function HomeScreen() {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

  // 2. Definim funcțiile de interacțiune
  const handleTransfer = (recipient: string, amount: number, type: string) => {
    Alert.alert(
      "Confirmare Transfer",
      `Vrei să trimiți ${amount} RON către ${recipient} (${type})?`,
      [
        { text: "Anulează", style: "cancel" },
        { text: "Confirmă", onPress: () => console.log("Transfer realizat!") },
      ],
    );
  };

  const handleVoiceCommand = (command: string) => {
    if (!command) {
      Alert.alert(
        "Control Vocal",
        "Te ascult! Spune de exemplu: 'Vreau să trimit bani'",
      );
      return;
    }
    // Aici vei procesa textul primit de la componenta VoiceControl
    console.log("Comanda primită din componentă:", command);
  };

  // 3. Array-ul pentru QuickActions
  const actions = [
    {
      icon: Send,
      label: "Trimite",
      onClick: () => Alert.alert("Acțiune", "Ecran Transfer deschis"),
    },
    {
      icon: Receipt,
      label: "Facturi",
      onClick: () => Alert.alert("Acțiune", "Ecran Facturi deschis"),
    },
    {
      icon: CreditCard,
      label: "Carduri",
      onClick: () => Alert.alert("Acțiune", "Management Carduri"),
    },
    {
      icon: TrendingUp,
      label: "Investiții",
      onClick: () => Alert.alert("Acțiune", "Bursa și Crypto"),
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Sumar Cont */}
        <AccountOverview
          balance={4520.85}
          accountName="Cont Curent"
          accountNumber="RO64BTRL..."
          monthlyChange={320.5}
        />

        {/* Butoane Acțiuni Rapide */}
        <QuickActions actions={actions} />

        {/* Formular de Transfer */}
        <TransferForm onTransfer={handleTransfer} />

        {/* Lista de Tranzacții */}
        <TransactionList transactions={MOCK_TRANSACTIONS} />

        {/* Componenta de Control Vocal (pusă la finalul listei) */}
        <View style={styles.voiceWrapper}>
          <VoiceControl
            isEnabled={isVoiceEnabled}
            onCommand={handleVoiceCommand}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA", // Un fundal curat, tipic aplicațiilor bancare
  },
  content: {
    padding: 16,
    paddingBottom: 40, // Spațiu pentru a putea face scroll sub ultimul element
  },
  voiceWrapper: {
    marginTop: 20,
    marginBottom: 20,
  },
});
