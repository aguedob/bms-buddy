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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBMS } from '../context/BMSContext';
import {
  BatteryGauge,
  StatCard,
  StatRow,
  ProtectionStatusCard,
  TemperatureList,
  CustomHeader,
} from '../components';
import { useTheme, Theme } from '../theme';
import { useI18n } from '../i18n';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
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

  const { basicInfo, protectionDetails } = bmsData;
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
          <Text style={styles.connectingText}>{t.dashboard.connectingToBMS}</Text>
          <Text style={styles.connectingDeviceName}>{displayName}</Text>
          <Text style={styles.connectingHint}>
            {t.dashboard.connectingHint}
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
          <Text style={styles.connectingText}>{t.dashboard.loadingBMSData}</Text>
          <Text style={styles.connectingDeviceName}>{displayName}</Text>
          <Text style={styles.connectingHint}>
            {t.dashboard.readingBatteryInfo}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="battery-dead-outline" size={64} color={theme.colors.textMuted} />
        <Text style={styles.emptyText}>{t.dashboard.noBMSConnected}</Text>
        <Text style={styles.emptySubtext}>
          {t.dashboard.goToSettings}
        </Text>
        <TouchableOpacity
          style={styles.connectButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="bluetooth" size={20} color={theme.colors.text} />
          <Text style={styles.connectButtonText}>{t.dashboard.connectBMS}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <CustomHeader
        title={displayName}
        subtitle={connectionStatus === 'connected' ? t.common.connected : t.common.disconnected}
        icon="battery-charging"
        iconColor={theme.colors.primary}
        rightIcon={isManualRefreshing ? undefined : "refresh"}
        onRightPress={handleRefresh}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}
        refreshControl={
          <RefreshControl
            refreshing={isManualRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
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
          label={t.dashboard.capacity}
          value={basicInfo.remainingCapacity.toFixed(1)}
          unit="Ah"
          color={theme.colors.primary}
          subtitle={t.dashboard.ofCapacity.replace('{{capacity}}', basicInfo.nominalCapacity.toFixed(1))}
        />
        <StatCard
          label={t.dashboard.power}
          value={Math.abs(basicInfo.current * basicInfo.totalVoltage).toFixed(0)}
          unit="W"
          color={basicInfo.current >= 0 ? theme.colors.charging : theme.colors.discharging}
          subtitle={basicInfo.current >= 0 ? t.common.charging : t.common.discharging}
        />
      </StatRow>

      {/* Time Estimate - only show when discharging */}
      {basicInfo.current < -0.1 && (
        <StatRow>
          <StatCard
            label={t.dashboard.timeToEmpty}
            value={(() => {
              const hoursRemaining = basicInfo.remainingCapacity / Math.abs(basicInfo.current);
              if (hoursRemaining > 24) {
                return `${Math.floor(hoursRemaining / 24)}d ${Math.floor(hoursRemaining % 24)}h`;
              } else if (hoursRemaining >= 1) {
                const hours = Math.floor(hoursRemaining);
                const minutes = Math.round((hoursRemaining - hours) * 60);
                return `${hours}h ${minutes}m`;
              } else {
                return `${Math.round(hoursRemaining * 60)}m`;
              }
            })()}
            color={theme.colors.warning}
            subtitle={t.dashboard.atCurrentDraw.replace('{{current}}', Math.abs(basicInfo.current).toFixed(1))}
          />
          <StatCard
            label={t.dashboard.energyLeft}
            value={(basicInfo.remainingCapacity * basicInfo.totalVoltage).toFixed(0)}
            unit="Wh"
            color={theme.colors.info}
            subtitle={t.dashboard.percentRemaining.replace('{{percent}}', String(basicInfo.soc))}
          />
        </StatRow>
      )}

      <StatRow>
        <StatCard
          label={t.dashboard.cycles}
          value={basicInfo.cycleCount}
          color={theme.colors.info}
        />
        <StatCard
          label={t.cells.cells}
          value={basicInfo.cellCount}
          unit="S"
          color={theme.colors.secondary}
          subtitle="LiFePO4"
        />
      </StatRow>

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
          {t.dashboard.lastUpdated}: {bmsData.lastUpdate?.toLocaleTimeString() || t.common.never}
        </Text>
        {autoRefreshEnabled && (
          <View style={styles.autoRefreshIndicator}>
            <View style={styles.pulsingDot} />
            <Text style={styles.autoRefreshText}>{t.settings.autoRefresh}</Text>
          </View>
        )}
      </View>
    </ScrollView>
    </View>
  );
};

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
