import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface BankCard {
  id: string;
  type: string;
  last4: string;
  holder: string;
  color: string;
}
const CardsScreen = () => {
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
            <Text style={{ color: isYellow ? "#555" : "#CCC", fontSize: 10 }}>
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
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1A1A1A" }}>
          Cardurile mele
        </Text>
      </View>

      <View style={{ height: 250 }}>
        {" "}
        {/* Container fix pentru listă */}
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          snapToAlignment="start"
          decelerationRate="fast"
          snapToInterval={320} // Lățimea cardului + margin
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", // Fundal alb conform cerinței pentru seniori
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A1A", // Negru intens pentru contrast
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  listContainer: {
    paddingVertical: 10,
    paddingLeft: 20,
    paddingRight: 20, // Spațiu la finalul listei
  },
  card: {
    width: 300,
    height: 190,
    borderRadius: 20, // Colțuri mai rotunjite, mai moderne
    padding: 24,
    marginRight: 20,
    justifyContent: "space-between",
    // Umbră mai vizibilă pe alb
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
    fontSize: 20,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: 1,
  },
  cardNumber: {
    fontSize: 22,
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
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});

export default CardsScreen;
