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
import { useAuth } from "../contexts/AuthContext";
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

export default function Registration() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [fullname, setFullname] = useState("");
  const [parola, setParola] = useState("");
  const [telefon, setTelefon] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegistration = async () => {
    if (!fullname || !email || !parola || !telefon || fullname.trim() === "" || email.trim() === "" || parola.trim() === "" || telefon.trim() === "") {
      setError("Te rugăm să completezi câmpurile obligatorii.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await apiService.register({
        fullName: fullname,
        email: email,
        password: parola,
        phoneNumber: telefon,
        enableVoiceAuth: true,
      });

      if (result) {
        // Store user data after registration
        console.log('Registration successful, user:', result);
        setUser({
          id: result.userId,
          name: result.fullName,
          email: result.email,
          phone: result.phoneNumber,
        });
        // Registration successful, redirect to voice registration
        router.replace({ pathname: "/VoiceRegistration1", params: { userId: result.userId } });
      } else {
        setError("Eroare la înregistrare");
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
        <Text style={styles.welcomeText}>Înregistrare</Text>

        <View style={styles.formContainer}>
          <TextInput
            placeholder="Nume Complet *"
            value={fullname}
            onChangeText={setFullname}
            style={styles.input}
            placeholderTextColor="#999"
          />

          <TextInput
            placeholder="Email *"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#999"
          />

          <TextInput
            placeholder="Telefon *"
            value={telefon}
            onChangeText={setTelefon}
            style={styles.input}
            keyboardType="phone-pad"
            placeholderTextColor="#999"
          />

          <TextInput
            placeholder="Parolă *"
            value={parola}
            onChangeText={setParola}
            style={styles.input}
            secureTextEntry={true}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.messageArea}>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <Text style={styles.demoText}>
              Toate câmpurile cu * sunt obligatorii
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleRegistration}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.loginButtonText}>Înregistrare</Text>
          )}
        </TouchableOpacity>

        <View style={styles.linksContainer}>
          {/* <TouchableOpacity
            onPress={() => router.push("../VoiceAuth")}
            style={styles.linkSpacing}
          >
            <Text style={styles.voiceAuthText}>Autentificare prin voce</Text>
          </TouchableOpacity> */}

          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={styles.registerText}>Ai deja cont? Loghează-te</Text>
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
  errorText: {
    color: "#dc2626",
    fontSize: fontSizes.sm,
    fontWeight: "600",
  },
  demoText: {
    color: "#6b7280",
    fontSize: fontSizes.sm,
  },
  loginButton: {
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
  loginButtonText: {
    color: "white",
    fontSize: fontSizes.lg,
    fontWeight: "bold",
  },
  linksContainer: {
    marginTop: spacing.xxxl,
    alignItems: "center",
    paddingBottom: ms(50),
  },
  linkSpacing: {
    marginBottom: spacing.lg,
  },
  voiceAuthText: {
    fontSize: fontSizes.md,
    fontWeight: "bold",
    color: "#1a1a1a",
    textDecorationLine: "underline",
  },
  registerText: {
    fontSize: fontSizes.md,
    fontWeight: "600",
    color: "#4b5563",
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
