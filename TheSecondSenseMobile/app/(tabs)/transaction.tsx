import * as Contacts from "expo-contacts";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FavoriteAvatar from "../../components/FavoriteAvatar";

// Definim paleta de culori conform imaginii tale
const COLORS = {
  yellowPrimary: "#FFED00", // Rămâne pentru butonul principal
  yellowDark: "#F5D908", // Pentru accente
  bgWhite: "#FFFFFF", // Fundalul paginii
  textMain: "#1A1A1A", // Text negru intens
  grayBorder: "#D1D1D1", // Bordură pentru input-uri
  grayLight: "#F5F5F5", // Fundal ușor pentru secțiuni
};

const TranzasctionScreen = () => {
  const favoritesList = [
    { id: "1", name: "Andrei", imageURL: "https://i.pravatar.cc/150?u=1" },
    { id: "2", name: "Maria", imageURL: "https://i.pravatar.cc/150?u=2" },
    { id: "3", name: "Luca", imageURL: "https://i.pravatar.cc/150?u=3" },
  ];

  async function handleContacts() {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === "granted") {
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Image,
        ],
      });
      if (data.length > 0) {
        Alert.alert("Succes", `Ai ${data.length} contacte în agendă.`);
      }
    } else {
      Alert.alert("Permisiune refuzată", "Avem nevoie de acces la contacte.");
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trimite bani</Text>
      </View>

      {/* SECȚIUNE FAVORITE */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionLabel}>Favorite</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={favoritesList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingLeft: 20 }}
          renderItem={({ item }) => (
            <FavoriteAvatar name={item.name} imageURL={item.imageURL} />
          )}
        />
      </View>

      {/* SECȚIUNE FORMULAR */}
      <View style={styles.formContainer}>
        <TouchableOpacity style={styles.contactButton} onPress={handleContacts}>
          <Text style={styles.contactButtonText}>+ Alege din contacte</Text>
        </TouchableOpacity>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Detalii Destinatar</Text>
          <TextInput
            placeholder="Nume destinatar"
            placeholderTextColor="#888"
            style={styles.input}
          />
          <TextInput
            placeholder="IBAN"
            placeholderTextColor="#888"
            style={styles.input}
          />
          <TextInput
            placeholder="Suma (RON)"
            placeholderTextColor="#888"
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

        {/* BUTONUL PRINCIPAL (Yellow Primary) */}
        <TouchableOpacity style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Trimite acum</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgWhite, // Fundal Alb
  },
  header: {
    padding: 20,
    alignItems: "center",
    backgroundColor: COLORS.yellowPrimary, // Un header galben e foarte vizibil
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800", // Mai gros pentru lizibilitate
    color: COLORS.textMain,
  },
  sectionContainer: {
    marginTop: 25,
  },
  sectionLabel: {
    color: "#555", // Un gri mai închis pentru contrast
    marginLeft: 20,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "bold",
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  contactButton: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: COLORS.grayLight, // Fundal gri deschis, mai puțin "agresiv"
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    alignItems: "center",
  },
  contactButtonText: {
    color: COLORS.textMain,
    fontWeight: "bold",
    fontSize: 16,
  },
  inputGroup: {
    gap: 15,
  },
  inputLabel: {
    color: COLORS.bgWhite,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  input: {
    backgroundColor: COLORS.bgWhite,
    color: COLORS.textMain,
    padding: 18, // Padding mai mare pentru a fi ușor de atins (touch target)
    borderRadius: 12,
    fontSize: 18, // Font mai mare pentru seniori
    borderWidth: 2, // Bordură mai groasă
    borderColor: COLORS.grayBorder,
  },
  sendButton: {
    backgroundColor: COLORS.yellowPrimary,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 30,
    // Umbră mai pronunțată pentru a părea "apăsabil"
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  sendButtonText: {
    color: COLORS.textMain,
    fontSize: 20,
    fontWeight: "900",
  },
});

export default TranzasctionScreen;
