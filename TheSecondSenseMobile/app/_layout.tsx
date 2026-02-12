import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Aceste nume trebuie să corespundă cu numele fișierelor tale din folderul app */}
      <Stack.Screen name="(tabs)/index" />
      <Stack.Screen name="(tabs)/login" />
      <Stack.Screen name="(tabs)/dashboard" />
    </Stack>
  );
}
