import React from "react";
import { SafeAreaView, ScrollView, StatusBar, StyleSheet } from "react-native";
// Importă toate componentele pe care le-am convertit:
import { AccountOverview } from "@/components/AccountOverview";
import { QuickActions } from "@/components/QuickActions";
import { TransactionList } from "@/components/TransactionList";
import { TransferForm } from "@/components/TransferForm";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      {/* StatusBar controlează culoarea ceasului/bateriei de sus */}
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AccountOverview
          balance={4520.85}
          accountName="Cont Principal"
          accountNumber="RO12BTRL..."
          monthlyChange={150.2}
        />

        <QuickActions actions={[]} /* adaugă array-ul de acțiuni aici */ />

        <TransferForm onTransfer={(r, a, t) => console.log(r, a, t)} />

        <TransactionList transactions={[]} /* adaugă datele aici */ />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    padding: 16,
  },
});
