import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
  Circle,
  G,
  Path
} from "react-native-svg";
import { RootStackParamList } from "../App";
import svgPaths from "../hooks/svg-5kazw1th4l";

type VoiceAuthNavigationProp = StackNavigationProp<
  RootStackParamList,
  "VoiceAuth"
>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Mock backend function for voice authentication
async function mockVoiceAuthAPI(
  audioData: string,
): Promise<{ success: boolean; message?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const success = Math.random() > 0.3;

  if (success) {
    return { success: true, message: "Autentificare reușită!" };
  }
  return { success: false, message: "Autentificare eșuată. Încearcă din nou." };
}

// Generate random phrases
const phrases = [
  "Accesez acum contul meu bancar",
  "Vreau să văd tranzacțiile recente",
  "Deschide aplicația de banking",
  "Arată-mi soldul contului",
  "Transferă bani în contul meu",
];

function Frame2() {
  return (
    <View style={styles.frame2Container}>
      <Svg width="185" height="185" viewBox="0 0 185 185" fill="none">
        <G id="Frame 7">
          <Circle cx="93.5" cy="80.5" r="60.5" fill="#BFB425" />
          <Circle cx="92.5" cy="92.5" r="90.5" fill="#FFED00" />
          <Circle
            cx="91.5"
            cy="90.5"
            r="73.5"
            fill="#E3D526"
            fillOpacity={0.55}
            stroke="#E3D526"
            strokeOpacity={0.55}
          />
          <Circle cx="93" cy="88" r="48" fill="#E5D618" />
          <Path d={svgPaths.p29d0f8a0} fill="black" />
        </G>
      </Svg>
    </View>
  );
}

function Frame1() {
  return (
    <View style={styles.frame1Container}>
      <Svg width="377.295" height="75.5" viewBox="0 0 377.295 75.5" fill="none">
        <G id="Frame 6">
          <Path d={svgPaths.p12b16400} stroke="#1A1A1A" />
          <Path d={svgPaths.p181e7200} stroke="#F5D908" />
          <Path d={svgPaths.p10869280} stroke="#1A1A1A" />
        </G>
      </Svg>
    </View>
  );
}

function Top() {
  return (
    <View style={styles.topContainer}>
      <Svg width="375" height="40" viewBox="0 0 375 40" fill="none">
        <G id="top">
          <Path d={svgPaths.p10031b00} fill="white" />
          <Path d={svgPaths.p610c280} fill="white" />
          <Path
            d={svgPaths.pe01ca00}
            fill="white"
            fillRule="evenodd"
            clipRule="evenodd"
          />
        </G>
      </Svg>
    </View>
  );
}

export default function VoiceAuth() {
  const navigation = useNavigation<VoiceAuthNavigationProp>();
  const [phrase, setPhrase] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  useEffect(() => {
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    setPhrase(randomPhrase);
  }, []);

  const handleVoiceAuth = async () => {
    setIsListening(true);
    setMessage("Ascultare în curs...");
    setMessageType("");

    try {
      const mockAudioData = "mock_audio_data";
      const result = await mockVoiceAuthAPI(mockAudioData);

      if (result.success) {
        setMessage(result.message || "Autentificare reușită!");
        setMessageType("success");
        setTimeout(() => {
          navigation.navigate("Cards");
        }, 1500);
      } else {
        setMessage(result.message || "Autentificare eșuată");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("Eroare de conexiune");
      setMessageType("error");
    } finally {
      setIsListening(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBackground} />

      <Top />

      <Text style={styles.titleText}>Autentificare vocală</Text>
      <Text style={styles.subtitleText}>Spune următoarea propoziție</Text>

      <Text style={styles.phraseText}>„{phrase}"</Text>

      <Frame2 />

      {/* Speak Now Button */}
      <TouchableOpacity
        style={styles.speakButton}
        onPress={handleVoiceAuth}
        disabled={isListening}
      >
        <Text style={styles.speakButtonText}>
          {isListening ? "Ascultare..." : "Vorbește acum"}
        </Text>
      </TouchableOpacity>

      <Frame1 />

      {/* Status Message */}
      {message && (
        <View style={styles.messageContainer}>
          <Text
            style={[
              styles.messageText,
              messageType === "success" && styles.successText,
              messageType === "error" && styles.errorText,
            ]}
          >
            {message}
          </Text>
        </View>
      )}

      <View style={styles.bottomIndicator} />
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
  topBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "rgba(245, 217, 8, 0.68)",
  },
  topContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 375,
    height: 40,
  },
  titleText: {
    position: "absolute",
    top: 62,
    left: 56,
    fontSize: 24,
    fontWeight: "300",
    color: "#1a1a1a",
  },
  subtitleText: {
    position: "absolute",
    top: 127,
    left: 22,
    fontSize: 14,
    fontWeight: "300",
    color: "#1a1a1a",
  },
  phraseText: {
    position: "absolute",
    top: 176,
    left: 23,
    right: 23,
    fontSize: 18,
    color: "#1a1a1a",
  },
  frame2Container: {
    position: "absolute",
    left: 94,
    top: 268,
    width: 181,
    height: 181,
  },
  speakButton: {
    position: "absolute",
    top: 480,
    left: 126,
    width: 113,
    height: 30,
    backgroundColor: "#ffed00",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  speakButtonText: {
    fontSize: 12,
    color: "#1a1a1a",
  },
  frame1Container: {
    position: "absolute",
    left: -2,
    top: 542,
    width: 377,
    height: 75,
  },
  messageContainer: {
    position: "absolute",
    left: 116,
    top: 777,
    right: 116,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  messageText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
  },
  successText: {
    color: "#16a34a",
  },
  errorText: {
    color: "#dc2626",
  },
  bottomIndicator: {
    position: "absolute",
    left: -7,
    top: 778,
    width: 389,
    height: 34,
    backgroundColor: "rgba(245, 217, 8, 0.68)",
  },
});
