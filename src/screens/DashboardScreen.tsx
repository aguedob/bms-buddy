import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBMS } from '../context/BMSContext';
import {
  BatteryGauge,
  CellVoltageGrid,
  StatCard,
  StatRow,
  ProtectionStatusCard,
  TemperatureList,
} from '../components';
import { useTheme, Theme } from '../theme';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const {
    connectionStatus,
    connectedDevice,
    bmsData,
    refreshData,
    setAutoRefresh,
    autoRefreshEnabled,
    disconnect,
    isAutoReconnecting,
    savedDeviceName,
  } = useBMS();

  const { basicInfo, cellInfo, protectionDetails } = bmsData;
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  
  // Display name: device name > saved name > fallback
  const displayName = connectedDevice?.name || savedDeviceName || 'BMS';

  useEffect(() => {
    // Enable auto refresh when dashboard is active
    if (connectionStatus === 'connected') {
      setAutoRefresh(true, 2000);
    }

    return () => {
      setAutoRefresh(false);
    };
  }, [connectionStatus]);

  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    await refreshData();
    setIsManualRefreshing(false);
  };

  if (connectionStatus !== 'connected' || !basicInfo) {
    // Show connecting animation when auto-reconnecting to saved device
    // Also show it when connected but still loading initial data
    if (isAutoReconnecting && savedDeviceName) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.connectingAnimation}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <View style={styles.pulseRing} />
          </View>
          <Text style={styles.connectingText}>Connecting to BMS...</Text>
          <Text style={styles.connectingDeviceName}>{displayName}</Text>
          <Text style={styles.connectingHint}>
            Please make sure your BMS is powered on and nearby
          </Text>
        </View>
      );
    }
    
    // Show loading state when connected but waiting for initial data
    if (connectionStatus === 'connected' && !basicInfo) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.connectingAnimation}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <View style={styles.pulseRing} />
          </View>
          <Text style={styles.connectingText}>Loading BMS Data...</Text>
          <Text style={styles.connectingDeviceName}>{displayName}</Text>
          <Text style={styles.connectingHint}>
            Reading battery information
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="battery-dead-outline" size={64} color={theme.colors.textMuted} />
        <Text style={styles.emptyText}>No BMS Connected</Text>
        <Text style={styles.emptySubtext}>
          Go to Settings to connect to your BMS device
        </Text>
        <TouchableOpacity
          style={styles.connectButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="bluetooth" size={20} color={theme.colors.text} />
          <Text style={styles.connectButtonText}>Connect BMS</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isManualRefreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.deviceInfo}>
          <View style={styles.statusIndicator} />
          <Text style={styles.deviceName}>{displayName}</Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} disabled={isManualRefreshing}>
          <Ionicons name="refresh" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Main Battery Gauge */}
      <View style={styles.gaugeContainer}>
        <BatteryGauge
          percentage={basicInfo.soc}
          voltage={basicInfo.totalVoltage}
          current={basicInfo.current}
          size={240}
        />
      </View>

      {/* Quick Stats */}
      <StatRow>
        <StatCard
          label="Capacity"
          value={basicInfo.remainingCapacity.toFixed(1)}
          unit="Ah"
          color={theme.colors.primary}
          subtitle={`of ${basicInfo.nominalCapacity.toFixed(1)} Ah`}
        />
        <StatCard
          label="Power"
          value={Math.abs(basicInfo.current * basicInfo.totalVoltage).toFixed(0)}
          unit="W"
          color={basicInfo.current >= 0 ? theme.colors.charging : theme.colors.discharging}
          subtitle={basicInfo.current >= 0 ? 'Charging' : 'Discharging'}
        />
      </StatRow>

      <StatRow>
        <StatCard
          label="Cycles"
          value={basicInfo.cycleCount}
          color={theme.colors.info}
        />
        <StatCard
          label="Cells"
          value={basicInfo.cellCount}
          unit="S"
          color={theme.colors.secondary}
          subtitle="LiFePO4"
        />
      </StatRow>

      {/* Cell Voltages */}
      {cellInfo && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cell Voltages</Text>
            <View style={styles.cellStats}>
              <Text style={styles.cellStat}>
                Δ {(cellInfo.voltageDelta * 1000).toFixed(0)} mV
              </Text>
            </View>
          </View>
          <View style={styles.card}>
            <CellVoltageGrid
              cellVoltages={cellInfo.cellVoltages}
              balanceStatus={basicInfo.balanceStatus}
              maxVoltageCell={cellInfo.maxVoltageCell}
              minVoltageCell={cellInfo.minVoltageCell}
            />
            <View style={styles.cellSummary}>
              <View style={styles.cellSummaryItem}>
                <Text style={styles.cellSummaryLabel}>Average</Text>
                <Text style={styles.cellSummaryValue}>
                  {cellInfo.averageVoltage.toFixed(3)} V
                </Text>
              </View>
              <View style={styles.cellSummaryItem}>
                <Text style={styles.cellSummaryLabel}>Max</Text>
                <Text style={[styles.cellSummaryValue, { color: theme.colors.warning }]}>
                  {cellInfo.maxVoltage.toFixed(3)} V
                </Text>
              </View>
              <View style={styles.cellSummaryItem}>
                <Text style={styles.cellSummaryLabel}>Min</Text>
                <Text style={[styles.cellSummaryValue, { color: theme.colors.info }]}>
                  {cellInfo.minVoltage.toFixed(3)} V
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Temperature */}
      {basicInfo.temperatures.length > 0 && (
        <View style={styles.section}>
          <TemperatureList temperatures={basicInfo.temperatures} />
        </View>
      )}

      {/* Protection Status */}
      {protectionDetails && (
        <View style={styles.section}>
          <ProtectionStatusCard
            status={protectionDetails}
            chargeMosEnabled={basicInfo.chargeMosEnabled}
            dischargeMosEnabled={basicInfo.dischargeMosEnabled}
          />
        </View>
      )}

      {/* Last Update */}
      <View style={styles.footer}>
        <Text style={styles.lastUpdate}>
          Last updated: {bmsData.lastUpdate?.toLocaleTimeString() || 'Never'}
        </Text>
        {autoRefreshEnabled && (
          <View style={styles.autoRefreshIndicator}>
            <View style={styles.pulsingDot} />
            <Text style={styles.autoRefreshText}>Auto-refresh</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
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
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.xl,
  },
  connectButtonText: {
    color: theme.isDark ? theme.colors.text : '#ffffff',
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    marginLeft: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.success,
    marginRight: theme.spacing.sm,
  },
  deviceName: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  gaugeContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  section: {
    marginTop: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
  },
  cellStats: {
    flexDirection: 'row',
  },
  cellStat: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  cellSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  cellSummaryItem: {
    alignItems: 'center',
  },
  cellSummaryLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  cellSummaryValue: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
    marginTop: theme.spacing.xs,
  },
  footer: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
  },
  lastUpdate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  autoRefreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
    marginRight: theme.spacing.xs,
  },
  autoRefreshText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  connectingAnimation: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    opacity: 0.3,
  },
  connectingText: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
  },
  connectingDeviceName: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
    marginBottom: theme.spacing.lg,
  },
  connectingHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
});

export default DashboardScreen;
