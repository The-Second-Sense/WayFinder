import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { G, Path } from "react-native-svg";
import svgPaths from "../hooks/svg-q8nt6t0xms";
import { apiService } from "./(tabs)/apiService";
import { useAuth } from "./contexts/AuthContext";
import { spacing, fontSizes, borderRadius, ms, wp, hp } from "@/constants/responsive";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

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

export default function PinRegistration() {
  const router = useRouter();
  const { userId: userIdParam } = useLocalSearchParams<{ userId: string }>();
  const { user, setUser } = useAuth();
  const resolvedUserId = userIdParam || user?.id;

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  React.useEffect(() => {
    console.log('📍 PinRegistration mounted - userId param:', userIdParam, 'resolved:', resolvedUserId);
  }, [userIdParam, resolvedUserId]);

  const handleSetPin = async () => {
    // Validation
    if (!pin || pin.length === 0) {
      setError("Te rugăm să introducă PIN-ul");
      return;
    }

    if (pin.length !== 4) {
      setError("PIN-ul trebuie să aibă exact 4 cifre");
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setError("PIN-ul trebuie să conțină doar cifre");
      return;
    }

    if (pin !== confirmPin) {
      setError("PIN-urile nu se potrivesc");
      return;
    }

    setError("");
    setLoading(true);

    try {
      if (!resolvedUserId) {
        throw new Error("User ID not found");
      }

      const response = await apiService.setTransferPin(resolvedUserId, pin);
      console.log('[PinRegistration] setTransferPin response:', JSON.stringify(response));

      if (response?.success || response?.message) {
        // Update user state with the PIN so dashboard guard allows access
        if (user) {
          console.log('[PinRegistration] User state before update:', JSON.stringify(user));
          const updatedUser = { ...user, transferPin: pin };
          console.log('[PinRegistration] User state after update:', JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
        
        // Determine where to redirect
        const redirectPath = userIdParam ? "/VoiceRegistration1" : "/(tabs)/dashboard";
        const redirectParams = userIdParam ? { userId: resolvedUserId } : undefined;
        
        console.log('[PinRegistration] PIN set successfully, redirecting to:', redirectPath, redirectParams);
        
        // Wait for state to update before redirecting
        setTimeout(() => {
          console.log('[PinRegistration] State update complete, now redirecting');
          if (redirectParams) {
            router.replace({ pathname: redirectPath, params: redirectParams });
          } else {
            router.replace(redirectPath);
          }
        }, 200);
      } else {
        setError(response?.message || "Nu s-a putut seta PIN-ul");
      }
    } catch (err: any) {
      setError(err?.message || "Eroare la setarea PIN-ului");
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
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <View style={styles.backgroundGroup}>
          <View style={styles.groupTransform}>
            <Group />
          </View>
        </View>

        <Text style={styles.welcomeText}>Securitate Transfer</Text>
        <Text style={styles.subtitleText}>
          PIN-ul este obligatoriu pentru a proteja transferurile tale bancare
        </Text>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PIN de Transfer *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="0000"
                value={pin}
                onChangeText={(text) => {
                  setPin(text.replace(/[^0-9]/g, ""));
                  setError("");
                }}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry={!showPassword}
                style={styles.input}
                placeholderTextColor="#999"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <Text style={styles.toggleButtonText}>
                  {showPassword ? "👁" : "⌣"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmă PIN *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="0000"
                value={confirmPin}
                onChangeText={(text) => {
                  setConfirmPin(text.replace(/[^0-9]/g, ""));
                  setError("");
                }}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry={!showConfirmPassword}
                style={styles.input}
                placeholderTextColor="#999"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                <Text style={styles.toggleButtonText}>
                  {showConfirmPassword ? "👁" : "⌣"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>Sfat: </Text>
              Alege un PIN ușor de reținut dar greu de ghicit. Nu folosi 1234, 0000, sau cifre care se repetă.
            </Text>
          </View>
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
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSetPin}
          disabled={loading || pin.length !== 4}
        >
          <Text style={styles.submitButtonText}>
            {loading ? "Se procesează..." : "Setează PIN"}
          </Text>
        </TouchableOpacity>

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
    backgroundColor: "#fff",
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
    marginBottom: spacing.xs,
  },
  subtitleText: {
    fontSize: fontSizes.base,
    color: "#666",
    textAlign: "center",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xxxl,
  },
  formContainer: {
    paddingHorizontal: spacing.xxxl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: borderRadius.lg,
    backgroundColor: "#f9f9f9",
    paddingHorizontal: spacing.md,
    height: ms(55),
  },
  input: {
    flex: 1,
    fontSize: fontSizes.xl,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
    letterSpacing: 8,
  },
  toggleButton: {
    padding: spacing.md,
    marginLeft: spacing.sm,
  },
  toggleButtonText: {
    fontSize: fontSizes.md,
    color: "#999",
    fontWeight: "600",
  },
  infoBox: {
    backgroundColor: "#f0f0f0",
    borderLeftWidth: 3,
    borderLeftColor: "#FFED00",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  infoText: {
    fontSize: fontSizes.sm,
    color: "#666",
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: "600",
    color: "#1a1a1a",
  },
  messageArea: {
    height: ms(30),
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.lg,
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
  submitButton: {
    alignSelf: "center",
    marginTop: spacing.lg,
    width: "80%",
    height: ms(55),
    backgroundColor: "#FFED00",
    borderRadius: borderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#1a1a1a",
    fontSize: fontSizes.lg,
    fontWeight: "700",
  },
  homeIndicator: {
    height: ms(20),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  indicatorBar: {
    width: 135,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#000",
  },
});
