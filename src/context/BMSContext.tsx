import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bmsService from '../services/bleService';
import { parseProtectionStatus } from '../utils/bmsParser';
import {
  BMSData,
  BMSBasicInfo,
  BMSCellInfo,
  BMSDeviceInfo,
  ScannedDevice,
  ConnectionStatus,
  ProtectionStatus,
} from '../types/bms';

interface BMSContextType {
  // Connection state
  connectionStatus: ConnectionStatus;
  scannedDevices: ScannedDevice[];
  connectedDevice: BMSDeviceInfo | null;
  
  // BMS data
  bmsData: BMSData;
  
  // Actions
  startScan: () => Promise<void>;
  stopScan: () => void;
  connect: (deviceId: string) => Promise<boolean>;
  disconnect: (clearSavedDevice?: boolean) => Promise<void>;
  refreshData: () => Promise<void>;
  setAutoRefresh: (enabled: boolean, interval?: number) => void;
  
  // Auto-reconnect state
  isAutoReconnecting: boolean;
  savedDeviceName: string | null;
  
  // Custom battery name
  customBatteryName: string | null;
  setBatteryName: (name: string) => Promise<void>;
  writeBMSDeviceName: (name: string) => Promise<boolean>;
  
  // Auto refresh state
  autoRefreshEnabled: boolean;
  autoRefreshInterval: number;
}

const defaultBMSData: BMSData = {
  basicInfo: null,
  cellInfo: null,
  deviceInfo: null,
  protectionDetails: null,
  lastUpdate: null,
  isLoading: false,
  error: null,
};

const BMSContext = createContext<BMSContextType | null>(null);

const STORAGE_KEYS = {
  LAST_DEVICE_ID: '@BMS_LAST_DEVICE_ID',
  LAST_DEVICE_NAME: '@BMS_LAST_DEVICE_NAME',
  CUSTOM_BATTERY_NAME: '@BMS_CUSTOM_BATTERY_NAME',
};

export const useBMS = () => {
  const context = useContext(BMSContext);
  if (!context) {
    throw new Error('useBMS must be used within a BMSProvider');
  }
  return context;
};

interface BMSProviderProps {
  children: React.ReactNode;
}

