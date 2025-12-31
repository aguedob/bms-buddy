import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import theme from '../../theme';

interface TemperatureGaugeProps {
  temperature: number;
  label?: string;
  size?: number;
}

export const TemperatureGauge: React.FC<TemperatureGaugeProps> = ({
  temperature,
  label = 'Temperature',
  size = 80,
}) => {
  // Temperature range: -20°C to 60°C
  const minTemp = -20;
  const maxTemp = 60;
  const range = maxTemp - minTemp;
  const percentage = Math.min(100, Math.max(0, ((temperature - minTemp) / range) * 100));
  
  // Color based on temperature
  const getColor = () => {
    if (temperature < 0) return theme.colors.info;
    if (temperature < 10) return theme.colors.secondary;
    if (temperature < 35) return theme.colors.success;
    if (temperature < 45) return theme.colors.warning;
    return theme.colors.error;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.gaugeContainer, { width: size, height: size }]}>
        <View style={[styles.gauge, { backgroundColor: getColor() }]}>
          <Text style={styles.tempValue}>{Math.round(temperature)}°</Text>
        </View>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

interface TemperatureListProps {
  temperatures: number[];
}

export const TemperatureList: React.FC<TemperatureListProps> = ({ temperatures }) => {
  const labels = ['BMS', 'Cell 1', 'Cell 2', 'Cell 3', 'Cell 4', 'Ambient'];
  
  return (
    <View style={styles.listContainer}>
      <Text style={styles.sectionTitle}>Temperatures</Text>
      <View style={styles.tempGrid}>
        {temperatures.map((temp, index) => (
          <TemperatureGauge
            key={index}
            temperature={temp}
            label={labels[index] || `Sensor ${index + 1}`}
            size={70}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    margin: theme.spacing.sm,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gauge: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tempValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  label: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  listContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  tempGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});

export default TemperatureGauge;
