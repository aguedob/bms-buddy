import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BMSProvider } from './src/context/BMSContext';
import { ThemeProvider, useTheme } from './src/theme';
import AppNavigator from './src/navigation/AppNavigator';

function AppContent() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <BMSProvider>
          <AppContent />
        </BMSProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
