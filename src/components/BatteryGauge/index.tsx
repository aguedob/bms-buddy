import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme, Theme } from '../../theme';

interface BatteryGaugeProps {
  percentage: number;
  voltage: number;
  current: number;
  size?: number;
}

export const BatteryGauge: React.FC<BatteryGaugeProps> = ({
  percentage,
  voltage,
  current,
  size = 220,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  
  // Calculate arc for 270 degrees (3/4 circle)
  const arcLength = circumference * 0.75;
  const progressLength = (percentage / 100) * arcLength;
  const dashOffset = arcLength - progressLength;
  
  // Rotation to start from bottom-left
  const rotation = 135;
  
  // Determine color based on percentage
  const getColor = () => {
    if (percentage >= 80) return theme.colors.batteryFull;
    if (percentage >= 50) return theme.colors.batteryGood;
    if (percentage >= 25) return theme.colors.batteryMedium;
    if (percentage >= 10) return theme.colors.batteryLow;
    return theme.colors.batteryCritical;
  };

  // Determine charge status
  const isCharging = current > 0.1;
  const isDischarging = current < -0.1;
  const chargeStatus = isCharging ? 'Charging' : isDischarging ? 'Discharging' : 'Idle';
  const chargeColor = isCharging ? theme.colors.charging : isDischarging ? theme.colors.discharging : theme.colors.idle;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={getColor()} stopOpacity="0.6" />
            <Stop offset="100%" stopColor={getColor()} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        
        {/* Background arc */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={theme.colors.surfaceLight}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${center} ${center})`}
        />
        
        {/* Progress arc */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#gaugeGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${progressLength} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${center} ${center})`}
        />
        
        {/* Inner glow effect */}
        <Circle
          cx={center}
          cy={center}
          r={radius - 20}
          stroke={getColor()}
          strokeWidth={1}
          fill="none"
          opacity={0.2}
        />
      </Svg>
      
      {/* Center content */}
      <View style={styles.centerContent}>
        <Text style={[styles.percentage, { color: getColor() }]}>
          {Math.round(percentage)}%
        </Text>
        <Text style={styles.voltage}>{voltage.toFixed(2)} V</Text>
        <View style={styles.currentContainer}>
          <View style={[styles.statusDot, { backgroundColor: chargeColor }]} />
          <Text style={[styles.current, { color: chargeColor }]}>
            {Math.abs(current).toFixed(2)} A
          </Text>
        </View>
        <Text style={[styles.chargeStatus, { color: chargeColor }]}>
          {chargeStatus}
        </Text>
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    fontSize: theme.fontSize.giant,
    fontWeight: theme.fontWeight.bold,
  },
  voltage: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
    marginTop: theme.spacing.xs,
  },
  currentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
  },
  current: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
  },
  chargeStatus: {
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing.xs,
  },
});

export default BatteryGauge;
