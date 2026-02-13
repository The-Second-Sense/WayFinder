import { useRouter } from "expo-router"; // Importul corect pentru Expo Router
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { G, Line, Path } from "react-native-svg";
import svgPaths from "../../hooks/svg-q8nt6t0xms";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// --- MOCK API ---
async function mockLoginAPI(telefon: string, parola: string) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  // Folosim .trim() pentru a elimina spațiile accidentale
  if (telefon.trim() === "1234567890" && parola.trim() === "test123") {
    return { success: true };
  }
  return { success: false, message: "Telefon sau parolă incorectă" };
}

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

function Top() {
  return (
    <View style={styles.topContainer}>
      <Svg width="375" height="43" viewBox="0 0 375 43" fill="none">
        <G id="top">
          <Path d={svgPaths.p2ab9d800} stroke="white" opacity={0.35} />
          <Path d={svgPaths.p3fcc1700} fill="white" opacity={0.4} />
          <Path d={svgPaths.p23127800} fill="white" />
          <Path
            d={svgPaths.p15888f00}
            fill="white"
            fillRule="evenodd"
            clipRule="evenodd"
          />
          <Path
            d={svgPaths.p115f9880}
            fill="white"
            fillRule="evenodd"
            clipRule="evenodd"
          />
          <Path d={svgPaths.p3274b400} fill="white" />
        </G>
      </Svg>
    </View>
  );
}

// --- PAGINA PRINCIPALĂ ---
export default function LoginPage() {
  const router = useRouter();
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
      const result = await mockLoginAPI(telefon, parola);

      if (result.success) {
        // Navigăm către Dashboard din folderul (tabs)
        // Folosim replace pentru a nu se mai putea întoarce la Login cu butonul Back
        router.replace("/(tabs)/dashboard");
      } else {
        setError(result.message || "Eroare la autentificare");
      }
    } catch (err) {
      setError("Eroare de conexiune");
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

      <Top />

      <Text style={styles.welcomeText}>Welcome Back Amalia!</Text>

      {/* Câmp Telefon */}
      <View style={styles.inputContainerTop}>
        <TextInput
          placeholder="Telefon (ex: 1234567890)"
          value={telefon}
          onChangeText={setTelefon}
          style={styles.input}
          keyboardType="phone-pad"
          placeholderTextColor="#999"
        />
      </View>

      {/* Câmp Parolă */}
      <View style={styles.inputContainerBottom}>
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
        <TouchableOpacity
          onPress={() => router.push("../VoiceAuth")}
          style={styles.linkSpacing}
        >
          <Text style={styles.voiceAuthText}>Autentificare prin voce</Text>
        </TouchableOpacity>

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
    borderRadius: 40,
    overflow: "hidden",
  },
  topContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: 43,
  },
  backgroundGroup: {
    position: "absolute",
    left: -70,
    top: -59,
    width: 515,
    height: 366,
  },
  groupTransform: {
    transform: [{ scaleY: -1 }],
  },
  welcomeText: {
    marginTop: 330,
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
  },
  inputContainerTop: {
    marginTop: 50,
    marginHorizontal: 30,
    height: 50,
    borderWidth: 1,
    borderColor: "#1a1a1a",
    borderRadius: 10,
    justifyContent: "center",
    backgroundColor: "white",
  },
  inputContainerBottom: {
    marginTop: 15,
    marginHorizontal: 30,
    height: 50,
    borderWidth: 1,
    borderColor: "#1a1a1a",
    borderRadius: 10,
    justifyContent: "center",
    backgroundColor: "white",
  },
  input: {
    paddingHorizontal: 15,
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  messageArea: {
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "600",
  },
  demoText: {
    color: "#6b7280",
    fontSize: 10,
    textAlign: "center",
  },
  loginButton: {
    alignSelf: "center",
    marginTop: 10,
    width: 180,
    height: 50,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  linksContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  linkSpacing: {
    marginBottom: 60,
  },
  voiceAuthText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "black",
    textDecorationLine: "underline",
  },
  registerText: {
    fontSize: 13,
    fontWeight: "600",
    fontStyle: "italic",
    color: "black",
    textDecorationLine: "underline",
  },
  homeIndicator: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
  },
});