export const BMSProvider: React.FC<BMSProviderProps> = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [scannedDevices, setScannedDevices] = useState<ScannedDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<BMSDeviceInfo | null>(null);
  const [bmsData, setBmsData] = useState<BMSData>(defaultBMSData);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [autoRefreshInterval, setAutoRefreshIntervalState] = useState(2000);
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const [isAppActive, setIsAppActive] = useState(true);
  const [isAutoReconnecting, setIsAutoReconnecting] = useState(false);
  const [savedDeviceName, setSavedDeviceName] = useState<string | null>(null);
  const [customBatteryName, setCustomBatteryName] = useState<string | null>(null);
  const savedDeviceRef = useRef<{ id: string; name: string } | null>(null);
  const autoReconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize BLE on mount and attempt auto-reconnect
  useEffect(() => {
    const initAndReconnect = async () => {
      await bmsService.initialize();
      
      // Load custom battery name
      try {
        const savedCustomName = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_BATTERY_NAME);
        if (savedCustomName) {
          setCustomBatteryName(savedCustomName);
        }
      } catch (e) {
        console.log('Failed to load custom battery name:', e);
      }
      
      // Try to auto-reconnect to last device
      try {
        const savedDeviceId = await AsyncStorage.getItem(STORAGE_KEYS.LAST_DEVICE_ID);
        const deviceName = await AsyncStorage.getItem(STORAGE_KEYS.LAST_DEVICE_NAME);
        
        if (savedDeviceId) {
          const name = deviceName || 'Unknown BMS';
          savedDeviceRef.current = { id: savedDeviceId, name };
          setSavedDeviceName(name);
          console.log('Found saved device, attempting auto-reconnect:', savedDeviceId);
          setIsAutoReconnecting(true);
          setConnectionStatus('connecting');
          
          // Set a 15-second timeout for auto-reconnect
          autoReconnectTimeoutRef.current = setTimeout(() => {
            if (isAutoReconnecting) {
              console.log('Auto-reconnect timed out after 15 seconds');
              setIsAutoReconnecting(false);
              setConnectionStatus('disconnected');
              bmsService.disconnect();
            }
          }, 15000);
          
          const success = await bmsService.connect(savedDeviceId);
          
          // Clear the timeout if connection completed
          if (autoReconnectTimeoutRef.current) {
            clearTimeout(autoReconnectTimeoutRef.current);
            autoReconnectTimeoutRef.current = null;
          }
          
          if (success) {
            console.log('Auto-reconnect successful');
            setConnectedDevice({
              id: savedDeviceId,
              name,
              rssi: -100,
              isConnected: true,
            });
            setConnectionStatus('connected');
            
            // Enable auto-refresh after reconnect
            setAutoRefreshEnabled(true);
          } else {
            console.log('Auto-reconnect failed - device may be out of range');
            setConnectionStatus('disconnected');
          }
          setIsAutoReconnecting(false);
        }
      } catch (error) {
        console.log('Auto-reconnect error:', error);
        if (autoReconnectTimeoutRef.current) {
          clearTimeout(autoReconnectTimeoutRef.current);
        }
        setIsAutoReconnecting(false);
        setConnectionStatus('disconnected');
      }
    };
    
    initAndReconnect();
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (autoReconnectTimeoutRef.current) {
        clearTimeout(autoReconnectTimeoutRef.current);
      }
      bmsService.destroy();
    };
  }, []);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        console.log('App came to foreground');
        setIsAppActive(true);
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background
        console.log('App went to background');
        setIsAppActive(false);
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  // Auto refresh effect - only when app is active
  useEffect(() => {
    if (autoRefreshEnabled && connectionStatus === 'connected' && isAppActive) {
      refreshIntervalRef.current = setInterval(() => {
        refreshData();
      }, autoRefreshInterval);
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefreshEnabled, autoRefreshInterval, connectionStatus, isAppActive]);

  const startScan = useCallback(async () => {
    setConnectionStatus('scanning');
    setScannedDevices([]);
    
    try {
      await bmsService.scanForDevices((device) => {
        setScannedDevices(prev => {
          if (prev.some(d => d.id === device.id)) {
            return prev;
          }
          return [...prev, device];
        });
      }, 15000);
      
      setConnectionStatus('disconnected');
    } catch (error) {
      console.error('Scan error:', error);
      setConnectionStatus('error');
    }
  }, []);

  const stopScan = useCallback(() => {
    bmsService.stopScan();
    setConnectionStatus('disconnected');
  }, []);

  const connect = useCallback(async (deviceId: string): Promise<boolean> => {
    setConnectionStatus('connecting');
    setBmsData(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const success = await bmsService.connect(deviceId);
      
      if (success) {
        const device = scannedDevices.find(d => d.id === deviceId);
        const deviceName = device?.name || 'Unknown BMS';
        
        setConnectedDevice({
          id: deviceId,
          name: deviceName,
          rssi: device?.rssi || -100,
          isConnected: true,
        });
        setConnectionStatus('connected');
        
        // Save device for auto-reconnect
        try {
          await AsyncStorage.setItem(STORAGE_KEYS.LAST_DEVICE_ID, deviceId);
          await AsyncStorage.setItem(STORAGE_KEYS.LAST_DEVICE_NAME, deviceName);
          console.log('Saved device for auto-reconnect:', deviceId);
        } catch (e) {
          console.log('Failed to save device:', e);
        }
        
        // Initial data read
        await refreshData();
        
        return true;
      } else {
        setConnectionStatus('error');
        setBmsData(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to connect to BMS',
        }));
        return false;
      }
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionStatus('error');
      setBmsData(prev => ({
        ...prev,
        isLoading: false,
        error: 'Connection error',
      }));
      return false;
    }
  }, [scannedDevices]);

  const disconnect = useCallback(async (clearSavedDevice: boolean = false) => {
    setAutoRefreshEnabled(false);
    await bmsService.disconnect();
    setConnectedDevice(null);
    setConnectionStatus('disconnected');
    setBmsData(defaultBMSData);
    
    if (clearSavedDevice) {
      try {
        await AsyncStorage.removeItem(STORAGE_KEYS.LAST_DEVICE_ID);
        await AsyncStorage.removeItem(STORAGE_KEYS.LAST_DEVICE_NAME);
        console.log('Cleared saved device');
      } catch (e) {
        console.log('Failed to clear saved device:', e);
      }
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (!bmsService.isConnected()) {
      return;
    }

    setBmsData(prev => ({ ...prev, isLoading: true }));

    try {
      const { basicInfo, cellInfo } = await bmsService.readAllData();

      let protectionDetails: ProtectionStatus | null = null;
      if (basicInfo) {
        protectionDetails = parseProtectionStatus(basicInfo.protectionStatus);
      }

      setBmsData(prev => ({
        ...prev,
        basicInfo,
        cellInfo,
        protectionDetails,
        lastUpdate: new Date(),
        isLoading: false,
        error: basicInfo ? null : 'Failed to read BMS data',
      }));
    } catch (error) {
      console.error('Refresh error:', error);
      setBmsData(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to refresh data',
      }));
    }
  }, []);

  const setAutoRefresh = useCallback((enabled: boolean, interval?: number) => {
    setAutoRefreshEnabled(enabled);
    if (interval) {
      setAutoRefreshIntervalState(interval);
    }
  }, []);

  const setBatteryName = useCallback(async (name: string) => {
    const trimmedName = name.trim();
    setCustomBatteryName(trimmedName || null);
    try {
      if (trimmedName) {
        await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_BATTERY_NAME, trimmedName);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.CUSTOM_BATTERY_NAME);
      }
    } catch (e) {
      console.log('Failed to save custom battery name:', e);
    }
  }, []);

  const writeBMSDeviceName = useCallback(async (name: string): Promise<boolean> => {
    if (connectionStatus !== 'connected') {
      console.log('Cannot write BMS name: not connected');
      return false;
    }
    
    try {
      const success = await bmsService.writeDeviceName(name);
      if (success) {
        // Update the connected device name locally as well
        setConnectedDevice(prev => prev ? { ...prev, name } : null);
        // Also update saved device name for auto-reconnect
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_DEVICE_NAME, name);
      }
      return success;
    } catch (error) {
      console.error('Failed to write BMS device name:', error);
      return false;
    }
  }, [connectionStatus]);

  const value: BMSContextType = {
    connectionStatus,
    scannedDevices,
    connectedDevice,
    bmsData,
    startScan,
    stopScan,
    connect,
    disconnect,
    refreshData,
    setAutoRefresh,
    autoRefreshEnabled,
    autoRefreshInterval,
    isAutoReconnecting,
    savedDeviceName,
    customBatteryName,
    setBatteryName,
    writeBMSDeviceName,
  };

  return <BMSContext.Provider value={value}>{children}</BMSContext.Provider>;
};

export default BMSProvider;
