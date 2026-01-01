import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BMSProvider } from './src/context/BMSContext';
import { ThemeProvider, useTheme } from './src/theme';
import { I18nProvider } from './src/i18n';
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
      <I18nProvider>
        <ThemeProvider>
          <BMSProvider>
            <AppContent />
          </BMSProvider>
        </ThemeProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
