import { Stack } from "expo-router";
import { AuthProvider } from "./contexts/AuthContext";
import { TutorialProvider } from "../tutorial/TutorialContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <TutorialProvider>
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
      </TutorialProvider>
    </AuthProvider>
  );
}
