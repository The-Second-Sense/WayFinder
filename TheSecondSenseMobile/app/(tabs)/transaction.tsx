import { ArrowRight, Bell, Search, Users, X, Plus, ArrowLeft, UserCircle } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import {
  FlatList,
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
import * as Contacts from "expo-contacts";
import { useRouter } from "expo-router";
import { spacing, fontSizes, borderRadius, iconSizes, ms } from "@/constants/responsive";
import { apiService } from "./apiService";
import { useAuth } from "../contexts/AuthContext";

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
  const { user } = useAuth();
  const [recipientType, setRecipientType] = useState<'iban' | 'phone'>('iban');
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contacts.Contact | null>(null);
  const [iban, setIban] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [sourceAccountId, setSourceAccountId] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    apiService.getAccountsByUserId(user.id)
      .then((accounts) => {
        if (accounts.length > 0) setSourceAccountId(accounts[0].accountId);
      })
      .catch((e) => console.error('[TransactionScreen] Failed to load account:', e));
  }, [user?.id]);

  const filteredContacts = contacts.filter((contact) => {
    if (!contactSearch.trim()) return true;
    const query = contactSearch.toLowerCase().trim();
    const nameMatch = contact.name?.toLowerCase().includes(query);
    const phoneMatch = contact.phoneNumbers?.some((p) =>
      p.number?.replace(/\s/g, "").includes(query.replace(/\s/g, ""))
    );
    return nameMatch || phoneMatch;
  });

  const fetchContacts = async () => {
    try {
      setLoadingContacts(true);
      setContactSearch("");
      
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
    const phoneNumber = contact.phoneNumbers?.[0]?.number?.replace(/\s/g, '') || '';
    if (phoneNumber) {
      setRecipientType('phone');
      // Ensure international format with +
      const normalized = phoneNumber.startsWith('+') ? phoneNumber : '+' + phoneNumber.replace(/[^0-9]/g, '');
      setIban(normalized);
    }
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
          <View style={styles.profileIcon}>
            <UserCircle size={ms(45)} color={COLORS.textMain} />
          </View>
          <View>
            <Text style={styles.welcomeText}>Bună, {user?.name ?? 'utilizator'}</Text>
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
                <Text style={styles.label}>Destinatar</Text>
                <View style={styles.recipientToggle}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, recipientType === 'iban' && styles.toggleBtnActive]}
                    onPress={() => { setRecipientType('iban'); setIban(''); }}
                  >
                    <Text style={[styles.toggleBtnText, recipientType === 'iban' && styles.toggleBtnTextActive]}>IBAN</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleBtn, recipientType === 'phone' && styles.toggleBtnActive]}
                    onPress={() => { setRecipientType('phone'); setIban('+'); }}
                  >
                    <Text style={[styles.toggleBtnText, recipientType === 'phone' && styles.toggleBtnTextActive]}>Telefon</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  placeholder={recipientType === 'iban' ? "RO00 BTRL 0000..." : "+40XXXXXXXXX"}
                  value={iban}
                  onChangeText={(text) => {
                    if (recipientType === 'phone') {
                      // Always keep the leading +
                      if (!text.startsWith('+')) {
                        setIban('+' + text.replace(/[^0-9]/g, ''));
                      } else {
                        setIban('+' + text.slice(1).replace(/[^0-9]/g, ''));
                      }
                    } else {
                      setIban(text);
                    }
                  }}
                  style={styles.modernInput}
                  keyboardType={recipientType === 'phone' ? 'phone-pad' : 'default'}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Suma</Text>
                <View style={styles.amountInputContainer}>
                  <TextInput
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                    style={[
                      styles.modernInput,
                      { flex: 1, fontSize: fontSizes.xxl, fontWeight: "700" },
                    ]}
                  />
                  <Text style={styles.currency}>RON</Text>
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Descriere (Opțional)</Text>
                <TextInput
                  placeholder="Ex: Plată chirie, Cina..."
                  value={description}
                  onChangeText={setDescription}
                  style={styles.modernInput}
                  multiline={true}
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity 
                style={[styles.mainActionBtn, isSubmitting && { opacity: 0.6 }]}
                onPress={async () => {
                  if (!iban || !amount) {
                    Alert.alert('Eroare', `Te rugăm să completezi ${recipientType === 'iban' ? 'IBAN-ul' : 'numărul de telefon'} și suma`);
                    return;
                  }
                  if (!sourceAccountId) {
                    Alert.alert('Eroare', 'Contul sursă nu a putut fi identificat. Încearcă din nou.');
                    return;
                  }
                  const parsedAmount = parseFloat(amount);
                  if (isNaN(parsedAmount) || parsedAmount < 0) {
                    Alert.alert('Eroare', 'Suma introdusă nu este validă.');
                    return;
                  }
                  setIsSubmitting(true);
                  try {
                    await apiService.sendMoney({
                      sourceAccountId,
                      recipientAccountNumber: iban,
                      amount: parsedAmount,
                      currency: 'RON',
                      description: description || undefined,
                    });
                    Alert.alert('Succes', 'Transfer realizat cu succes!');
                    setIban('');
                    setAmount('');
                    setDescription('');
                  } catch (error) {
                    Alert.alert('Eroare', error instanceof Error ? error.message : 'Transfer-ul a eșuat');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting}
              >
                <Text style={styles.mainActionText}>
                  {isSubmitting ? "Se procesează..." : "Confirmă Transferul"}
                </Text>
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
                Alege Contact ({filteredContacts.length}/{contacts.length})
              </Text>
              <TouchableOpacity 
                onPress={() => setShowContactsModal(false)}
                style={styles.closeButton}
              >
                <X size={iconSizes.lg} color={COLORS.textMain} />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.contactSearchBar}>
              <Search size={iconSizes.md} color={COLORS.textMuted} />
              <TextInput
                placeholder="Caută după nume sau număr..."
                placeholderTextColor={COLORS.textMuted}
                style={styles.contactSearchInput}
                value={contactSearch}
                onChangeText={setContactSearch}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
              {contactSearch.length > 0 && (
                <TouchableOpacity onPress={() => setContactSearch("")}>
                  <X size={iconSizes.sm} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
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
              data={filteredContacts}
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
                  <Text style={styles.emptyText}>
                    {contactSearch.trim()
                      ? `Niciun contact găsit pentru "${contactSearch}"`
                      : "Nu s-au găsit contacte"}
                  </Text>
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
  profileIcon: {
    width: ms(45),
    height: ms(45),
    borderRadius: ms(22.5),
    borderWidth: 2,
    borderColor: COLORS.yellowPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgLight,
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
  recipientToggle: {
    flexDirection: 'row' as const,
    backgroundColor: COLORS.bgLight,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center' as const,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.yellowPrimary,
  },
  toggleBtnText: {
    fontWeight: '600' as const,
    color: COLORS.textMuted,
    fontSize: fontSizes.sm,
  },
  toggleBtnTextActive: {
    color: COLORS.textMain,
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
  contactSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgLight,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactSearchInput: {
    flex: 1,
    fontSize: fontSizes.base,
    color: COLORS.textMain,
    paddingVertical: spacing.xs,
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
