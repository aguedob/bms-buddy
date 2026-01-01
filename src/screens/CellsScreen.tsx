import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBMS } from '../context/BMSContext';
import { CellVoltageGrid, CustomHeader } from '../components';
import { useTheme, Theme } from '../theme';
import { useI18n } from '../i18n';
import { LIFEPO4_CELL_VOLTAGES } from '../constants/bms';

export const CellsScreen: React.FC = () => {
  const { bmsData, connectionStatus } = useBMS();
  const { theme } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { basicInfo, cellInfo } = bmsData;

  if (connectionStatus !== 'connected' || !cellInfo || !basicInfo) {
    return (
      <View style={styles.screenContainer}>
        <CustomHeader
          title={t.cells.cellVoltages}
          subtitle={t.cells.monitorCells}
          icon="grid"
          iconColor={theme.colors.secondary}
        />
        <View style={styles.emptyContainer}>
          <Ionicons name="grid-outline" size={64} color={theme.colors.textMuted} />
          <Text style={styles.emptyText}>{t.cells.noCellData}</Text>
          <Text style={styles.emptySubtext}>
            {t.cells.connectToView}
          </Text>
        </View>
      </View>
    );
  }

  // Calculate balance status
  const isBalancing = basicInfo.balanceStatus !== 0 || basicInfo.balanceStatusHigh !== 0;
  const balancingCells = [];
  for (let i = 0; i < 16; i++) {
    if ((basicInfo.balanceStatus & (1 << i)) !== 0) {
      balancingCells.push(i + 1);
    }
  }
  for (let i = 0; i < 16; i++) {
    if ((basicInfo.balanceStatusHigh & (1 << i)) !== 0) {
      balancingCells.push(i + 17);
    }
  }

  return (
    <View style={styles.screenContainer}>
      <CustomHeader
        title={t.cells.cellVoltages}
        subtitle={`${basicInfo.cellCount}S • Δ ${(cellInfo.voltageDelta * 1000).toFixed(0)}mV`}
        icon="grid"
        iconColor={theme.colors.secondary}
      />
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}>
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{t.cells.cellSummary}</Text>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t.cells.cells}</Text>
            <Text style={styles.summaryValue}>{basicInfo.cellCount}S</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t.cells.total}</Text>
            <Text style={styles.summaryValue}>{basicInfo.totalVoltage.toFixed(2)} V</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t.cells.average}</Text>
            <Text style={styles.summaryValue}>{cellInfo.averageVoltage.toFixed(3)} V</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t.cells.delta}</Text>
            <Text style={[
              styles.summaryValue,
              { color: cellInfo.voltageDelta > 0.05 ? theme.colors.warning : theme.colors.success }
            ]}>
              {(cellInfo.voltageDelta * 1000).toFixed(0)} mV
            </Text>
          </View>
        </View>

        {/* Balance Status */}
        <View style={styles.balanceStatus}>
          <View style={styles.balanceHeader}>
            <Ionicons
              name={isBalancing ? 'sync' : 'checkmark-circle'}
              size={20}
              color={isBalancing ? theme.colors.warning : theme.colors.success}
            />
            <Text style={[
              styles.balanceText,
              { color: isBalancing ? theme.colors.warning : theme.colors.success }
            ]}>
              {isBalancing ? t.cells.balancingActive : t.cells.cellsBalanced}
            </Text>
          </View>
          {isBalancing && balancingCells.length > 0 && (
            <Text style={styles.balancingCells}>
              {t.cells.balancingCells}: {balancingCells.join(', ')}
            </Text>
          )}
        </View>
      </View>

      {/* Cell Voltages */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.cells.cellVoltages}</Text>
        <View style={styles.card}>
          <CellVoltageGrid
            cellVoltages={cellInfo.cellVoltages}
            balanceStatus={basicInfo.balanceStatus}
            maxVoltageCell={cellInfo.maxVoltageCell}
            minVoltageCell={cellInfo.minVoltageCell}
          />
        </View>
      </View>

      {/* Cell Details Table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.cells.detailedView}</Text>
        <View style={styles.card}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.cellColumn]}>{t.cells.cell}</Text>
            <Text style={[styles.tableHeaderText, styles.voltageColumn]}>{t.cells.voltage}</Text>
            <Text style={[styles.tableHeaderText, styles.deviationColumn]}>{t.cells.deviation}</Text>
            <Text style={[styles.tableHeaderText, styles.statusColumn]}>{t.cells.status}</Text>
          </View>
          
          {cellInfo.cellVoltages.map((voltage, index) => {
            const deviation = voltage - cellInfo.averageVoltage;
            const isBalancingCell = (basicInfo.balanceStatus & (1 << index)) !== 0;
            const status = getCellStatus(voltage, theme);
            
            return (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.cellColumn]}>
                  #{index + 1}
                </Text>
                <Text style={[styles.tableCell, styles.voltageColumn, { fontWeight: theme.fontWeight.semibold }]}>
                  {voltage.toFixed(3)} V
                </Text>
                <Text style={[
                  styles.tableCell,
                  styles.deviationColumn,
                  { color: deviation > 0 ? theme.colors.warning : deviation < 0 ? theme.colors.info : theme.colors.text }
                ]}>
                  {deviation >= 0 ? '+' : ''}{(deviation * 1000).toFixed(0)} mV
                </Text>
                <View style={[styles.statusColumn, styles.statusCell]}>
                  {isBalancingCell && (
                    <View style={styles.balancingBadge}>
                      <Text style={styles.balancingBadgeText}>BAL</Text>
                    </View>
                  )}
                  <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Reference Voltages */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.cells.lifePo4Reference}</Text>
        <View style={styles.card}>
          <View style={styles.referenceItem}>
            <Text style={styles.referenceLabel}>{t.cells.fullCharge}</Text>
            <Text style={styles.referenceValue}>{LIFEPO4_CELL_VOLTAGES.FULL} V</Text>
          </View>
          <View style={styles.referenceItem}>
            <Text style={styles.referenceLabel}>{t.cells.nominal}</Text>
            <Text style={styles.referenceValue}>{LIFEPO4_CELL_VOLTAGES.NOMINAL} V</Text>
          </View>
          <View style={styles.referenceItem}>
            <Text style={styles.referenceLabel}>{t.cells.empty}</Text>
            <Text style={styles.referenceValue}>{LIFEPO4_CELL_VOLTAGES.EMPTY} V</Text>
          </View>
          <View style={styles.referenceItem}>
            <Text style={[styles.referenceLabel, { color: theme.colors.warning }]}>{t.cells.highWarning}</Text>
            <Text style={[styles.referenceValue, { color: theme.colors.warning }]}>{LIFEPO4_CELL_VOLTAGES.HIGH} V</Text>
          </View>
          <View style={styles.referenceItem}>
            <Text style={[styles.referenceLabel, { color: theme.colors.error }]}>{t.cells.lowWarning}</Text>
            <Text style={[styles.referenceValue, { color: theme.colors.error }]}>{LIFEPO4_CELL_VOLTAGES.LOW} V</Text>
          </View>
        </View>
      </View>
    </ScrollView>
    </View>
  );
};

