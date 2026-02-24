import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Svg, { G, Path } from "react-native-svg";
import svgPaths from "../../hooks/svg-q8nt6t0xms";
import { apiService } from "./apiService";
import { spacing, fontSizes, borderRadius, ms, wp, hp } from "@/constants/responsive";

function Group() {
  return (
    <Svg width="515" height="366" viewBox="0 0 515 366" fill="none">
      <G id="Group 2">
        <Path d={svgPaths.p131a4580} fill="#FFFB00" fillOpacity={0.34} />
        <Path d={svgPaths.p2612dd00} fill="#FFFB00" fillOpacity={0.34} />
      </G>
    </Svg>
  );
}

export default function AddBeneficiary() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddBeneficiary = async () => {
    if (!name || !phoneNumber || name.trim() === "" || phoneNumber.trim() === "") {
      setError("Te rugăm să completezi toate câmpurile obligatorii.");
      return;
    }

    // Basic phone number validation (at least 10 digits)
    const phoneRegex = /^\d{10,}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\D/g, ""))) {
      setError("Te rugăm introduceți un număr de telefon valid.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await apiService.addBeneficiary({
        fullName: name,
        phoneNumber: phoneNumber,
      });

      if (result) {
        setSuccess(true);
        setName("");
        setPhoneNumber("");
        // Navigate back after 1.5 seconds
        setTimeout(() => {
          router.back();
        }, 1500);
      } else {
        setError("Eroare la adăugarea beneficiarului");
      }
    } catch (err: any) {
      setError(err?.message || "Eroare de conexiune la server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.backgroundGroup}>
          <View style={styles.groupTransform}>
            <Group />
          </View>
        </View>
        <Text style={styles.welcomeText}>Adăugă Beneficiar</Text>

        <View style={styles.formContainer}>
          <TextInput
            placeholder="Nume Complet *"
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholderTextColor="#999"
            editable={!loading}
          />

          <TextInput
            placeholder="Număr Telefon *"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            style={styles.input}
            keyboardType="phone-pad"
            placeholderTextColor="#999"
            editable={!loading}
          />
        </View>

        <View style={styles.messageArea}>
          {success ? (
            <Text style={styles.successText}>Beneficiar adăugat cu succes!</Text>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <Text style={styles.demoText}>
              Toate câmpurile cu * sunt obligatorii
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.addButton, loading && styles.buttonDisabled]}
          onPress={handleAddBeneficiary}
          disabled={loading || success}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.addButtonText}>
              {success ? "Beneficiar Adăugat" : "Adaugă Beneficiar"}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.linksContainer}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>Înapoi</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.homeIndicator}>
        <View style={styles.indicatorBar} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  backgroundGroup: {
    position: "absolute",
    left: ms(-70),
    top: ms(-59),
    width: wp(137),
    height: hp(45),
  },
  groupTransform: {
    transform: [{ scaleY: -1 }],
  },
  welcomeText: {
    marginTop: hp(22),
    fontSize: fontSizes.xxxl,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  formContainer: {
    paddingHorizontal: spacing.xxxl,
  },
  input: {
    height: ms(55),
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.base,
    color: "#1a1a1a",
    backgroundColor: "#f9f9f9",
    marginBottom: spacing.md,
  },
  messageArea: {
    height: ms(30),
    justifyContent: "center",
    alignItems: "center",
  },
  successText: {
    color: "#16a34a",
    fontSize: fontSizes.sm,
    fontWeight: "600",
  },
  errorText: {
    color: "#dc2626",
    fontSize: fontSizes.sm,
    fontWeight: "600",
  },
  demoText: {
    color: "#6b7280",
    fontSize: fontSizes.sm,
  },
  addButton: {
    alignSelf: "center",
    marginTop: spacing.lg,
    width: "80%",
    height: ms(55),
    backgroundColor: "#1a1a1a",
    borderRadius: borderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: "white",
    fontSize: fontSizes.lg,
    fontWeight: "bold",
  },
  linksContainer: {
    marginTop: spacing.xxxl,
    alignItems: "center",
    paddingBottom: ms(50),
  },
  backText: {
    fontSize: fontSizes.md,
    fontWeight: "600",
    color: "#4b5563",
    textDecorationLine: "underline",
  },
  homeIndicator: {
    position: "absolute",
    bottom: spacing.sm,
    alignSelf: "center",
  },
  indicatorBar: {
    width: ms(100),
    height: ms(5),
    backgroundColor: "#C2C2C2",
    borderRadius: ms(5),
  },
});
