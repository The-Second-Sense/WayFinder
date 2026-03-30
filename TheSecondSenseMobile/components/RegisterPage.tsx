import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { G, Line, Path } from "react-native-svg";
import { RootStackParamList, UserData } from "../app/(tabs)/dashboard";
import svgPaths from "../hooks/svg-so1kn34rt7";

// Hide native password toggle only when running in a browser environment.
if (Platform.OS === "web" && typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    input[type="password"]::-webkit-credentials-auto-fill-button,
    input[type="password"]::-webkit-outer-autofill-button {
      display: none !important;
    }
    input[type="password"]::-ms-reveal {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}

type RegisterPageNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Register"
>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Mock backend function for registration
async function mockRegisterAPI(
  nume: string,
  telefon: string,
  email: string,
  parola: string,
): Promise<{ success: boolean; message?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (!nume || !telefon || !email || !parola) {
    return { success: false, message: "Toate câmpurile sunt obligatorii" };
  }

  if (email.indexOf("@") === -1) {
    return { success: false, message: "Email invalid" };
  }

  if (parola.length < 6) {
    return {
      success: false,
      message: "Parola trebuie să aibă cel puțin 6 caractere",
    };
  }

  return { success: true };
}

function Group() {
  return (
    <Svg width="515" height="366" viewBox="0 0 515 366" fill="none">
      <G id="Group 2">
        <Path d={svgPaths.p131a4580} fill="#FFED00" fillOpacity={0.34} />
        <Path d={svgPaths.p2612dd00} fill="#FFED00" fillOpacity={0.34} />
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

interface RegisterPageProps {
  onRegister: (data: UserData) => void;
}

export default function RegisterPage({ onRegister }: RegisterPageProps) {
  const navigation = useNavigation<RegisterPageNavigationProp>();
  const [nume, setNume] = useState("");
  const [telefon, setTelefon] = useState("");
  const [email, setEmail] = useState("");
  const [parola, setParola] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await mockRegisterAPI(nume, telefon, email, parola);

      if (result.success) {
        onRegister({ nume, telefon, email, parola });
        navigation.navigate("InregistrareVoce");
      } else {
        setError(result.message || "Eroare la înregistrare");
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

      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>Bine ai venit!</Text>
        <Text style={styles.welcomeText}>Să începem!</Text>
      </View>

      {/* Nume Field */}
      <View style={styles.numeContainer}>
        <TextInput
          placeholder="Nume"
          value={nume}
          onChangeText={setNume}
          style={styles.input}
          placeholderTextColor="#999"
        />
      </View>

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

      {/* Email Field */}
      <View style={styles.emailContainer}>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#999"
        />
      </View>

      {/* Parola Field */}
      <View style={styles.parolaContainer}>
        <View style={styles.passwordInputRow}>
          <TextInput
            placeholder="Parolă"
            value={parola}
            onChangeText={setParola}
            style={[styles.input, styles.passwordInput]}
            secureTextEntry={!showPassword}
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            onPress={() => setShowPassword((prev) => !prev)}
            style={styles.passwordToggleButton}
            disabled={loading}
          >
            <Text style={styles.passwordToggleText}>{showPassword ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Error Message */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Register Button */}
      <TouchableOpacity
        style={styles.registerButton}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.registerButtonText}>Înregistrare</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.stepText}>Pasul 1 din 2</Text>

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
  welcomeContainer: {
    position: "absolute",
    top: 310,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
  },
  numeContainer: {
    position: "absolute",
    top: 409,
    left: 7,
    right: 188,
    height: 38,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#1a1a1a",
    borderRadius: 10,
    justifyContent: "center",
  },
  telefonContainer: {
    position: "absolute",
    top: 471,
    left: 7,
    right: 188,
    height: 62,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#1a1a1a",
    borderRadius: 10,
    justifyContent: "center",
  },
  emailContainer: {
    position: "absolute",
    top: 535,
    left: 11,
    right: 184,
    height: 52,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#1a1a1a",
    borderRadius: 10,
    justifyContent: "center",
  },
  parolaContainer: {
    position: "absolute",
    top: 598,
    left: 11,
    right: 184,
    height: 56,
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
  passwordInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 10,
  },
  passwordInput: {
    flex: 1,
    paddingRight: 8,
  },
  passwordToggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  passwordToggleText: {
    color: "#4b5563",
    fontSize: 10,
    fontWeight: "700",
  },
  errorText: {
    position: "absolute",
    top: 620,
    left: 30,
    right: 30,
    textAlign: "center",
    color: "#dc2626",
    fontSize: 10,
    fontWeight: "600",
  },
  registerButton: {
    position: "absolute",
    top: 654,
    left: 97,
    width: 180,
    height: 50,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  registerButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  stepText: {
    position: "absolute",
    top: 758,
    left: 0,
    right: 0,
    fontSize: 18,
    color: "black",
    textAlign: "center",
  },
  homeIndicator: {
    position: "absolute",
    left: 137,
    top: 792,
    width: 100,
    height: 5,
  },
});
