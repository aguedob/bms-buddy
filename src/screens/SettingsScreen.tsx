import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBMS } from '../context/BMSContext';
import { useTheme, Theme, ThemeMode } from '../theme';
import { useI18n, supportedLanguages, SupportedLanguage } from '../i18n';
import { CustomHeader } from '../components';
import { BuyMeCoffeeIcon } from '../components/icons/BuyMeCoffeeIcon';
import { ScannedDevice } from '../types/bms';

export const SettingsScreen: React.FC = () => {
  const { theme, themeMode, setThemeMode } = useTheme();
  const { language, setLanguage, t } = useI18n();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
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
    writeBMSDeviceName,
  } = useBMS();

  const [isScanning, setIsScanning] = useState(false);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [newBatteryName, setNewBatteryName] = useState('');
  const [isWritingName, setIsWritingName] = useState(false);

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

  const handleOpenRenameModal = useCallback(() => {
    setNewBatteryName(connectedDevice?.name || '');
    setIsRenameModalVisible(true);
  }, [connectedDevice]);

  const handleSaveName = useCallback(async () => {
    if (!newBatteryName.trim()) {
      Alert.alert('Invalid Name', 'Please enter a name for the battery.');
      return;
    }
    
    setIsWritingName(true);
    try {
      const success = await writeBMSDeviceName(newBatteryName.trim());
      if (success) {
        Alert.alert(
          'Success',
          'Battery name updated! You may need to reconnect to see the new name in other apps.',
          [{ text: 'OK', onPress: () => setIsRenameModalVisible(false) }]
        );
      } else {
        Alert.alert('Failed', 'Could not update name. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while updating the name.');
    } finally {
      setIsWritingName(false);
    }
  }, [newBatteryName, writeBMSDeviceName]);

  const handleCancelRename = useCallback(() => {
    setIsRenameModalVisible(false);
    setNewBatteryName('');
  }, []);

  const displayName = connectedDevice?.name || 'Unknown BMS';

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
    <View style={styles.screenContainer}>
      <CustomHeader
        title={t.settings.settings}
        subtitle={t.settings.connectionAndPreferences}
        icon="settings"
        iconColor={theme.colors.textSecondary}
      />
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}>
      {/* Connection Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.bluetoothConnection}</Text>
        
        {connectionStatus === 'connected' && connectedDevice ? (
          <View style={styles.connectedCard}>
            <View style={styles.connectedHeader}>
              <View style={styles.connectedStatus}>
                <View style={styles.statusDot} />
                <Text style={styles.connectedLabel}>{t.common.connected}</Text>
              </View>
              <TouchableOpacity onPress={handleDisconnect}>
                <Text style={styles.disconnectText}>{t.common.disconnect}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.connectedInfo}>
              <Ionicons name="hardware-chip" size={40} color={theme.colors.primary} />
              <View style={styles.connectedDetails}>
                <TouchableOpacity 
                  style={styles.nameContainer}
                  onPress={handleOpenRenameModal}
                >
                  <Text style={styles.connectedName}>{displayName}</Text>
                  <Ionicons name="pencil" size={16} color={theme.colors.textSecondary} style={styles.editIcon} />
                </TouchableOpacity>
                <Text style={styles.connectedId}>{connectedDevice.id}</Text>
              </View>
            </View>

            {bmsData.basicInfo && (
              <View style={styles.deviceStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>{t.settings.firmware}</Text>
                  <Text style={styles.statValue}>v{bmsData.basicInfo.softwareVersion}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>{t.cells.cells}</Text>
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
                    {t.settings.reconnecting}
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
                      <Text style={styles.scanButtonText}>
                        {scannedDevices.length === 0 
                          ? t.settings.scanning 
                          : t.settings.bmsFound.replace('{{count}}', String(scannedDevices.length))}
                      </Text>
                    </>
                  ) : connectionStatus === 'connecting' ? (
                    <>
                      <ActivityIndicator color={theme.colors.text} size="small" />
                      <Text style={styles.scanButtonText}>{t.common.connecting}</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="bluetooth" size={20} color={theme.colors.text} />
                      <Text style={styles.scanButtonText}>{t.settings.scanForBMS}</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                <Text style={styles.scanHint}>
                  {isScanning && scannedDevices.length > 0 
                    ? t.settings.tapToConnect
                    : t.settings.scanHint}
                </Text>
              </>
            )}
          </View>
        )}
      </View>

      {/* Discovered Devices */}
      {scannedDevices.length > 0 && connectionStatus !== 'connected' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.discoveredDevices}</Text>
          <View style={styles.deviceList}>
            {scannedDevices.map(renderDeviceItem)}
          </View>
        </View>
      )}

      {/* Auto Refresh Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.dataRefresh}</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t.settings.autoRefresh}</Text>
              <Text style={styles.settingDescription}>
                {t.settings.autoRefreshDescription.replace('{{seconds}}', String(autoRefreshInterval / 1000))}
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
            <Text style={styles.intervalLabel}>{t.settings.refreshInterval}</Text>
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

      {/* Appearance Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.appearance}</Text>
        <View style={styles.settingsCard}>
          <Text style={styles.settingLabel}>{t.settings.theme}</Text>
          <Text style={styles.settingDescription}>
            {t.settings.themeDescription}
          </Text>
          <View style={styles.themeSelector}>
            {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.themeButton,
                  themeMode === mode && styles.themeButtonActive,
                ]}
                onPress={() => setThemeMode(mode)}
              >
                <Ionicons
                  name={
                    mode === 'system' ? 'phone-portrait-outline' :
                    mode === 'light' ? 'sunny-outline' : 'moon-outline'
                  }
                  size={20}
                  color={themeMode === mode ? (theme.isDark ? theme.colors.text : '#ffffff') : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.themeButtonText,
                    themeMode === mode && styles.themeButtonTextActive,
                  ]}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Language Selector */}
        <View style={[styles.settingsCard, { marginTop: theme.spacing.md }]}>
          <Text style={styles.settingLabel}>{t.settings.language}</Text>
          <View style={styles.themeSelector}>
            {supportedLanguages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.themeButton,
                  language === lang.code && styles.themeButtonActive,
                ]}
                onPress={() => setLanguage(lang.code)}
              >
                <Text
                  style={[
                    styles.themeButtonText,
                    language === lang.code && styles.themeButtonTextActive,
                  ]}
                >
                  {lang.nativeName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.about}</Text>
        <View style={styles.aboutCard}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>{t.settings.appVersion}</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>{t.settings.bmsProtocol}</Text>
            <Text style={styles.aboutValue}>JBD/Xiaoxiang</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>{t.settings.batteryType}</Text>
            <Text style={styles.aboutValue}>LiFePO4 4S</Text>
          </View>
        </View>
      </View>

      {/* Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.tips}</Text>
        <View style={styles.tipCard}>
          <Ionicons name="information-circle" size={20} color={theme.colors.info} />
          <Text style={styles.tipText}>
            {t.settings.tipText}
          </Text>
        </View>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.support.supportProject}</Text>
        <View style={styles.supportCard}>
          <Text style={styles.supportText}>
            {t.support.supportDescription}
          </Text>
          
          <TouchableOpacity
            style={styles.coffeeButton}
            onPress={() => Linking.openURL('https://buymeacoffee.com/aguedob')}
            activeOpacity={0.8}
          >
            <BuyMeCoffeeIcon size={20} color="#000000" />
            <Text style={styles.coffeeButtonText}>{t.support.buyMeCoffee}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.githubButton}
            onPress={() => Linking.openURL('https://github.com/aguedob/bms-buddy')}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-github" size={20} color={theme.colors.text} />
            <Text style={styles.githubButtonText}>{t.support.viewOnGitHub}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rateButton}
            onPress={() => {
              const storeUrl = Platform.OS === 'ios'
                ? 'https://apps.apple.com/app/bms-buddy/id123456789'
                : 'https://play.google.com/store/apps/details?id=com.bmsbuddy';
              Linking.openURL(storeUrl);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="star" size={20} color="#FFD700" />
            <Text style={styles.rateButtonText}>{t.support.rateApp}</Text>
          </TouchableOpacity>
          
          <Text style={styles.supportFooter}>
            {t.support.supportFooter}
          </Text>
        </View>
      </View>

      {/* Rename Modal */}
      <Modal
        visible={isRenameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelRename}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t.settings.renameBattery}</Text>
              <Text style={styles.modalSubtitle}>
                {t.settings.renameHint}
              </Text>
              <TextInput
                style={styles.modalInput}
                value={newBatteryName}
                onChangeText={setNewBatteryName}
                placeholder={t.settings.namePlaceholder}
                placeholderTextColor={theme.colors.textMuted}
                autoFocus
                maxLength={16}
                editable={!isWritingName}
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
              />
            
              {isWritingName ? (
                <View style={styles.writingContainer}>
                  <ActivityIndicator color={theme.colors.primary} />
                  <Text style={styles.writingText}>{t.settings.updatingName}</Text>
                </View>
              ) : (
                <>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.modalButtonCancel]}
                      onPress={handleCancelRename}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.modalButtonCancelText}>{t.common.cancel}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.modalButtonSave]}
                      onPress={handleSaveName}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.modalButtonSaveText}>{t.common.save}</Text>
                    </TouchableOpacity>
                  </View>
                
                  <Text style={styles.writeHint}>
                    {t.settings.renameBluetoothHint}
                  </Text>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectedName: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
  },
  editIcon: {
    marginLeft: theme.spacing.xs,
  },
  connectedId: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  originalName: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
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
    color: theme.isDark ? theme.colors.text : '#ffffff',
    fontWeight: theme.fontWeight.medium,
  },
  themeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  themeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
  },
  themeButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  themeButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  themeButtonTextActive: {
    color: theme.isDark ? theme.colors.text : '#ffffff',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  modalInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: theme.colors.surface,
  },
  modalButtonSave: {
    backgroundColor: theme.colors.primary,
  },
  modalButtonCancelText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  modalButtonSaveText: {
    fontSize: theme.fontSize.md,
    color: theme.isDark ? theme.colors.text : '#ffffff',
    fontWeight: theme.fontWeight.medium,
  },
  writeToBmsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  writeToBmsText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
    marginLeft: theme.spacing.xs,
  },
  writeHint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    lineHeight: 16,
  },
  writingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  writingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  clearNameButton: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  clearNameText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
  },
  supportCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  supportText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  coffeeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFDD00',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    width: '100%',
  },
  coffeeButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: '#000000',
    marginLeft: theme.spacing.sm,
  },
  githubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    width: '100%',
  },
  githubButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    width: '100%',
  },
  rateButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  supportFooter: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});

export default SettingsScreen;
