import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBMS } from '../context/BMSContext';
import theme from '../theme';
import { ScannedDevice } from '../types/bms';

export const SettingsScreen: React.FC = () => {
  const {
    connectionStatus,
    scannedDevices,
    connectedDevice,
    bmsData,
    startScan,
    stopScan,
    connect,
    disconnect,
    autoRefreshEnabled,
    autoRefreshInterval,
    setAutoRefresh,
    isAutoReconnecting,
  } = useBMS();

  const [isScanning, setIsScanning] = useState(false);

  const handleScan = useCallback(async () => {
    setIsScanning(true);
    try {
      await startScan();
    } catch (error) {
      Alert.alert('Scan Error', 'Failed to scan for devices. Please ensure Bluetooth is enabled.');
    } finally {
      setIsScanning(false);
    }
  }, [startScan]);

  const handleConnect = useCallback(async (device: ScannedDevice) => {
    const success = await connect(device.id);
    if (!success) {
      Alert.alert('Connection Failed', 'Could not connect to the BMS device. Please try again.');
    }
  }, [connect]);

  const handleDisconnect = useCallback(async () => {
    Alert.alert(
      'Disconnect',
      'Are you sure you want to disconnect from the BMS?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Disconnect', 
          onPress: () => disconnect(false) 
        },
        { 
          text: 'Forget Device', 
          style: 'destructive', 
          onPress: () => disconnect(true) 
        },
      ]
    );
  }, [disconnect]);

  const renderDeviceItem = (device: ScannedDevice) => {
    const isConnecting = connectionStatus === 'connecting';
    
    return (
      <TouchableOpacity
        key={device.id}
        style={styles.deviceItem}
        onPress={() => handleConnect(device)}
        disabled={isConnecting}
      >
        <View style={styles.deviceInfo}>
          <Ionicons name="hardware-chip-outline" size={24} color={theme.colors.primary} />
          <View style={styles.deviceText}>
            <Text style={styles.deviceName}>{device.name || 'Unknown BMS'}</Text>
            <Text style={styles.deviceId}>{device.id}</Text>
          </View>
        </View>
        <View style={styles.deviceMeta}>
          <View style={styles.rssiContainer}>
            <Ionicons
              name="wifi"
              size={14}
              color={device.rssi > -70 ? theme.colors.success : device.rssi > -85 ? theme.colors.warning : theme.colors.error}
            />
            <Text style={styles.rssiText}>{device.rssi} dBm</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Connection Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bluetooth Connection</Text>
        
        {connectionStatus === 'connected' && connectedDevice ? (
          <View style={styles.connectedCard}>
            <View style={styles.connectedHeader}>
              <View style={styles.connectedStatus}>
                <View style={styles.statusDot} />
                <Text style={styles.connectedLabel}>Connected</Text>
              </View>
              <TouchableOpacity onPress={handleDisconnect}>
                <Text style={styles.disconnectText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.connectedInfo}>
              <Ionicons name="hardware-chip" size={40} color={theme.colors.primary} />
              <View style={styles.connectedDetails}>
                <Text style={styles.connectedName}>{connectedDevice.name}</Text>
                <Text style={styles.connectedId}>{connectedDevice.id}</Text>
              </View>
            </View>

            {bmsData.basicInfo && (
              <View style={styles.deviceStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Firmware</Text>
                  <Text style={styles.statValue}>v{bmsData.basicInfo.softwareVersion}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Cells</Text>
                  <Text style={styles.statValue}>{bmsData.basicInfo.cellCount}S</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>NTC</Text>
                  <Text style={styles.statValue}>{bmsData.basicInfo.ntcCount}</Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.scanCard}>
            {isAutoReconnecting ? (
              <>
                <View style={styles.autoReconnectingContainer}>
                  <ActivityIndicator color={theme.colors.primary} size="large" />
                  <Text style={styles.autoReconnectingText}>
                    Reconnecting to last device...
                  </Text>
                </View>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
                  onPress={isScanning ? stopScan : handleScan}
                  disabled={connectionStatus === 'connecting'}
                >
                  {isScanning ? (
                    <>
                      <ActivityIndicator color={theme.colors.text} size="small" />
                      <Text style={styles.scanButtonText}>Scanning...</Text>
                    </>
                  ) : connectionStatus === 'connecting' ? (
                    <>
                      <ActivityIndicator color={theme.colors.text} size="small" />
                      <Text style={styles.scanButtonText}>Connecting...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="bluetooth" size={20} color={theme.colors.text} />
                      <Text style={styles.scanButtonText}>Scan for BMS</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                <Text style={styles.scanHint}>
                  Make sure your BMS is powered on and Bluetooth is enabled
                </Text>
              </>
            )}
          </View>
        )}
      </View>

      {/* Discovered Devices */}
      {scannedDevices.length > 0 && connectionStatus !== 'connected' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discovered Devices</Text>
          <View style={styles.deviceList}>
            {scannedDevices.map(renderDeviceItem)}
          </View>
        </View>
      )}

      {/* Auto Refresh Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Refresh</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto Refresh</Text>
              <Text style={styles.settingDescription}>
                Automatically update BMS data every {autoRefreshInterval / 1000}s
              </Text>
            </View>
            <Switch
              value={autoRefreshEnabled}
              onValueChange={(value) => setAutoRefresh(value)}
              trackColor={{ false: theme.colors.surface, true: theme.colors.primaryDark }}
              thumbColor={autoRefreshEnabled ? theme.colors.primary : theme.colors.textMuted}
            />
          </View>

          <View style={styles.intervalSelector}>
            <Text style={styles.intervalLabel}>Refresh Interval</Text>
            <View style={styles.intervalButtons}>
              {[1000, 2000, 5000, 10000].map((interval) => (
                <TouchableOpacity
                  key={interval}
                  style={[
                    styles.intervalButton,
                    autoRefreshInterval === interval && styles.intervalButtonActive,
                  ]}
                  onPress={() => setAutoRefresh(autoRefreshEnabled, interval)}
                >
                  <Text
                    style={[
                      styles.intervalButtonText,
                      autoRefreshInterval === interval && styles.intervalButtonTextActive,
                    ]}
                  >
                    {interval / 1000}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutCard}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>App Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>BMS Protocol</Text>
            <Text style={styles.aboutValue}>JBD/Xiaoxiang</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Battery Type</Text>
            <Text style={styles.aboutValue}>LiFePO4 4S</Text>
          </View>
        </View>
      </View>

      {/* Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tips</Text>
        <View style={styles.tipCard}>
          <Ionicons name="information-circle" size={20} color={theme.colors.info} />
          <Text style={styles.tipText}>
            The JBD Smart BMS should appear as "xiaoxiang" or similar in the device list. 
            Make sure the BMS is active (battery voltage present) for successful connection.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
  },
  connectedCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  connectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  connectedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.success,
    marginRight: theme.spacing.xs,
  },
  connectedLabel: {
    color: theme.colors.success,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
  disconnectText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.md,
  },
  connectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectedDetails: {
    marginLeft: theme.spacing.md,
  },
  connectedName: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
  },
  connectedId: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  deviceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  statValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
    marginTop: theme.spacing.xs,
  },
  scanCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  scanButtonDisabled: {
    backgroundColor: theme.colors.surface,
  },
  scanButtonText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    marginLeft: theme.spacing.sm,
  },
  scanHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  deviceList: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  deviceName: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  deviceId: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  deviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rssiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  rssiText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  settingsCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  settingLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  settingDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  intervalSelector: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  intervalLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  intervalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  intervalButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  intervalButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  intervalButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  intervalButtonTextActive: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  aboutCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  aboutLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  aboutValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  tipCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    lineHeight: 20,
  },
  autoReconnectingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  autoReconnectingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
});

export default SettingsScreen;
