import { useRouter } from "expo-router"; // Importul corect pentru Expo Router
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { G, Line, Path } from "react-native-svg";
import svgPaths from "../../hooks/svg-q8nt6t0xms";
import { useAuth } from "../contexts/AuthContext";
import { spacing, fontSizes, borderRadius, ms, wp, hp } from "@/constants/responsive";

// --- COMPONENTE SVG ---
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

// --- PAGINA PRINCIPALĂ ---
export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading: authLoading } = useAuth();
  const [telefon, setTelefon] = useState("");
  const [parola, setParola] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const DEMO_PHONE = "1234567890";
  const DEMO_PASS = "test123";

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      await login(telefon, parola);
      // Navigăm către Dashboard din folderul (tabs)
      // Folosim replace pentru a nu se mai putea întoarce la Login cu butonul Back
      router.replace("/(tabs)/dashboard");
    } catch (err: any) {
      setError(err?.message || "Eroare la autentificare");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Fundal decorativ */}
      <View style={styles.backgroundGroup}>
        <View style={styles.groupTransform}>
          <Group />
        </View>
      </View>

      <Text style={styles.welcomeText}>Welcome Back Amalia!</Text>

      <View style={styles.formContainer}>
        <TextInput
          placeholder="Telefon (ex: 1234567890)"
          value={telefon}
          onChangeText={setTelefon}
          style={styles.input}
          keyboardType="phone-pad"
          placeholderTextColor="#999"
        />

        <TextInput
          placeholder="Parolă (ex: test123)"
          value={parola}
          onChangeText={setParola}
          style={styles.input}
          secureTextEntry
          placeholderTextColor="#999"
        />
      </View>
    
      {/* Mesaj de eroare sau demo */}
      <View style={styles.messageArea}>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <Text style={styles.demoText}>
            {`„Demo: telefon „${DEMO_PHONE}” / parolă „${DEMO_PASS}””`}
          </Text>
        )}
      </View>

      {/* Buton Login */}
      <TouchableOpacity
        style={styles.loginButton}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.loginButtonText}>LOGIN</Text>
        )}
      </TouchableOpacity>

      {/* Link-uri Navigare */}
      <View style={styles.linksContainer}>
        {/* <TouchableOpacity
          onPress={() => router.push("../VoiceAuth")}
          style={styles.linkSpacing}
        >
          <Text style={styles.voiceAuthText}>Autentificare prin voce</Text>
        </TouchableOpacity> */}

        <TouchableOpacity onPress={() => router.push("./register")}>
          <Text style={styles.registerText}>Înregistrează-te</Text>
        </TouchableOpacity>
      </View>

      {/* Indicator Home */}
      <View style={styles.homeIndicator}>
        <Svg width="100" height="5" viewBox="0 0 100 5" fill="none">
          <Line
            x1="2.5"
            y1="2.5"
            x2="97.5"
            y2="2.5"
            stroke="#C2C2C2"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </Svg>
      </View>
    </View>
  );
}

// --- STILURI ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: ms(40),
    overflow: "hidden",
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
  formContainer: {
    paddingHorizontal: spacing.xxxl,
  },
  welcomeText: {
    marginTop: hp(40),
    fontSize: fontSizes.xxl,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
  },
  inputContainerTop: {
    marginTop: ms(50),
    marginHorizontal: spacing.xxxl,
    height: ms(50),
    borderWidth: 1,
    borderColor: "#1a1a1a",
    borderRadius: borderRadius.md,
    justifyContent: "center",
    backgroundColor: "white",
  },
  inputContainerBottom: {
    marginTop: spacing.md,
    marginHorizontal: spacing.xxxl,
    height: ms(50),
    borderWidth: 1,
    borderColor: "#1a1a1a",
    borderRadius: borderRadius.md,
    justifyContent: "center",
    backgroundColor: "white",
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
    height: ms(40),
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  errorText: {
    color: "#dc2626",
    fontSize: fontSizes.sm,
    fontWeight: "600",
  },
  demoText: {
    color: "#6b7280",
    fontSize: fontSizes.xs,
    textAlign: "center",
  },
  loginButton: {
    alignSelf: "center",
    marginTop: spacing.sm,
    width: ms(180),
    height: ms(50),
    backgroundColor: "#1a1a1a",
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonText: {
    color: "white",
    fontSize: fontSizes.lg,
    fontWeight: "bold",
  },
  linksContainer: {
    marginTop: spacing.xxxl,
    alignItems: "center",
  },
  linkSpacing: {
    marginBottom: ms(60),
  },
  voiceAuthText: {
    fontSize: fontSizes.sm,
    fontWeight: "bold",
    color: "black",
    textDecorationLine: "underline",
  },
  registerText: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    fontStyle: "italic",
    color: "black",
    textDecorationLine: "underline",
  },
  homeIndicator: {
    position: "absolute",
    bottom: spacing.lg,
    alignSelf: "center",
  },
});
