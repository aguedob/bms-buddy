import React, { useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Theme } from '../../theme';
import { ProtectionStatus } from '../../types/bms';
import { hasActiveProtection, getActiveProtections } from '../../utils/bmsParser';

interface ProtectionStatusProps {
  status: ProtectionStatus;
  chargeMosEnabled: boolean;
  dischargeMosEnabled: boolean;
}

export const ProtectionStatusCard: React.FC<ProtectionStatusProps> = ({
  status,
  chargeMosEnabled,
  dischargeMosEnabled,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const hasProtection = hasActiveProtection(status);
  const activeProtections = getActiveProtections(status);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Protection Status</Text>
        {hasProtection ? (
          <View style={[styles.statusBadge, styles.errorBadge]}>
            <Ionicons name="warning" size={12} color={theme.colors.text} />
            <Text style={styles.statusText}>Active</Text>
          </View>
        ) : (
          <View style={[styles.statusBadge, styles.okBadge]}>
            <Ionicons name="checkmark-circle" size={12} color={theme.colors.text} />
            <Text style={styles.statusText}>OK</Text>
          </View>
        )}
      </View>

      {/* MOS Status */}
      <View style={styles.mosContainer}>
        <View style={styles.mosItem}>
          <View
            style={[
              styles.mosIndicator,
              { backgroundColor: chargeMosEnabled ? theme.colors.success : theme.colors.error },
            ]}
          />
          <Text style={styles.mosLabel}>Charge MOS</Text>
          <Text style={[styles.mosStatus, { color: chargeMosEnabled ? theme.colors.success : theme.colors.error }]}>
            {chargeMosEnabled ? 'ON' : 'OFF'}
          </Text>
        </View>
        <View style={styles.mosItem}>
          <View
            style={[
              styles.mosIndicator,
              { backgroundColor: dischargeMosEnabled ? theme.colors.success : theme.colors.error },
            ]}
          />
          <Text style={styles.mosLabel}>Discharge MOS</Text>
          <Text style={[styles.mosStatus, { color: dischargeMosEnabled ? theme.colors.success : theme.colors.error }]}>
            {dischargeMosEnabled ? 'ON' : 'OFF'}
          </Text>
        </View>
      </View>

      {/* Active Protections */}
      {hasProtection && (
        <View style={styles.protectionList}>
          <Text style={styles.protectionTitle}>Active Protections:</Text>
          {activeProtections.map((protection, index) => (
            <View key={index} style={styles.protectionItem}>
              <Ionicons name="alert-circle" size={14} color={theme.colors.error} />
              <Text style={styles.protectionText}>{protection}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Protection Grid */}
      <View style={styles.protectionGrid}>
        <ProtectionItem
          label="Cell OV"
          active={status.cellOvervoltage}
          description="Cell Overvoltage"
        />
        <ProtectionItem
          label="Cell UV"
          active={status.cellUndervoltage}
          description="Cell Undervoltage"
        />
        <ProtectionItem
          label="Pack OV"
          active={status.packOvervoltage}
          description="Pack Overvoltage"
        />
        <ProtectionItem
          label="Pack UV"
          active={status.packUndervoltage}
          description="Pack Undervoltage"
        />
        <ProtectionItem
          label="CHG OT"
          active={status.chargeOvertemperature}
          description="Charge Over Temp"
        />
        <ProtectionItem
          label="CHG UT"
          active={status.chargeUndertemperature}
          description="Charge Under Temp"
        />
        <ProtectionItem
          label="DSG OT"
          active={status.dischargeOvertemperature}
          description="Discharge Over Temp"
        />
        <ProtectionItem
          label="DSG UT"
          active={status.dischargeUndertemperature}
          description="Discharge Under Temp"
        />
        <ProtectionItem
          label="CHG OC"
          active={status.chargeOvercurrent}
          description="Charge Overcurrent"
        />
        <ProtectionItem
          label="DSG OC"
          active={status.dischargeOvercurrent}
          description="Discharge Overcurrent"
        />
        <ProtectionItem
          label="SHORT"
          active={status.shortCircuit}
          description="Short Circuit"
        />
        <ProtectionItem
          label="IC ERR"
          active={status.icError}
          description="IC Error"
        />
      </View>
    </View>
  );
};

interface ProtectionItemProps {
  label: string;
  active: boolean;
  description: string;
}

const ProtectionItem: React.FC<ProtectionItemProps> = ({ label, active, description }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <TouchableOpacity style={styles.protectionGridItem}>
      <View
        style={[
          styles.protectionIndicator,
          { backgroundColor: active ? theme.colors.error : theme.colors.success },
        ]}
      />
      <Text style={styles.protectionGridLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  okBadge: {
    backgroundColor: theme.colors.success,
  },
  errorBadge: {
    backgroundColor: theme.colors.error,
  },
  statusText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    marginLeft: theme.spacing.xs,
  },
  mosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.divider,
  },
  mosItem: {
    alignItems: 'center',
  },
  mosIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: theme.spacing.xs,
  },
  mosLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  mosStatus: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  protectionList: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
  },
  protectionTitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  protectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  protectionText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.sm,
    marginLeft: theme.spacing.xs,
  },
  protectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.md,
    justifyContent: 'space-between',
  },
  protectionGridItem: {
    width: '24%',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  protectionIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginBottom: theme.spacing.xs,
  },
  protectionGridLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default ProtectionStatusCard;
