import { ArrowRight, Bell, Search, Users, X, Plus, ArrowLeft } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Alert,
  ActivityIndicator,
  Pressable
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FavoriteAvatar from "../../components/FavoriteAvatar";
import * as Contacts from "expo-contacts";
import { useRouter } from "expo-router";
import { spacing, fontSizes, borderRadius, iconSizes, ms } from "@/constants/responsive";

const COLORS = {
  yellowPrimary: "#FFED00",
  bgLight: "#F8F9FA",
  white: "#FFFFFF",
  textMain: "#1A1A1A",
  textMuted: "#6C757D",
  border: "#E9ECEF",
};

const TransactionScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contacts.Contact | null>(null);

  const favoritesList = [
    { id: "1", name: "Andrei", imageURL: "https://i.pravatar.cc/150?u=a" },
    { id: "2", name: "Maria", imageURL: "https://i.pravatar.cc/150?u=b" },
    { id: "3", name: "Luca", imageURL: "https://i.pravatar.cc/150?u=c" },
    { id: "4", name: "Elena", imageURL: "https://i.pravatar.cc/150?u=d" },
  ];

  const fetchContacts = async () => {
    try {
      setLoadingContacts(true);
      
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
        });

        if (data.length > 0) {
          // Filter contacts that have phone numbers
          const contactsWithPhone = data.filter(
            contact => contact.phoneNumbers && contact.phoneNumbers.length > 0
          );
          setContacts(contactsWithPhone);
        
          setShowContactsModal(true);
        
        } else {
          Alert.alert("Info", "Nu ai contacte salvate în agendă.");
        }
      } else {
        Alert.alert(
          "Permisiune necesară",
          "Te rugăm să acorzi permisiunea pentru a accesa contactele."
        );
      }
    } catch (error) {
      Alert.alert("Eroare", `Nu s-au putut încărca contactele: ${error}`);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleContactSelect = (contact: Contacts.Contact) => {
    setSelectedContact(contact);
    setShowContactsModal(false);
    // You can use the contact's phone number here
    const phoneNumber = contact.phoneNumbers?.[0]?.number || "";
    Alert.alert("Contact selectat", `${contact.name}: ${phoneNumber}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. TOP PROFILE HEADER */}
      <View style={styles.topHeader}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={iconSizes.lg} color={COLORS.textMain} />
        </TouchableOpacity>
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
          <Bell size={iconSizes.lg} color={COLORS.textMain} />
        </TouchableOpacity>
      </View>

      <FlatList
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ paddingBottom: spacing.lg }} pointerEvents="box-none">
            {/* 2. PROFESSIONAL SEARCH BAR */}
            <View style={styles.searchSection}>
              <View style={styles.searchBar}>
                <Search size={iconSizes.md} color={COLORS.textMuted} />
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
              nestedScrollEnabled={true}
            />

            {/* 4. TRANSACTION FORM CARD */}
            <View style={styles.mainCard} pointerEvents="box-none">
              <Text style={styles.cardTitle}>Detalii Transfer Nou</Text>

              <Pressable 
                style={({ pressed }) => [
                  styles.contactPicker,
                  pressed && styles.contactPickerPressed
                ]}
                onPress={fetchContacts}
                disabled={loadingContacts}
              >
                {loadingContacts ? (
                  <ActivityIndicator size="small" color={COLORS.textMain} />
                ) : (
                  <Users size={iconSizes.md} color={COLORS.textMain} />
                )}
                <Text style={styles.contactPickerText}>Alege din agendă</Text>
                <ArrowRight size={iconSizes.sm} color={COLORS.textMuted} />
              </Pressable>

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
                      { flex: 1, fontSize: fontSizes.xxl, fontWeight: "700" },
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

      {/* CONTACTS MODAL */}
      <Modal
        visible={showContactsModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowContactsModal(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Alege Contact ({contacts.length} contacte)
              </Text>
              <TouchableOpacity 
                onPress={() => setShowContactsModal(false)}
                style={styles.closeButton}
              >
                <X size={iconSizes.lg} color={COLORS.textMain} />
              </TouchableOpacity>
            </View>

            {/* Add New Beneficiary Button */}
            <TouchableOpacity 
              style={styles.addBeneficiaryButton}
              onPress={() => {
                setShowContactsModal(false);
                router.push("/(tabs)/addBeneficiary");
              }}
            >
              <Plus size={iconSizes.md} color={COLORS.white} />
              <Text style={styles.addBeneficiaryText}>Adaugă Beneficiar Nou</Text>
            </TouchableOpacity>

            {/* Contacts List */}
            <FlatList
              data={contacts}
              keyExtractor={(item, index) => `contact-${index}`}
              showsVerticalScrollIndicator={true}
              style={styles.contactsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={() => handleContactSelect(item)}
                >
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactInitial}>
                      {item.name?.charAt(0).toUpperCase() || "?"}
                    </Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{item.name || "Nume necunoscut"}</Text>
                    <Text style={styles.contactPhone}>
                      {item.phoneNumbers?.[0]?.number || "Fără număr"}
                    </Text>
                  </View>
                  <ArrowRight size={iconSizes.sm} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Nu s-au găsit contacte</Text>
                </View>
              }
            />
          </View>
        </SafeAreaView>
      </Modal>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: COLORS.white,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  profilePic: {
    width: ms(45),
    height: ms(45),
    borderRadius: ms(22.5),
    borderWidth: 2,
    borderColor: COLORS.yellowPrimary,
  },
  welcomeText: {
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: COLORS.textMain,
  },
  subWelcome: {
    fontSize: fontSizes.sm,
    color: COLORS.textMuted,
  },
  backButton: {
    padding: spacing.sm,
    backgroundColor: COLORS.bgLight,
    borderRadius: borderRadius.lg,
  },
  notifButton: {
    padding: spacing.sm,
    backgroundColor: COLORS.bgLight,
    borderRadius: borderRadius.lg,
  },
  searchSection: {
    padding: spacing.lg,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: spacing.md,
    height: ms(50),
    borderRadius: borderRadius.xl,
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
    marginLeft: spacing.sm,
    fontSize: fontSizes.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: COLORS.textMain,
  },
  seeAll: {
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  favoritesScroll: {
    paddingLeft: spacing.lg,
    paddingBottom: spacing.xs,
  },
  mainCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: fontSizes.base,
    fontWeight: "700",
    marginBottom: spacing.lg,
    color: COLORS.textMain,
  },
  contactPicker: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: COLORS.bgLight,
    borderRadius: borderRadius.xl,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  contactPickerPressed: {
    backgroundColor: COLORS.yellowPrimary,
    opacity: 0.8,
  },
  contactPickerText: {
    flex: 1,
    fontWeight: "600",
    color: COLORS.textMain,
  },
  inputWrapper: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  modernInput: {
    backgroundColor: COLORS.bgLight,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    fontSize: fontSizes.base,
    color: COLORS.textMain,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgLight,
    borderRadius: borderRadius.lg,
    paddingRight: spacing.md,
  },
  currency: {
    fontWeight: "800",
    color: COLORS.textMain,
  },
  mainActionBtn: {
    backgroundColor: COLORS.yellowPrimary,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  mainActionText: {
    fontWeight: "800",
    fontSize: fontSizes.base,
    color: COLORS.textMain,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalContent: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: COLORS.textMain,
  },
  closeButton: {
    padding: spacing.sm,
    backgroundColor: COLORS.bgLight,
    borderRadius: borderRadius.lg,
  },
  addBeneficiaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.yellowPrimary,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  addBeneficiaryText: {
    fontWeight: "700",
    fontSize: fontSizes.base,
    color: COLORS.textMain,
  },
  contactsList: {
    flex: 1,
    flexGrow: 1,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: COLORS.bgLight,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  contactAvatar: {
    width: ms(50),
    height: ms(50),
    borderRadius: ms(25),
    backgroundColor: COLORS.yellowPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  contactInitial: {
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: COLORS.textMain,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: fontSizes.base,
    fontWeight: "600",
    color: COLORS.textMain,
    marginBottom: spacing.xs,
  },
  contactPhone: {
    fontSize: fontSizes.md,
    color: COLORS.textMuted,
  },
  emptyState: {
    padding: spacing.xxxl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: fontSizes.base,
    color: COLORS.textMuted,
  },
});

export default TransactionScreen;
