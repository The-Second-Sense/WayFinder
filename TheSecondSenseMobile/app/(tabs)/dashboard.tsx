import { CreditCard, Receipt, Send, TrendingUp } from "lucide-react-native";
import React from "react";
import { Alert, SafeAreaView, StatusBar, StyleSheet, View } from "react-native";

// Importuri Componente
import { AccountOverview } from "@/components/AccountOverview";
import { QuickActions } from "@/components/QuickActions";
import { Transaction, TransactionList } from "@/components/TransactionList";
import { TransferForm } from "@/components/TransferForm";

// Date de test (Mock Data) pentru a vedea lista populată
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

export default function DashboardScreen() {
  // Array-ul pentru QuickActions cu funcții reale de Alert
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
    <SafeAreaView style={styles.container}>
      {/* Controlăm bara de stare a telefonului */}
      <StatusBar barStyle="dark-content" />

      {/* IMPORTANT: TransactionList conține FlatList-ul principal.
          Folosim ListHeaderComponent pentru a randa restul elementelor (Overview, Actions, Form).
          ASTA elimină eroarea de VirtualizedList nested inside ScrollView.
      */}
      <TransactionList
        transactions={MOCK_TRANSACTIONS}
        ListHeaderComponent={
          <View style={styles.headerPadding}>
            <AccountOverview
              balance={4520.85}
              accountName="Cont Principal"
              accountNumber="RO12BTRL..."
              monthlyChange={150.2}
            />

            <QuickActions actions={actions} />

            <TransferForm
              onTransfer={(recipient, amount, type) =>
                Alert.alert(
                  "Transfer Nou",
                  `Vrei să trimiți ${amount} RON către ${recipient}?`,
                )
              }
            />

            {/* Titlul listei de tranzacții */}
            <View style={styles.listTitleContainer}>
              {/* Acesta va apărea chiar deasupra primului item din listă */}
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerPadding: {
    padding: 16,
  },
  listTitleContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
});
