import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { spacing, fontSizes, borderRadius, ms } from "@/constants/responsive";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "./apiService";

interface AccountDetailsScreenProps {
  route: any;
  navigation: any;
}

export default function AccountDetailsScreen({
  route,
  navigation,
}: AccountDetailsScreenProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [showFullIBAN, setShowFullIBAN] = useState(false);
  const [isCardLocked, setIsCardLocked] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [onlineBankingEnabled, setOnlineBankingEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [accountInfo, setAccountInfo] = useState({
    iban: "",
    swift: "",
    accountNumber: "",
    accountType: "",
    currency: "RON",
    balance: 0,
    status: "Activ",
    openDate: "",
    branch: "",
    accountManager: "",
    managerPhone: "",
    holderName: "",
    holderCNP: "",
    address: "",
  });

  useEffect(() => {
    const fetchAccount = async () => {
      if (!user?.id) return;
      try {
        const accounts = await apiService.getAccountsByUserId(user.id);
        if (accounts.length > 0) {
          const acc = accounts[0];
          setAccountInfo({
            iban: acc.iban ?? acc.accountNumber ?? "",
            swift: acc.swift ?? acc.bic ?? "",
            accountNumber: acc.accountNumber ?? "",
            accountType: acc.accountType ?? "",
            currency: acc.currency ?? "RON",
            balance: acc.balance ?? 0,
            status: acc.status ?? "Activ",
            openDate: acc.openDate ?? acc.createdAt ?? "",
            branch: acc.branch ?? "",
            accountManager: acc.accountManager ?? "",
            managerPhone: acc.managerPhone ?? "",
            holderName: user.name ?? "",
            holderCNP: acc.holderCNP ?? "",
            address: acc.address ?? "",
          });
        }
      } catch (e) {
        console.error('[detalii] fetchAccount error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAccount();
  }, [user?.id]);

  const cards = [
    {
      id: "1",
      type: "Debit",
      network: "Mastercard",
      last4: "4829",
      expiryDate: "12/28",
      status: "Activ",
      limit: 5000,
    },
    {
      id: "2",
      type: "Credit",
      network: "Visa",
      last4: "7562",
      expiryDate: "06/27",
      status: "Activ",
      limit: 15000,
    },
  ];

  const limits = [
    { name: "Limită Tranzacții POS", value: "5.000,00 RON / zi", icon: "💳" },
    { name: "Limită Retrageri ATM", value: "2.000,00 RON / zi", icon: "💰" },
    { name: "Limită Transfer Online", value: "20.000,00 RON / zi", icon: "🌐" },
    {
      name: "Limită Plăți Contactless",
      value: "500,00 RON / tranzacție",
      icon: "📲",
    },
  ];

  const beneficiaries = [
    { id: "1", name: "Maria Ionescu", iban: "RO49****840001", bank: "BCR" },
    { id: "2", name: "Companie SRL", iban: "RO49****840002", bank: "BRD" },
    { id: "3", name: "Ion Popescu", iban: "RO49****840003", bank: "ING" },
  ];

  const services = [
    { name: "Internet Banking", enabled: true, icon: "🌐" },
    { name: "Mobile Banking", enabled: true, icon: "📱" },
    { name: "SMS Banking", enabled: true, icon: "💬" },
    { name: "Token Virtual", enabled: true, icon: "🔐" },
    { name: "Apple Pay / Google Pay", enabled: true, icon: "📲" },
    { name: "Plăți Recurente", enabled: true, icon: "🔄" },
  ];

  const documents = [
    {
      name: "Contract Cont Curent",
      date: "15 Mar 2020",
      size: "245 KB",
      icon: "📄",
    },
    {
      name: "Extras de Cont Ianuarie 2026",
      date: "01 Feb 2026",
      size: "89 KB",
      icon: "📊",
    },
    {
      name: "Convenție Card Debit",
      date: "20 Apr 2020",
      size: "156 KB",
      icon: "💳",
    },
    {
      name: "Tarife și Comisioane 2026",
      date: "01 Ian 2026",
      size: "312 KB",
      icon: "💰",
    },
  ];

  const handleToggleIBAN = () => {
    setShowFullIBAN(!showFullIBAN);
  };

  const handleCopyIBAN = () => {
    Toast.show({
      type: "success",
      text1: "IBAN copiat",
      text2: "IBAN-ul a fost copiat în clipboard",
    });
  };

  const handleCardLock = () => {
    setIsCardLocked(!isCardLocked);
    Toast.show({
      type: "success",
      text1: isCardLocked ? "Card deblocat" : "Card blocat",
      text2: isCardLocked
        ? "Cardul tău este acum activ"
        : "Cardul tău a fost blocat temporar",
    });
  };

  const formatIBAN = (iban: string) => {
    if (showFullIBAN) {
      return iban.match(/.{1,4}/g)?.join(" ") || iban;
    }
    return "RO49 •••• •••• •••• •••• ••00";
  };

  return (
    <View style={styles.container}>
      {/* Back Button Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalii Cont</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Header */}
        <View style={styles.headerCard}>
          <View style={styles.accountTypeContainer}>
            <Text style={styles.accountTypeIcon}>🏦</Text>
            <View style={styles.accountTypeInfo}>
              <Text style={styles.accountType}>{accountInfo.accountType}</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{accountInfo.status}</Text>
              </View>
            </View>
          </View>

          {/* IBAN Display */}
          <View style={styles.ibanContainer}>
            <Text style={styles.ibanLabel}>IBAN</Text>
            <Text style={styles.ibanNumber}>
              {formatIBAN(accountInfo.iban)}
            </Text>
            <View style={styles.ibanActions}>
              <TouchableOpacity
                style={styles.ibanButton}
                onPress={handleToggleIBAN}
              >
                <Text style={styles.ibanButtonText}>
                  {showFullIBAN ? "👁️ Ascunde" : "👁️ Arată"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ibanButton}
                onPress={handleCopyIBAN}
              >
                <Text style={styles.ibanButtonText}>📋 Copiază</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Account Holder Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Titular Cont</Text>
          <View style={styles.card}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nume complet</Text>
              <Text style={styles.detailValue}>{accountInfo.holderName}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>CNP</Text>
              <Text style={[styles.detailValue, styles.monoFont]}>
                {accountInfo.holderCNP}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Adresă</Text>
              <Text style={[styles.detailValue, styles.textRight]}>
                {accountInfo.address}
              </Text>
            </View>
          </View>
        </View>

        {/* Bank Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalii Bancă</Text>
          <View style={styles.card}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cod SWIFT/BIC</Text>
              <Text style={[styles.detailValue, styles.monoFont]}>
                {accountInfo.swift}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Număr cont</Text>
              <Text style={[styles.detailValue, styles.monoFont]}>
                {accountInfo.accountNumber}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Monedă</Text>
              <Text style={styles.detailValue}>{accountInfo.currency}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Data deschidere</Text>
              <Text style={styles.detailValue}>{accountInfo.openDate}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Sucursală</Text>
              <Text style={[styles.detailValue, styles.textRight]}>
                {accountInfo.branch}
              </Text>
            </View>
          </View>
        </View>

        {/* Account Manager */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manager de Cont</Text>
          <View style={styles.card}>
            <View style={styles.managerCard}>
              <View style={styles.managerIcon}>
                <Text style={styles.managerIconText}>👤</Text>
              </View>
              <View style={styles.managerInfo}>
                <Text style={styles.managerName}>
                  {accountInfo.accountManager}
                </Text>
                <Text style={styles.managerPhone}>
                  {accountInfo.managerPhone}
                </Text>
              </View>
              <TouchableOpacity style={styles.contactButton}>
                <Text style={styles.contactButtonText}>📞 Sună</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Cards */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Carduri Asociate</Text>
            <TouchableOpacity>
              <Text style={styles.addButton}>+ Adaugă Card</Text>
            </TouchableOpacity>
          </View>
          {cards.map((card) => (
            <View key={card.id} style={styles.cardItem}>
              <View style={styles.cardLeft}>
                <View style={styles.cardIconContainer}>
                  <Text style={styles.cardIconText}>💳</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>
                    {card.type} {card.network}
                  </Text>
                  <Text style={styles.cardNumber}>•••• {card.last4}</Text>
                  <Text style={styles.cardExpiry}>
                    Expiră: {card.expiryDate}
                  </Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardLimit}>
                  {card.limit.toLocaleString("ro-RO")} RON
                </Text>
                <View
                  style={[
                    styles.cardStatusBadge,
                    { backgroundColor: "#FFED00" },
                  ]}
                >
                  <Text style={styles.cardStatusText}>{card.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Limits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Limite și Plafoane</Text>
          <View style={styles.card}>
            {limits.map((limit, index) => (
              <React.Fragment key={index}>
                <View style={styles.limitRow}>
                  <Text style={styles.limitIcon}>{limit.icon}</Text>
                  <View style={styles.limitInfo}>
                    <Text style={styles.limitName}>{limit.name}</Text>
                    <Text style={styles.limitValue}>{limit.value}</Text>
                  </View>
                </View>
                {index < limits.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Saved Beneficiaries */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Beneficiari Salvați</Text>
            <TouchableOpacity>
              <Text style={styles.addButton}>+ Adaugă</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {beneficiaries.map((beneficiary, index) => (
              <React.Fragment key={beneficiary.id}>
                <View style={styles.beneficiaryRow}>
                  <View style={styles.beneficiaryIcon}>
                    <Text style={styles.beneficiaryIconText}>👤</Text>
                  </View>
                  <View style={styles.beneficiaryInfo}>
                    <Text style={styles.beneficiaryName}>
                      {beneficiary.name}
                    </Text>
                    <Text style={styles.beneficiaryIban}>
                      {beneficiary.iban} • {beneficiary.bank}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.transferButton}>
                    <Text style={styles.transferButtonText}>💸</Text>
                  </TouchableOpacity>
                </View>
                {index < beneficiaries.length - 1 && (
                  <View style={styles.divider} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Servicii Activate</Text>
          <View style={styles.card}>
            {services.map((service, index) => (
              <React.Fragment key={index}>
                <View style={styles.serviceRow}>
                  <Text style={styles.serviceIcon}>{service.icon}</Text>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <View
                    style={[
                      styles.serviceStatusBadge,
                      service.enabled && styles.serviceActive,
                    ]}
                  >
                    <Text style={styles.serviceStatusText}>
                      {service.enabled ? "✓ Activ" : "✗ Inactiv"}
                    </Text>
                  </View>
                </View>
                {index < services.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Setări Cont</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>🔔 Notificări Push</Text>
                <Text style={styles.settingDescription}>
                  Primește notificări pentru tranzacții
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#1A1A1A33", true: "#F5D908" }}
                thumbColor={notificationsEnabled ? "#FFED00" : "#f4f3f4"}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>🌐 Banking Online</Text>
                <Text style={styles.settingDescription}>
                  Activează accesul online la cont
                </Text>
              </View>
              <Switch
                value={onlineBankingEnabled}
                onValueChange={setOnlineBankingEnabled}
                trackColor={{ false: "#1A1A1A33", true: "#F5D908" }}
                thumbColor={onlineBankingEnabled ? "#FFED00" : "#f4f3f4"}
              />
            </View>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.settingButton}
              onPress={handleCardLock}
            >
              <Text style={styles.settingButtonIcon}>
                {isCardLocked ? "🔓" : "🔒"}
              </Text>
              <Text style={styles.settingButtonText}>
                {isCardLocked
                  ? "Deblochează Cardul"
                  : "Blochează Cardul Temporar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documente</Text>
          <View style={styles.card}>
            {documents.map((doc, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity style={styles.documentRow}>
                  <Text style={styles.documentIcon}>{doc.icon}</Text>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentName}>{doc.name}</Text>
                    <Text style={styles.documentMeta}>
                      {doc.date} • {doc.size}
                    </Text>
                  </View>
                  <Text style={styles.downloadIcon}>⬇️</Text>
                </TouchableOpacity>
                {index < documents.length - 1 && (
                  <View style={styles.divider} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.dangerTitle}>⚠️ Zonă Periculoasă</Text>
          <View style={styles.dangerCard}>
            <TouchableOpacity style={styles.dangerButton}>
              <Text style={styles.dangerButtonText}>🔒 Blochează Contul</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.dangerButton, styles.closeButton]}>
              <Text style={styles.dangerButtonText}>❌ Închide Contul</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

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
  scrollView: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: "#FFED00",
    padding: spacing.xxl,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  accountTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  accountTypeIcon: {
    fontSize: fontSizes.huge,
    marginRight: spacing.md,
  },
  accountTypeInfo: {
    flex: 1,
  },
  accountType: {
    fontSize: fontSizes.xl,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: spacing.xs,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    backgroundColor: "#00FF00",
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: fontSizes.md,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  ibanContainer: {
    backgroundColor: "#FFFFFF",
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: "#1A1A1A",
  },
  ibanLabel: {
    fontSize: fontSizes.sm,
    color: "#1A1A1A",
    opacity: 0.6,
    marginBottom: spacing.xs,
  },
  ibanNumber: {
    fontSize: fontSizes.lg,
    fontWeight: "600",
    color: "#1A1A1A",
    fontFamily: "Courier",
    marginBottom: spacing.md,
  },
  ibanActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  ibanButton: {
    flex: 1,
    backgroundColor: "#F5D908",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: "#1A1A1A",
    alignItems: "center",
  },
  ibanButtonText: {
    fontSize: fontSizes.md,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSizes.xl,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  addButton: {
    fontSize: fontSizes.md,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: "#1A1A1A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#1A1A1A",
    opacity: 0.7,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#1A1A1A",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  textRight: {
    textAlign: "right",
  },
  monoFont: {
    fontFamily: "Courier",
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: "#1A1A1A",
    opacity: 0.1,
  },
  managerCard: {
    flexDirection: "row",
    alignItems: "center",
  },
  managerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFED00",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#1A1A1A",
  },
  managerIconText: {
    fontSize: 24,
  },
  managerInfo: {
    flex: 1,
  },
  managerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  managerPhone: {
    fontSize: 14,
    color: "#1A1A1A",
    opacity: 0.7,
  },
  contactButton: {
    backgroundColor: "#F5D908",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#1A1A1A",
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  cardItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#1A1A1A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFED00",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#1A1A1A",
  },
  cardIconText: {
    fontSize: 24,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  cardNumber: {
    fontSize: 14,
    color: "#1A1A1A",
    opacity: 0.7,
    fontFamily: "Courier",
    marginBottom: 2,
  },
  cardExpiry: {
    fontSize: 12,
    color: "#1A1A1A",
    opacity: 0.6,
  },
  cardRight: {
    alignItems: "flex-end",
  },
  cardLimit: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  cardStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1A1A1A",
  },
  cardStatusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  limitRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  limitIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  limitInfo: {
    flex: 1,
  },
  limitName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  limitValue: {
    fontSize: 13,
    color: "#1A1A1A",
    opacity: 0.7,
  },
  beneficiaryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  beneficiaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5D908",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  beneficiaryIconText: {
    fontSize: 20,
  },
  beneficiaryInfo: {
    flex: 1,
  },
  beneficiaryName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  beneficiaryIban: {
    fontSize: 12,
    color: "#1A1A1A",
    opacity: 0.7,
  },
  transferButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFED00",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1A1A1A",
  },
  transferButtonText: {
    fontSize: 18,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  serviceIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  serviceName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  serviceStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#1A1A1A",
    opacity: 0.2,
  },
  serviceActive: {
    backgroundColor: "#FFED00",
    opacity: 1,
  },
  serviceStatusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: "#1A1A1A",
    opacity: 0.7,
  },
  settingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5D908",
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#1A1A1A",
    marginTop: 4,
  },
  settingButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  settingButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  documentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  documentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  documentMeta: {
    fontSize: 12,
    color: "#1A1A1A",
    opacity: 0.7,
  },
  downloadIcon: {
    fontSize: 20,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FF0000",
    marginBottom: 12,
  },
  dangerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#FF0000",
    gap: 12,
  },
  dangerButton: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FF0000",
    alignItems: "center",
  },
  closeButton: {
    backgroundColor: "#FF000010",
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF0000",
  },
});
