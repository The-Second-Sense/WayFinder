import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { G, Line, Path } from "react-native-svg";
import svgPaths from "../hooks/svg-o4ibah9ira";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Mock backend function for voice registration
async function mockVoiceRegisterAPI(
  audioData: string,
): Promise<{ success: boolean; message?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const success = Math.random() > 0.1;

  if (success) {
    return { success: true };
  }
  return {
    success: false,
    message: "Înregistrarea vocii a eșuat. Încearcă din nou.",
  };
}

// Generate random phrases
const phrases = [
  "Accesez contul meu WayFinder în siguranță",
  "Confirm transferul meu bancar acum",
  "Deschid aplicația mea de banking",
  "Verific soldul contului meu curent",
  "Autentificare sigură prin voce",
];

function GameIconsSoundWaves({ isAnimating }: { isAnimating?: boolean }) {
  const scaleAnim = new Animated.Value(1);

  useEffect(() => {
    if (isAnimating) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [isAnimating]);

  return (
    <Animated.View
      style={[
        styles.soundWavesContainer,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Svg
        width="136.562"
        height="89.0031"
        viewBox="0 0 136.562 89.0031"
        fill="none"
      >
        <Path d={svgPaths.p190a6b00} fill="#1A1A1A" />
      </Svg>
    </Animated.View>
  );
}

function Frame() {
  return (
    <View style={styles.frameContainer}>
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

export default function InregistrareVoce2() {
  //const navigation = useNavigation<InregistrareVoce2NavigationProp>();
  const router=useRouter();
  const [phrase, setPhrase] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    setPhrase(randomPhrase);
    setIsRecording(false);
    setIsSuccess(false);
    setError("");
  }, []);

  const handleStartRecording = async () => {
    setIsRecording(true);
    setError("");

    try {
      const mockAudioData = "mock_voice_registration_data";
      const result = await mockVoiceRegisterAPI(mockAudioData);

      if (result.success) {
        setIsSuccess(true);
      } else {
        setError(result.message || "Înregistrarea a eșuat");
        setIsSuccess(false);
      }
    } catch (err) {
      setError("Eroare de conexiune");
      setIsSuccess(false);
    } finally {
      setIsRecording(false);
    }
  };

  const handleFinalize = () => {
    //navigation.navigate("Cards");
    router.replace("/(tabs)/dashboard");
  };

  return (
    <View style={styles.container}>
      {/* Background yellow shape */}
      <View style={styles.yellowBackground}>
        <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} viewBox="0 0 375 861" fill="none">
          <Path d={svgPaths.p2983ec10} fill="#FFED00" fillOpacity={0.68} />
        </Svg>
      </View>

      <Frame />

      <GameIconsSoundWaves isAnimating={isRecording} />

      <Text style={styles.titleText}>
        Apasă pe buton și spune propoziția de mai jos cu voce normală.
      </Text>

      <Text style={styles.phraseText}>{phrase}.</Text>

      {/* Start Recording Button */}
      {!isSuccess && (
        <TouchableOpacity
          style={styles.recordButton}
          onPress={handleStartRecording}
          disabled={isRecording}
        >
          <Text style={styles.recordButtonText}>
            {isRecording ? "Înregistrare..." : "Începe înregistrarea"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Error Message */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Success Message */}
      {isSuccess && (
        <>
          <Text style={styles.successText}>
            Vocea a fost înregistrată cu succes
          </Text>

          {/* Finalize Button */}
          <TouchableOpacity
            style={styles.finalizeButton}
            onPress={handleFinalize}
          >
            <Text style={styles.finalizeButtonText}>
              Finalizează înregistrarea
            </Text>
          </TouchableOpacity>
        </>
      )}

      <Text style={styles.privacyText}>
        Vocea ta este criptată și folosită doar pentru autentificare.
      </Text>

      {/* Home indicator */}
      <View style={styles.homeIndicator}>
        <Svg width="100" height="5" viewBox="0 0 100 5" fill="none">
          <Line
            x1="2.5"
            y1="2.5"
            x2="97.5"
            y2="2.5"
            stroke="white"
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
    //borderRadius: 40,
    overflow: "hidden",
    position: "relative",
  },
  yellowBackground: {
    position: "absolute",
    left: 0,
    top: -49,
    width: 375,
    height: 861,
    transform: [{ scaleY: -1 }],
  },
  frameContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 375,
    height: 43,
  },
  soundWavesContainer: {
    position: "absolute",
    left: "50%",
    top: 427,
    width: 152,
    height: 152,
    marginLeft: -76,

    //backgroundColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  titleText: {
    position: "absolute",
    top: 110,
    left: 22,
    right: 22,
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    lineHeight: 32,
  },
  phraseText: {
    position: "absolute",
    top: 264,
    left: 58,
    right: 58,
    fontSize: 20,
    color: "#1a1a1a",
    textAlign: "center",
    lineHeight: 26,
  },
  recordButton: {
    position: "absolute",
    top: 338,
    left: 91,
    width: 203,
    height: 64,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  recordButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  errorText: {
    position: "absolute",
    top: 629,
    left: 80,
    right: 80,
    fontSize: 16,
    fontWeight: "500",
    color: "#dc2626",
    textAlign: "center",
  },
  successText: {
    position: "absolute",
    top: 600,
    left: 80,
    right: 80,
    fontSize: 18,
    fontWeight: "500",
    color: "#16a34a",
    textAlign: "center",
  },
  finalizeButton: {
    position: "absolute",
    top: 677,
    left: 93,
    width: 204,
    height: 54,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  finalizeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  privacyText: {
    position: "absolute",
    top: 763,
    left: 34,
    right: 34,
    fontSize: 11,
    fontWeight: "200",
    color: "#1a1a1a",
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
