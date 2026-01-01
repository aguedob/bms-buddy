import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTheme, Theme } from '../../theme';
import { LIFEPO4_CELL_VOLTAGES } from '../../constants/bms';

interface CellVoltageBarProps {
  cellNumber: number;
  voltage: number;
  isBalancing?: boolean;
  isHighest?: boolean;
  isLowest?: boolean;
}

export const CellVoltageBar: React.FC<CellVoltageBarProps> = ({
  cellNumber,
  voltage,
  isBalancing = false,
  isHighest = false,
  isLowest = false,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Calculate percentage within LiFePO4 range
  const minV = LIFEPO4_CELL_VOLTAGES.EMPTY;
  const maxV = LIFEPO4_CELL_VOLTAGES.FULL;
  const percentage = Math.min(100, Math.max(0, ((voltage - minV) / (maxV - minV)) * 100));
  
  // Determine color based on voltage
  const getColor = () => {
    if (voltage >= LIFEPO4_CELL_VOLTAGES.HIGH) return theme.colors.warning;
    if (voltage <= LIFEPO4_CELL_VOLTAGES.LOW) return theme.colors.error;
    if (voltage >= LIFEPO4_CELL_VOLTAGES.NOMINAL) return theme.colors.batteryGood;
    return theme.colors.batteryMedium;
  };

  const barColor = getColor();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.cellInfo}>
          <Text style={styles.cellLabel}>Cell {cellNumber}</Text>
          {isBalancing && (
            <View style={styles.balancingBadge}>
              <Text style={styles.balancingText}>BAL</Text>
            </View>
          )}
          {isHighest && (
            <View style={[styles.badge, { backgroundColor: theme.colors.warning }]}>
              <Text style={styles.badgeText}>HIGH</Text>
            </View>
          )}
          {isLowest && (
            <View style={[styles.badge, { backgroundColor: theme.colors.info }]}>
              <Text style={styles.badgeText}>LOW</Text>
            </View>
          )}
        </View>
        <Text style={[styles.voltage, { color: barColor }]}>
          {voltage.toFixed(3)} V
        </Text>
      </View>
      
      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <View
            style={[
              styles.barFill,
              {
                width: `${percentage}%`,
                backgroundColor: barColor,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

interface CellVoltageGridProps {
  cellVoltages: number[];
  balanceStatus?: number;
  maxVoltageCell?: number;
  minVoltageCell?: number;
}

export const CellVoltageGrid: React.FC<CellVoltageGridProps> = ({
  cellVoltages,
  balanceStatus = 0,
  maxVoltageCell,
  minVoltageCell,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.grid}>
      {cellVoltages.map((voltage, index) => (
        <CellVoltageBar
          key={index}
          cellNumber={index + 1}
          voltage={voltage}
          isBalancing={(balanceStatus & (1 << index)) !== 0}
          isHighest={maxVoltageCell === index + 1}
          isLowest={minVoltageCell === index + 1}
        />
      ))}
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  cellInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cellLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  voltage: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  balancingBadge: {
    marginLeft: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
  },
  balancingText: {
    fontSize: theme.fontSize.xs,
    color: theme.isDark ? theme.colors.background : '#ffffff',
    fontWeight: theme.fontWeight.bold,
  },
  badge: {
    marginLeft: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  badgeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.bold,
  },
  barContainer: {
    position: 'relative',
    height: 24,
  },
  barBackground: {
    height: 16,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  grid: {
    gap: theme.spacing.sm,
  },
});

export default CellVoltageGrid;
