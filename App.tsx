import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BMSProvider } from './src/context/BMSContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <BMSProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </BMSProvider>
    </SafeAreaProvider>
  );
}
