import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomePage from './imports/WelcomePage';
import LoginPage from './imports/LoginPage';
import RegisterPage from './imports/RegisterPage';
import VoiceAuth from './imports/VoiceAuth';
import InregistrareVoce from './imports/InregistrareVoce';
import InregistrareVoce2 from './imports/InregistrareVoce2';
import CardsHolderPage from './imports/CardsHolderPage';

export type PageType = 'welcome' | 'login' | 'register' | 'voiceAuth' | 'inregistrareVoce' | 'inregistrareVoce2' | 'cards';

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
          cardStyle: { backgroundColor: '#f3f4f6' }
        }}
      >
        <Stack.Screen name="Welcome">
          {(props) => <WelcomePage {...props} />}
        </Stack.Screen>
        <Stack.Screen name="Login">
          {(props) => (
            <LoginPage 
              {...props}
              onLogin={(data) => setUserData(data)}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Register">
          {(props) => (
            <RegisterPage 
              {...props}
              onRegister={(data) => setUserData(data)}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="VoiceAuth" component={VoiceAuth} />
        <Stack.Screen name="InregistrareVoce" component={InregistrareVoce} />
        <Stack.Screen name="InregistrareVoce2" component={InregistrareVoce2} />
        <Stack.Screen name="Cards" component={CardsHolderPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
