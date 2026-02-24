import {
  ArrowDownLeft,
  ArrowUpRight,
  Home,
  ShoppingBag,
  Utensils,
  Zap,
} from "lucide-react-native";
import React from "react";
// 1. ADAUGĂ RefreshControl AICI
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";

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
  ListHeaderComponent?: React.ReactElement;
  onRefresh?: () => void;
  refreshing?: boolean;
  scrollable?: boolean; // false when nested in a ScrollView
}

const categoryIcons: Record<string, any> = {
  shopping: ShoppingBag,
  food: Utensils,
  utilities: Zap,
  housing: Home,
  transfer: ArrowUpRight,
  default: ArrowDownLeft,
};

export function TransactionList({
  transactions,
  ListHeaderComponent,
  onRefresh, // 2. EXTRAGE-LE AICI
  refreshing, // 2. EXTRAGE-LE AICI
  scrollable = true, // Default to scrollable for backward compatibility
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

  // When not scrollable (nested in ScrollView), render as simple View
  if (!scrollable) {
    return (
      <View style={styles.card}>
        {ListHeaderComponent && (
          <>
            {ListHeaderComponent}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Tranzacții Recente</Text>
            </View>
          </>
        )}
        {transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nu există tranzacții recente.</Text>
          </View>
        ) : (
          transactions.map((transaction) =>
            renderItem({ item: transaction })
          )
        )}
      </View>
    );
  }

  // When scrollable, use FlatList
  return (
    <View style={styles.card}>
      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing || false}
              onRefresh={onRefresh}
              tintColor="#FFED00" // Opțional: culoarea spinner-ului pe iOS
            />
          ) : undefined
        }
        ListHeaderComponent={
          <>
            {ListHeaderComponent}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Tranzacții Recente</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nu există tranzacții recente.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#999",
    fontSize: 14,
  },
});
