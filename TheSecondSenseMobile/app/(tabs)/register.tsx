import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
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

const { width: Screen_width, height: Screen_height } = Dimensions.get("window");

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

export default function Registration() {
  const router = useRouter();
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
      // const response = await fetch("https://localhost/8080/register", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     name: fullname,
      //     email: email,
      //     password: parola,
      //     phone: telefon,
      //   }),
      // });

      // const result = await response.json();

      const response = {} as any; // Mock response for testing
      response.ok = true; // Mock ok response for testing
      const result = {} as any; // Mock result for testing
      result.success = true; // Mock success response for testing

      if (response.ok && result.success) {
        //router.replace("/(tabs)/dashboard");
        router.replace("/VoiceRegistration1");
      } else {
        setError(result.message || "Eroare la înregistrare");
      }
    } catch (err) {
      setError("Eroare de conexiune la server");
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
        <Top />

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
  topContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: 43,
    zIndex: 10,
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
    marginTop: 180, // Ajustat pentru a nu fi prea jos
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 20,
  },
  formContainer: {
    paddingHorizontal: 30,
  },
  input: {
    height: 55,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#1a1a1a",
    backgroundColor: "#f9f9f9",
    marginBottom: 15,
  },
  messageArea: {
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "600",
  },
  demoText: {
    color: "#6b7280",
    fontSize: 12,
  },
  loginButton: {
    alignSelf: "center",
    marginTop: 20,
    width: "80%",
    height: 55,
    backgroundColor: "#1a1a1a",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3, // Umbră pe Android
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  linksContainer: {
    marginTop: 30,
    alignItems: "center",
    paddingBottom: 50,
  },
  linkSpacing: {
    marginBottom: 20,
  },
  voiceAuthText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1a1a1a",
    textDecorationLine: "underline",
  },
  registerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4b5563",
  },
  homeIndicator: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
  },
  indicatorBar: {
    width: 100,
    height: 5,
    backgroundColor: "#C2C2C2",
    borderRadius: 5,
  },
});
