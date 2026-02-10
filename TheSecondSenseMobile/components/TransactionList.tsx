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

interface TransactionListProps {
  transactions: Transaction[];
}

const categoryIcons: Record<string, any> = {
  shopping: ShoppingBag,
  food: Utensils,
  utilities: Zap,
  housing: Home,
  transfer: ArrowUpRight,
  default: ArrowDownLeft,
};

export function TransactionList({ transactions }: TransactionListProps) {
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
          style={[
            styles.amount,
            { color: isCredit ? "#EAB308" : "#1A1A1A" }, // Am ajustat galbenul pentru lizibilitate pe alb
          ]}
        >
          {isCredit ? "+" : "-"}
          {transaction.amount.toFixed(2)} RON
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tranzacții Recente</Text>
      </View>

      {/* În loc de ScrollArea, folosim FlatList pentru performanță */}
      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        style={{ height: 400 }} // Limităm înălțimea ca în original
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#1A1A1A",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  listContent: {
    padding: 16,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f9f9f9",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    padding: 10,
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
