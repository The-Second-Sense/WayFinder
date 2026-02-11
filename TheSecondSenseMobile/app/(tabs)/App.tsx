import CardsHolderPage from "@/components/CardsHolderPage";
import InregistrareVoce from "@/components/InregistrareVoce";
import InregistrareVoce2 from "@/components/InregistrareVoce2";
import LoginPage from "@/components/LoginPage";
import RegisterPage from "@/components/RegisterPage";
import VoiceAuth from "@/components/VoiceAuth";
import WelcomePage from "@/components/WelcomePage";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { useState } from "react";
import DashboardPage from "./DashboardPage";

export type PageType =
  | "welcome"
  | "login"
  | "register"
  | "voiceAuth"
  | "inregistrareVoce"
  | "inregistrareVoce2"
  | "cards";

export interface UserData {
  nume?: string;
  telefon?: string;
  email?: string;
  parola?: string;
}

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

const Stack = createStackNavigator<RootStackParamList>();

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
        <Stack.Screen name="Dashboard" component={DashboardPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
