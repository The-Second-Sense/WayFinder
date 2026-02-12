import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, View } from "react-native";

// Componente Dashboard
import { AccountOverview } from "@/components/AccountOverview";
import { QuickActions } from "@/components/QuickActions";
import { TransactionList } from "@/components/TransactionList";
import { TransferForm } from "@/components/TransferForm";

// Alte pagini
import WelcomePage from "@/app/(tabs)/index";
import LoginPage from "@/app/(tabs)/login";
import CardsHolderPage from "@/components/CardsHolderPage";
import InregistrareVoce from "@/components/InregistrareVoce";
import InregistrareVoce2 from "@/components/InregistrareVoce2";
import RegisterPage from "@/components/RegisterPage";
import VoiceAuth from "@/components/VoiceAuth";

// --- TIPURI ȘI CONFIGURARE NAVIGARE ---
export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  VoiceAuth: undefined;
  InregistrareVoce: undefined;
  InregistrareVoce2: undefined;
  Cards: undefined;
  Dashboard: undefined;
};

export interface UserData {
  nume?: string;
  telefon?: string;
  email?: string;
  parola?: string;
}

const Stack = createStackNavigator<RootStackParamList>();

// --- COMPONENTA DASHBOARD (Pagina Unită) ---
// Am extras logica de dashboard aici pentru a curăța componenta App
function DashboardScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <TransactionList
        transactions={[]} // Adaugă datele tale aici
        // REZOLVARE EROARE: Mutăm restul componentelor în Header-ul listei
        ListHeaderComponent={
          <View style={styles.headerPadding}>
            <AccountOverview
              balance={4520.85}
              accountName="Cont Principal"
              accountNumber="RO12BTRL..."
              monthlyChange={150.2}
            />
            <QuickActions actions={[]} />
            <TransferForm onTransfer={(r, a, t) => console.log(r, a, t)} />
          </View>
        }
      />
    </SafeAreaView>
  );
}

// --- COMPONENTA PRINCIPALĂ APP ---
export default function App() {
  const [userData, setUserData] = useState<UserData>({});

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: "#f3f4f6" },
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomePage} />

        <Stack.Screen name="Login">
          {(props) => (
            <LoginPage {...props} onLogin={(data) => setUserData(data)} />
          )}
        </Stack.Screen>

        <Stack.Screen name="Register">
          {(props) => (
            <RegisterPage {...props} onRegister={(data) => setUserData(data)} />
          )}
        </Stack.Screen>

        <Stack.Screen name="VoiceAuth" component={VoiceAuth} />
        <Stack.Screen name="InregistrareVoce" component={InregistrareVoce} />
        <Stack.Screen name="InregistrareVoce2" component={InregistrareVoce2} />
        <Stack.Screen name="Cards" component={CardsHolderPage} />

        {/* Folosim noua componentă DashboardScreen creată mai sus */}
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerPadding: {
    padding: 16,
  },
});
