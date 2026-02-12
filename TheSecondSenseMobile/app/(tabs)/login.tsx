import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
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
import { RootStackParamList, UserData } from "./dashboard";

type LoginPageNavigationProp = StackNavigationProp<RootStackParamList, "Login">;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Mock backend function for login
async function mockLoginAPI(
  telefon: string,
  parola: string,
): Promise<{ success: boolean; message?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (telefon === "1234567890" && parola === "test123") {
    return { success: true };
  }
  return { success: false, message: "Telefon sau parolă incorectă" };
}

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

interface LoginPageProps {
  onLogin: (data: UserData) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const navigation = useNavigation<LoginPageNavigationProp>();
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
        onLogin({ telefon, parola });
        navigation.navigate("Cards");
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
      {/* Background shapes */}
      <View style={styles.backgroundGroup}>
        <View style={styles.groupTransform}>
          <Group />
        </View>
      </View>

      <Top />

      <Text style={styles.welcomeText}>Welcome Back Amalia!</Text>

      {/* Telefon Field */}
      <View style={styles.telefonContainer}>
        <TextInput
          placeholder="Telefon"
          value={telefon}
          onChangeText={setTelefon}
          style={styles.input}
          keyboardType="phone-pad"
          placeholderTextColor="#999"
        />
      </View>

      {/* Parola Field */}
      <View style={styles.parolaContainer}>
        <TextInput
          placeholder="Parolă"
          value={parola}
          onChangeText={setParola}
          style={styles.input}
          secureTextEntry
          placeholderTextColor="#999"
        />
      </View>

      {/* Error or Demo Message */}
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <Text style={styles.demoText}>
          {`Demo: telefon "${DEMO_PHONE}" / parolă "${DEMO_PASS}"`}
        </Text>
      )}

      {/* Login Button */}
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

      {/* Voice Auth Link */}
      <TouchableOpacity onPress={() => navigation.navigate("VoiceAuth")}>
        <Text style={styles.voiceAuthText}>Autentificare prin voce</Text>
      </TouchableOpacity>

      {/* Register Link */}
      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.registerText}>Înregistreză-te</Text>
      </TouchableOpacity>

      {/* Home indicator */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "white",
    borderRadius: 40,
    overflow: "hidden",
    position: "relative",
  },
  topContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 375,
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
    position: "absolute",
    top: 329,
    left: 0,
    right: 0,
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
  },
  telefonContainer: {
    position: "absolute",
    top: 429,
    left: 16,
    right: 179,
    height: 45,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#1a1a1a",
    borderRadius: 10,
    justifyContent: "center",
  },
  parolaContainer: {
    position: "absolute",
    top: 494,
    left: 16,
    right: 168,
    height: 47,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#1a1a1a",
    borderRadius: 10,
    justifyContent: "center",
  },
  input: {
    paddingHorizontal: 15,
    fontSize: 11,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  errorText: {
    position: "absolute",
    top: 550,
    left: 30,
    right: 30,
    textAlign: "center",
    color: "#dc2626",
    fontSize: 11,
    fontWeight: "600",
  },
  demoText: {
    position: "absolute",
    top: 545,
    left: 30,
    right: 30,
    textAlign: "center",
    color: "#6b7280",
    fontSize: 9,
  },
  loginButton: {
    position: "absolute",
    top: 591,
    left: 106,
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
  voiceAuthText: {
    position: "absolute",
    top: 665,
    left: 130,
    fontSize: 11,
    fontWeight: "bold",
    color: "black",
    textDecorationLine: "underline",
  },
  registerText: {
    position: "absolute",
    top: 758,
    left: 148,
    fontSize: 11,
    fontWeight: "600",
    fontStyle: "italic",
    color: "black",
    textDecorationLine: "underline",
  },
  homeIndicator: {
    position: "absolute",
    left: 137,
    top: 792,
    width: 100,
    height: 5,
  },
});
