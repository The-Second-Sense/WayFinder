import Voice, {
  SpeechErrorEvent,
  SpeechResultsEvent,
} from "@react-native-voice/voice";
import { Mic, MicOff } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

interface VoiceControlProps {
  onCommand: (command: string) => void;
  isEnabled?: boolean;
}

export function VoiceControl({
  onCommand,
  isEnabled = false,
}: VoiceControlProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Configurăm event listeners pentru Voice
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      console.error(e);
      setIsListening(false);
    };
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value.length > 0) {
        const command = e.value[0];
        setTranscript(command);
        processCommand(command.toLowerCase());
      }
    };

    return () => {
      if (Platform.OS === 'web') return;
      // Curățăm memoria când componenta moare
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const processCommand = (command: string) => {
    onCommand(command);
  };

  const toggleListening = async () => {
    if (!isEnabled) {
      onCommand(""); // Trigger pentru dialog conform logicii tale
      return;
    }

    if (Platform.OS === 'web') {
      onCommand('web-not-supported');
      return;
    }

    try {
      if (isListening) {
        await Voice.stop();
      } else {
        setTranscript("");
        // 'ro-RO' pentru română, 'en-US' pentru engleză
        await Voice.start("ro-RO");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header-ul (echivalent CardHeader) */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Comenzi Vocale</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.buttonContainer}>
          <Pressable
            onPress={toggleListening}
            style={[
              styles.micButton,
              isListening ? styles.micButtonActive : styles.micButtonIdle,
            ]}
          >
            {isListening ? (
              <MicOff size={32} color="#FFED00" />
            ) : (
              <Mic size={32} color="#1A1A1A" />
            )}
          </Pressable>
          <Text style={styles.statusText}>
            {isListening ? "Ascult..." : "Apasă pentru comandă vocală"}
          </Text>
        </View>

        {transcript ? (
          <View style={styles.transcriptBox}>
            <Text style={styles.label}>Ai spus:</Text>
            <Text style={styles.transcriptText}>{transcript}</Text>
          </View>
        ) : null}

        <View style={styles.hintsBox}>
          <Text style={styles.hintsTitle}>Încearcă să spui:</Text>
          <Text style={styles.hintItem}>• &quot; Arată soldul meu &quot;</Text>
          <Text style={styles.hintItem}>
            • &quot; Arată tranzacțiile &quot;
          </Text>
          <Text style={styles.hintItem}>• &quot; Transferă bani &quot;</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#1A1A1A",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
    elevation: 5,
  },
  header: {
    backgroundColor: "#F5D908",
    padding: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  content: {
    padding: 20,
    alignItems: "center",
    gap: 20,
  },
  buttonContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  micButtonIdle: {
    backgroundColor: "#FFED00",
  },
  micButtonActive: {
    backgroundColor: "#1A1A1A",
  },
  statusText: {
    marginTop: 12,
    fontSize: 14,
    color: "#1A1A1A",
  },
  transcriptBox: {
    width: "100%",
    padding: 12,
    backgroundColor: "#FFF",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#1A1A1A",
  },
  label: {
    fontSize: 12,
    color: "rgba(26, 26, 26, 0.6)",
  },
  transcriptText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  hintsBox: {
    width: "100%",
    padding: 12,
    backgroundColor: "#FFF",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#1A1A1A",
  },
  hintsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  hintItem: {
    fontSize: 14,
    color: "rgba(26, 26, 26, 0.7)",
    marginVertical: 2,
  },
});
