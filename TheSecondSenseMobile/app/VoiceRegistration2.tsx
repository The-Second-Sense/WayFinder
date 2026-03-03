import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { Audio } from "expo-av";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { G, Line, Path } from "react-native-svg";
import svgPaths from "../hooks/svg-o4ibah9ira";
import { apiService } from "./(tabs)/apiService";
import { useAuth } from "./contexts/AuthContext";
import { BASE_URL } from "./(tabs)/api";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;

const scaleX = SCREEN_WIDTH / DESIGN_WIDTH;
const scaleY = SCREEN_HEIGHT / DESIGN_HEIGHT;

// Mock backend function doar pentru test
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
      <Svg width={SCREEN_WIDTH} height={43*scaleY} viewBox="0 0 375 43" preserveAspectRatio="none" fill="none">
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

//Real backend function
async function sendAudioToBackend( 
    audioUri: string, 
    phraseId: number 
): Promise<{ success: boolean; message?: string }> { 
    try { 
        const formData = new FormData(); 
        formData.append("phraseId", String(phraseId)); 
        formData.append("audioFile", 
            { uri: audioUri, 
                name: "voice.m4a", //"voice.wav", 
                type: "audio/m4a", 
        } as any); 
        const response = await fetch(`${BASE_URL}/auth/voice-reg`, { 
            method: "POST", 
            headers: { "Content-Type": "multipart/form-data", 
            }, 
            body: formData, 
        }); 
    
        if (!response.ok) { 
            const err = await response.json().catch(() => null); 
            return { 
                success: false, 
                message: err?.message || "Server error", 
            }; 
        } 
        const data = await response.json(); 
        return { 
            success: data.success ?? true, 
            message: data.message, 
        }; 
    } catch (e) { 
        return { success: false, message: "Network error" }; 
    } 
}

export default function InregistrareVoce2() {

  const router=useRouter();
  const { userId: userIdParam } = useLocalSearchParams<{ userId: string }>();
  const { user, token, setVoiceAuthEnabled } = useAuth();
  // prefer route param (set immediately after register before context update propagates)
  const resolvedUserId = userIdParam || user?.id || "";
  const [phrase, setPhrase] = useState("");
  const [phraseId, setPhraseId] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);

  const recordingRef=React.useRef<Audio.Recording | null>(null);
  
  useEffect(() => {
    console.log('VoiceRegistration2 - userId (param):', userIdParam, '/ user?.id:', user?.id, '/ resolved:', resolvedUserId);
    console.log('VoiceRegistration2 - Token:', token);
  }, [user, token]);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * phrases.length);
    const randomPhrase = phrases[randomIndex];
    setPhrase(randomPhrase);
    setPhraseId(randomIndex + 1); // Set phraseId based on index
    setIsRecording(false);
    setIsSuccess(false);
    setError("");
  }, []);

// Get a phrase from backend
//   useEffect(() => {
//   async function fetchPhrase() {
//     const res = await fetch(`${BASE_URL}/api/auth/voice-reg/phrase`);
//     const data = await res.json();
//     setPhrase(data.text);
//     setPhraseId(data.id);

//     setIsRecording(false);
//     setIsSuccess(false);
//     setError("");
//   }

