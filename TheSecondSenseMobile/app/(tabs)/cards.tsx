import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, fontSizes, borderRadius, ms, wp } from "@/constants/responsive";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";

interface BankCard {
  id: string;
  type: string;
  last4: string;
  holder: string;
  color: string;
}
const CardsScreen = () => {
  const router = useRouter();
  const data = [
    {
      id: "1",
      type: "Visa",
      last4: "4242",
      holder: "ION POPESCU",
      color: "#1A1A1A",
    },
    {
      id: "2",
      type: "Mastercard",
      last4: "8812",
      holder: "ION POPESCU",
      color: "#F5D908",
    },
  ];

  const renderItem = ({ item }: { item: BankCard }) => {
    // Verificăm dacă fundalul este deschis la culoare (galben)
    const isYellow = item.color === "#FFED00" || item.color === "#F5D908";
    const textColor = isYellow ? "#1A1A1A" : "#FFFFFF";

    return (
      <View style={[styles.card, { backgroundColor: item.color }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardType, { color: textColor }]}>
            {item.type}
          </Text>
        </View>

        <Text style={[styles.cardNumber, { color: textColor }]}>
          **** **** **** {item.last4}
        </Text>

        <View style={styles.cardFooter}>
          <View>
            <Text style={{ color: isYellow ? "#555" : "#CCC", fontSize: fontSizes.xs }}>
              CARD HOLDER
            </Text>
            <Text style={[styles.cardHolder, { color: textColor }]}>
              {item.holder}
            </Text>
          </View>
          {/* Poți adăuga aici o iconiță mică de Chip sau Contactless */}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cardurile mele</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: spacing.sm,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  title: {
    fontSize: fontSizes.xxxl,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSizes.base,
    color: "#666",
    marginBottom: spacing.lg,
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  card: {
    width: "100%",
    height: ms(190),
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    marginBottom: spacing.lg,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  cardType: {
    fontSize: fontSizes.xl,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: 1,
  },
  cardNumber: {
    fontSize: fontSizes.xl,
    fontWeight: "700",
    letterSpacing: 3,
    textAlign: "center",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardHolder: {
    fontSize: fontSizes.base,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});

export default CardsScreen;
