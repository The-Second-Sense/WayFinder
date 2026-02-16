import { ArrowRight, Bell, Search, Users } from "lucide-react-native";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FavoriteAvatar from "../../components/FavoriteAvatar";

const COLORS = {
  yellowPrimary: "#FFED00",
  bgLight: "#F8F9FA",
  white: "#FFFFFF",
  textMain: "#1A1A1A",
  textMuted: "#6C757D",
  border: "#E9ECEF",
};

const TransactionScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const favoritesList = [
    { id: "1", name: "Andrei", imageURL: "https://i.pravatar.cc/150?u=a" },
    { id: "2", name: "Maria", imageURL: "https://i.pravatar.cc/150?u=b" },
    { id: "3", name: "Luca", imageURL: "https://i.pravatar.cc/150?u=c" },
    { id: "4", name: "Elena", imageURL: "https://i.pravatar.cc/150?u=d" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. TOP PROFILE HEADER */}
      <View style={styles.topHeader}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: "https://i.pravatar.cc/150?u=me" }}
            style={styles.profilePic}
          />
          <View>
            <Text style={styles.welcomeText}>Bună, Alexandru</Text>
            <Text style={styles.subWelcome}>Cui trimiți bani azi?</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notifButton}>
          <Bell size={24} color={COLORS.textMain} />
        </TouchableOpacity>
      </View>

      <FlatList
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ paddingBottom: 20 }}>
            {/* 2. PROFESSIONAL SEARCH BAR */}
            <View style={styles.searchSection}>
              <View style={styles.searchBar}>
                <Search size={20} color={COLORS.textMuted} />
                <TextInput
                  placeholder="Caută destinatar sau tranzacție..."
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            {/* 3. FAVORITES SECTION */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Favorite recente</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>Vezi tot</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={favoritesList}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.favoritesScroll}
              renderItem={({ item }) => (
                <FavoriteAvatar name={item.name} imageURL={item.imageURL} />
              )}
            />

            {/* 4. TRANSACTION FORM CARD */}
            <View style={styles.mainCard}>
              <Text style={styles.cardTitle}>Detalii Transfer Nou</Text>

              <TouchableOpacity style={styles.contactPicker} onPress={() => {}}>
                <Users size={20} color={COLORS.textMain} />
                <Text style={styles.contactPickerText}>Alege din agendă</Text>
                <ArrowRight size={18} color={COLORS.textMuted} />
              </TouchableOpacity>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>IBAN Destinatar</Text>
                <TextInput
                  placeholder="RO00 BTRL 0000..."
                  style={styles.modernInput}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Suma</Text>
                <View style={styles.amountInputContainer}>
                  <TextInput
                    placeholder="0.00"
                    keyboardType="numeric"
                    style={[
                      styles.modernInput,
                      { flex: 1, fontSize: 24, fontWeight: "700" },
                    ]}
                  />
                  <Text style={styles.currency}>RON</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.mainActionBtn}>
                <Text style={styles.mainActionText}>Confirmă Transferul</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        data={[]}
        renderItem={null}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profilePic: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    borderColor: COLORS.yellowPrimary,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textMain,
  },
  subWelcome: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  notifButton: {
    padding: 8,
    backgroundColor: COLORS.bgLight,
    borderRadius: 12,
  },
  searchSection: {
    padding: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    // Soft Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textMain,
  },
  seeAll: {
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  favoritesScroll: {
    paddingLeft: 20,
    paddingBottom: 5,
  },
  mainCard: {
    margin: 20,
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 20,
    color: COLORS.textMain,
  },
  contactPicker: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: COLORS.bgLight,
    borderRadius: 16,
    gap: 12,
    marginBottom: 20,
  },
  contactPickerText: {
    flex: 1,
    fontWeight: "600",
    color: COLORS.textMain,
  },
  inputWrapper: {
    marginBottom: 15,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginBottom: 8,
    marginLeft: 4,
  },
  modernInput: {
    backgroundColor: COLORS.bgLight,
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    color: COLORS.textMain,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgLight,
    borderRadius: 12,
    paddingRight: 15,
  },
  currency: {
    fontWeight: "800",
    color: COLORS.textMain,
  },
  mainActionBtn: {
    backgroundColor: COLORS.yellowPrimary,
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
  },
  mainActionText: {
    fontWeight: "800",
    fontSize: 16,
    color: COLORS.textMain,
  },
});

export default TransactionScreen;
