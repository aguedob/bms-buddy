import React, { useCallback, useRef, useEffect } from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  useNavigationState,
} from '@react-navigation/native';
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { DashboardScreen, CellsScreen, SettingsScreen } from '../screens';
import { CustomTabBar } from '../components';
import { useTheme } from '../theme';
import { useFocusEffect } from '@react-navigation/native';

const Tab = createBottomTabNavigator();
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Track navigation direction globally
let lastTabIndex = 0;
let currentDirection: 'left' | 'right' = 'right';

const TAB_INDICES: Record<string, number> = {
  Dashboard: 0,
  Cells: 1,
  Settings: 2,
};

// HOC to wrap screens with slide animation
const withSlideAnimation = (WrappedComponent: React.ComponentType<any>, screenName: string) => {
  return (props: any) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const screenIndex = TAB_INDICES[screenName];

    useFocusEffect(
      useCallback(() => {
        // Determine direction based on previous tab
        const direction = screenIndex > lastTabIndex ? 'left' : screenIndex < lastTabIndex ? 'right' : 'none';
        
        // Set starting position
        if (direction === 'left') {
          translateX.setValue(SCREEN_WIDTH);
        } else if (direction === 'right') {
          translateX.setValue(-SCREEN_WIDTH);
        } else {
          translateX.setValue(0);
        }

        // Animate to center
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 68,
          friction: 12,
        }).start();

        // Update last index after animation starts
        lastTabIndex = screenIndex;

        return () => {
          // No cleanup needed
        };
      }, [])
    );

    return (
      <Animated.View
        style={[
          styles.screenContainer,
          { transform: [{ translateX }] },
        ]}
      >
        <WrappedComponent {...props} />
      </Animated.View>
    );
  };
};

// Create animated versions of each screen
const AnimatedDashboard = withSlideAnimation(DashboardScreen, 'Dashboard');
const AnimatedCells = withSlideAnimation(CellsScreen, 'Cells');
const AnimatedSettings = withSlideAnimation(SettingsScreen, 'Settings');

export const AppNavigator: React.FC = () => {
  const { theme, isDark } = useTheme();

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    dark: isDark,
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.error,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tab.Screen name="Dashboard" component={AnimatedDashboard} />
        <Tab.Screen name="Cells" component={AnimatedCells} />
        <Tab.Screen name="Settings" component={AnimatedSettings} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
});

export default AppNavigator;