function getCellStatus(voltage: number, theme: Theme): { status: string; color: string } {
  if (voltage >= LIFEPO4_CELL_VOLTAGES.HIGH) {
    return { status: 'High', color: theme.colors.warning };
  }
  if (voltage <= LIFEPO4_CELL_VOLTAGES.LOW) {
    return { status: 'Low', color: theme.colors.error };
  }
  if (voltage >= LIFEPO4_CELL_VOLTAGES.NOMINAL) {
    return { status: 'Good', color: theme.colors.success };
  }
  return { status: 'OK', color: theme.colors.batteryMedium };
}

const createStyles = (theme: Theme) => StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  summaryCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  summaryTitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: theme.spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  summaryLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.bold,
    marginTop: theme.spacing.xs,
  },
  balanceStatus: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    marginLeft: theme.spacing.xs,
  },
  balancingCells: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  section: {
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
    marginBottom: theme.spacing.sm,
  },
  tableHeaderText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  tableCell: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  cellColumn: {
    width: '15%',
  },
  voltageColumn: {
    width: '35%',
  },
  deviationColumn: {
    width: '25%',
  },
  statusColumn: {
    width: '25%',
    alignItems: 'flex-end',
  },
  statusCell: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  balancingBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.xs,
  },
  balancingBadgeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.background,
    fontWeight: theme.fontWeight.bold,
  },
  referenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  referenceLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  referenceValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
  },
});

export default CellsScreen;
