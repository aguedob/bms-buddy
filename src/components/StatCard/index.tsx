import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import theme from '../../theme';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  color?: string;
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  icon,
  color = theme.colors.primary,
  subtitle,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.valueContainer}>
        <Text style={[styles.value, { color }]}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

interface StatRowProps {
  children: React.ReactNode;
}

export const StatRow: React.FC<StatRowProps> = ({ children }) => {
  return <View style={styles.row}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  iconContainer: {
    marginRight: theme.spacing.xs,
  },
  label: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
  },
  unit: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
});

export default StatCard;