//   fetchPhrase();
// }, []);

    async function startRecording() {
        try {
        // Cere permisiuni
            const permission = await Audio.requestPermissionsAsync();
            if (!permission.granted) {
            setError("Permisiunea pentru microfon este necesară");
            return;
        }

        // Setează modul audio
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
        });

        // Pornește înregistrarea
        const { recording } = await Audio.Recording.createAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

        recordingRef.current = recording;
        setRecording(recording);
        } catch (err) {
            setError("Inregistarea nu poate fi pornită");
        }
    }

    async function stopRecording() {
        try {
            const rec=recordingRef.current;
            if(!rec) {
                setError("Înregistrarea nu a fost inițiată corect. Încearcă din nou.");
                setIsRecording(false);
                return;
            }
            await rec.stopAndUnloadAsync();
            const uri = rec.getURI();

            recordingRef.current = null;
            setAudioUri(uri || null);
            setRecording(null);

            return uri;
        } catch (err) {
            setError("Nu pot opri înregistrarea");
        }
    }

  const handleStartRecording = async () => {
    if(!phrase) {
        setError("Nu s-a putut obține propoziția. Încearcă din nou.");
        return;
    }

    setIsRecording(true);
    setError("");
    setIsSuccess(false);

    try {
        await startRecording();

        setTimeout(async () => {
            const uri = await stopRecording();

            console.log("Audio URI:", uri);

            if(!uri) {
                setError("Nu s-a putut obține fișierul audio. Încearcă din nou.");
                setIsRecording(false);
                return;
            }

            setIsRecording(false);
            setIsProcessing(true);

            const result = await apiService.registerVoice(resolvedUserId, phraseId.toString(), uri);
            setIsProcessing(false);

            if (result.success) {
              setVoiceAuthEnabled(true);
              setIsSuccess(true);
            } else {
              setError(result.message || "Înregistrarea a eșuat");
              setIsSuccess(false);
            }
        }, 3000);
    } catch (err) {
      setError("Eroare de conexiune");
      setIsSuccess(false);
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
        <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} viewBox="0 0 375 861" preserveAspectRatio="none" fill="none">
          <Path d={svgPaths.p2983ec10} fill="#FFED00" fillOpacity={0.68} />
        </Svg>
      </View>

      <Frame />

      {/* Content */}
      <View style={styles.content}>

        <Text style={styles.titleText}>
            Apasă pe buton și spune propoziția de mai jos cu voce normală.
        </Text>

      <Text style={styles.phraseText}>{phrase}.</Text>
        <GameIconsSoundWaves isAnimating={isRecording} />
      {/* Start Recording Button */}
      {!isSuccess && !isProcessing && (
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

      {/* Processing indicator */}
      {isProcessing && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#1a1a1a" />
          <Text style={styles.processingText}>
            Se procesează vocea ta...{"\n"}Acest lucru poate dura câteva secunde.
          </Text>
        </View>
      )}

      {/* Error Message */}
      {error && !isProcessing && <Text style={styles.errorText}>{error}</Text>}

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
      </View>

    <View style={styles.footer}>
      <Text style={styles.privacyText}>
        Vocea ta este criptată și folosită doar pentru autentificare.
      </Text>

      {/* Home indicator */}
      <View style={styles.homeIndicator}>
        <Svg width="100" height="5" viewBox="0 0 100 5" preserveAspectRatio="none" fill="none">
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //backgroundColor: "white",
    // width: SCREEN_WIDTH,
    // height: SCREEN_HEIGHT,
    // backgroundColor: "white",
    // overflow: "hidden",
    // position: "relative",
  },
  yellowBackground: {
    position: "absolute", 
    width: SCREEN_WIDTH, 
    height: SCREEN_HEIGHT, 
    top: 0, 
    left: 0, 
    zIndex: -1,
    // position: "absolute",
    // left: 0,
    // top: -49*scaleY,
    // width: 375*scaleX,
    // height: 861*scaleY,
    // transform: [{ scaleY: -1 }],
  },
  frameContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 375*scaleX,
    height: 43*scaleY,
  },
  soundWavesContainer: {
    width: 150, height: 150, justifyContent: "center", alignItems: "center",
    // position: "absolute",
    // left: SCREEN_WIDTH * 0.5,
    // top: 427*scaleY,
    // width: 152*scaleX,
    // height: 152*scaleY,
    // marginLeft: -(152*scaleX)/2,
    // backgroundColor: "transparent",
    // justifyContent: "center",
    // alignItems: "center",
  },
  content: { 
    flex: 1, paddingHorizontal: 24, alignItems: "center", justifyContent: "center", gap: 24,
    // flex: 1, 
    // marginTop: 80 * scaleY, 
    // paddingHorizontal: 20 * scaleX, 
    // alignItems: "center", 
    // justifyContent: "flex-start", 
    // gap: 30 * scaleY, 
},
  titleText: {
    fontSize: 22, fontWeight: "bold", textAlign: "center", color: "#1a1a1a",
    // position: "absolute",
    // top: 110*scaleY,
    // left: 22*scaleX,
    // right:  22*scaleX,
    // fontSize: 24,
    // fontWeight: "bold",
    // color: "#1a1a1a",
    // textAlign: "center",
    // lineHeight: 32,
  },
  phraseText: {
    // position: "absolute",
    // top: 264*scaleY,
    // left: 58*scaleX,
    // right: 58*scaleX,
    fontSize: 20,
    color: "#1a1a1a",
    textAlign: "center",
    lineHeight: 26,
  },
  recordButton: {
    backgroundColor: "#1a1a1a", paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12,
    // position: "absolute",
    // top: 338*scaleY,
    // left: 91*scaleX,
    // width: 203*scaleX,
    // height: 64*scaleY,
    // backgroundColor: "#1a1a1a",
    // borderRadius: 10,
    // justifyContent: "center",
    // alignItems: "center",
  },
  recordButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  processingContainer: {
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 24,
  },
  processingText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1a1a1a",
    textAlign: "center",
    lineHeight: 24,
  },
  errorText: {
    color: "#dc2626", fontSize: 16, textAlign: "center",
    // position: "absolute",
    // top: 629*scaleY,
    // left: 80*scaleX,
    // right: 80*scaleX,
    // fontSize: 16,
    // fontWeight: "500",
    // color: "#dc2626",
    // textAlign: "center",
  },
  successText: {
    color: "#16a34a", fontSize: 18, textAlign: "center",
    // position: "absolute",
    // top: 600*scaleY,
    // left: 80*scaleX,
    // right: 80*scaleX,
    // fontSize: 18,
    // fontWeight: "500",
    // color: "#16a34a",
    // textAlign: "center",
  },
  finalizeButton: {
    backgroundColor: "#1a1a1a", paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12,
    // position: "absolute",
    // top: 677*scaleY,
    // left: 93*scaleX,
    // width: 204*scaleX,
    // height: 54*scaleY,
    // backgroundColor: "#1a1a1a",
    // borderRadius: 10,
    // justifyContent: "center",
    // alignItems: "center",
  },
  finalizeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  footer: {
    paddingBottom: 24, alignItems: "center", gap: 12,
    // position: "absolute",
    // bottom: 20* scaleY,
    // width: "100%",
    // alignItems: "center",
  },
  privacyText: {
    fontSize: 12, textAlign: "center", color: "#1a1a1a", paddingHorizontal: 40,
    // position: "absolute",
    // top: 763*scaleY,
    // left: 34*scaleX,
    // right: 34*scaleX,
    // fontSize: 11*scaleX,
    // fontWeight: "200",
    // color: "#1a1a1a",
    // textAlign: "center",
    // marginBottom: 10*scaleY,
  },
  homeIndicator: {
    // position: "absolute",
    // left: 137*scaleX,
    // top: 792*scaleY,
    width: 100,
    height: 5,
  },
});
