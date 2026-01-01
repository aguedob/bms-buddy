import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  background: string;
  surface: string;
  surfaceLight: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryDark: string;
  secondary: string;
  batteryFull: string;
  batteryGood: string;
  batteryMedium: string;
  batteryLow: string;
  batteryCritical: string;
  charging: string;
  discharging: string;
  idle: string;
  cellBalanced: string;
  cellImbalanced: string;
  cellDanger: string;
  warning: string;
  error: string;
  success: string;
  info: string;
  border: string;
  divider: string;
  overlay: string;
}

export interface Theme {
  colors: ThemeColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
    giant: number;
  };
  fontWeight: {
    normal: '400';
    medium: '500';
    semibold: '600';
    bold: '700';
  };
  isDark: boolean;
}

const darkColors: ThemeColors = {
  background: '#0d0d0d',
  surface: '#1a1a1a',
  surfaceLight: '#252525',
  card: '#1f1f1f',
  text: '#ffffff',
  textSecondary: '#a0a0a0',
  textMuted: '#666666',
  primary: '#00d4aa',
  primaryDark: '#00a88a',
  secondary: '#3498db',
  batteryFull: '#00d4aa',
  batteryGood: '#00d4aa',
  batteryMedium: '#f39c12',
  batteryLow: '#e74c3c',
  batteryCritical: '#c0392b',
  charging: '#00d4aa',
  discharging: '#e74c3c',
  idle: '#a0a0a0',
  cellBalanced: '#00d4aa',
  cellImbalanced: '#f39c12',
  cellDanger: '#e74c3c',
  warning: '#f39c12',
  error: '#e74c3c',
  success: '#00d4aa',
  info: '#3498db',
  border: '#333333',
  divider: '#2a2a2a',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

const lightColors: ThemeColors = {
  background: '#f5f5f7',
  surface: '#ffffff',
  surfaceLight: '#f0f0f0',
  card: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#666666',
  textMuted: '#999999',
  primary: '#00a88a',
  primaryDark: '#008870',
  secondary: '#2980b9',
  batteryFull: '#00a88a',
  batteryGood: '#00a88a',
  batteryMedium: '#e67e22',
  batteryLow: '#c0392b',
  batteryCritical: '#922b21',
  charging: '#00a88a',
  discharging: '#c0392b',
  idle: '#666666',
  cellBalanced: '#00a88a',
  cellImbalanced: '#e67e22',
  cellDanger: '#c0392b',
  warning: '#e67e22',
  error: '#c0392b',
  success: '#00a88a',
  info: '#2980b9',
  border: '#e0e0e0',
  divider: '#eeeeee',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

const sharedStyles = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 28,
    xxxl: 36,
    giant: 48,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const darkTheme: Theme = {
  colors: darkColors,
  ...sharedStyles,
  isDark: true,
};

export const lightTheme: Theme = {
  colors: lightColors,
  ...sharedStyles,
  isDark: false,
};

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = '@BMS_THEME_MODE';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Use Appearance API directly for more reliable system theme detection
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>(() => {
    const scheme = Appearance.getColorScheme();
    console.log('[ThemeProvider] Initial system color scheme:', scheme);
    return scheme || 'light';
  });
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Listen for system color scheme changes
  useEffect(() => {
    // Re-check on mount in case initial value was wrong
    const currentScheme = Appearance.getColorScheme();
    console.log('[ThemeProvider] Checking system color scheme on mount:', currentScheme);
    if (currentScheme) {
      setSystemColorScheme(currentScheme);
    }
    
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      console.log('[ThemeProvider] System color scheme changed to:', colorScheme);
      setSystemColorScheme(colorScheme || 'light');
    });
    
    return () => subscription.remove();
  }, []);

  // Load saved theme preference
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setThemeModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.log('Failed to load theme mode:', error);
      }
      setIsLoaded(true);
    };
    loadThemeMode();
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    } catch (error) {
      console.log('Failed to save theme mode:', error);
    }
  }, []);

  // Determine the actual theme based on mode and system preference
  const isDark = themeMode === 'system' 
    ? systemColorScheme === 'dark' 
    : themeMode === 'dark';

  console.log('[ThemeProvider] Theme calculation:', { themeMode, systemColorScheme, isDark });

  const theme = isDark ? darkTheme : lightTheme;

  const value: ThemeContextType = {
    theme,
    themeMode,
    setThemeMode,
    isDark,
  };

  // Don't render until we've loaded the saved preference to avoid flash
  if (!isLoaded) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;
