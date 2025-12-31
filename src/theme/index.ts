// App Theme - Dark mode optimized for battery monitoring
export const theme = {
  colors: {
    // Base colors
    background: '#0d0d0d',
    surface: '#1a1a1a',
    surfaceLight: '#252525',
    card: '#1f1f1f',
    
    // Text colors
    text: '#ffffff',
    textSecondary: '#a0a0a0',
    textMuted: '#666666',
    
    // Status colors
    primary: '#00d4aa',
    primaryDark: '#00a88a',
    secondary: '#3498db',
    
    // Battery status
    batteryFull: '#00d4aa',
    batteryGood: '#2ecc71',
    batteryMedium: '#f39c12',
    batteryLow: '#e74c3c',
    batteryCritical: '#c0392b',
    
    // Charge/Discharge
    charging: '#00d4aa',
    discharging: '#e74c3c',
    idle: '#a0a0a0',
    
    // Cell balance
    cellBalanced: '#2ecc71',
    cellImbalanced: '#f39c12',
    cellDanger: '#e74c3c',
    
    // Protection/Warning
    warning: '#f39c12',
    error: '#e74c3c',
    success: '#2ecc71',
    info: '#3498db',
    
    // UI elements
    border: '#333333',
    divider: '#2a2a2a',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  
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

export type Theme = typeof theme;
export default theme;
