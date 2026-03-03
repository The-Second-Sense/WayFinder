import { Stack } from "expo-router";
import { View, StyleSheet } from "react-native";
import { AuthProvider } from "./contexts/AuthContext";
import { TutorialProvider } from "../tutorial/TutorialContext";
import { TutorialOverlay } from "../tutorial/TutorialOverlay";

export default function RootLayout() {
  return (
    <AuthProvider>
      <TutorialProvider>
        <View style={styles.root}>
          <Stack screenOptions={{ headerShown: false }}>
            {/* Aceste nume trebuie să corespundă cu numele fișierelor tale din folderul app */}
            <Stack.Screen name="(tabs)/index" />
            <Stack.Screen name="(tabs)/login" />
            <Stack.Screen name="(tabs)/register" />
            <Stack.Screen name="VoiceAuth" /> {/* VoiceAuth */}
            <Stack.Screen name="(tabs)/dashboard" />
            <Stack.Screen name="(tabs)/transaction" />
            <Stack.Screen name="(tabs)/cards" />
            <Stack.Screen name="(tabs)/facturi" />
            <Stack.Screen name="(tabs)/detalii" />
          </Stack>
          {/* TutorialOverlay floats on top of every screen */}
          <TutorialOverlay />
        </View>
      </TutorialProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
