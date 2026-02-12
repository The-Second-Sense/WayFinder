import {
  ArrowDownLeft,
  ArrowUpRight,
  Home,
  ShoppingBag,
  Utensils,
  Zap,
} from "lucide-react-native";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

export interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  category: string;
  date: string;
  time: string;
}

// 1. Am adăugat ListHeaderComponent în interfață pentru a scăpa de eroarea TS
interface TransactionListProps {
  transactions: Transaction[];
  ListHeaderComponent?: React.ReactElement;
}

const categoryIcons: Record<string, any> = {
  shopping: ShoppingBag,
  food: Utensils,
  utilities: Zap,
  housing: Home,
  transfer: ArrowUpRight,
  default: ArrowDownLeft,
};

// 2. Extragem ListHeaderComponent aici
export function TransactionList({
  transactions,
  ListHeaderComponent,
}: TransactionListProps) {
  const renderItem = ({ item: transaction }: { item: Transaction }) => {
    const IconComponent =
      categoryIcons[transaction.category] || categoryIcons.default;
    const isCredit = transaction.type === "credit";

    return (
      <View style={styles.transactionItem}>
        <View style={styles.leftSection}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor:
                  transaction.category === "shopping" ||
                  transaction.category === "utilities"
                    ? "#F5D908"
                    : "#FFED00",
              },
            ]}
          >
            {isCredit ? (
              <ArrowDownLeft size={20} color="#1A1A1A" />
            ) : (
              <IconComponent size={20} color="#1A1A1A" />
            )}
          </View>

          <View>
            <Text style={styles.description}>{transaction.description}</Text>
            <Text style={styles.dateTime}>
              {transaction.date} • {transaction.time}
            </Text>
          </View>
        </View>

        <Text
          style={[styles.amount, { color: isCredit ? "#EAB308" : "#1A1A1A" }]}
        >
          {isCredit ? "+" : "-"}
          {transaction.amount.toFixed(2)} RON
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      {/* IMPORTANT: FlatList-ul devine acum scroll-ul principal.
          Am scos style={{ height: 400 }} pentru ca lista să se poată extinde.
      */}
      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            {/* Aici injectăm restul componentelor (Overview, Actions, Form) */}
            {ListHeaderComponent}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Tranzacții Recente</Text>
            </View>
          </>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, // Permite listei să ocupe tot ecranul
    backgroundColor: "white",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "white",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  listContent: {
    paddingBottom: 32, // Spațiu la finalul listei
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f9f9f9",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  description: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  dateTime: {
    fontSize: 12,
    color: "rgba(26, 26, 26, 0.6)",
  },
  amount: {
    fontSize: 15,
    fontWeight: "bold",
  },
});
