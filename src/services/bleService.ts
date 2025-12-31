// BLE Service for JBD/Xiaoxiang Smart BMS
// Handles Bluetooth Low Energy communication

import { BleManager, Device, Characteristic, State } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import {
  BMS_SERVICE_UUID,
  BMS_WRITE_CHARACTERISTIC_UUID,
  BMS_NOTIFY_CHARACTERISTIC_UUID,
  BMS_SERVICE_UUID_ALT,
  BMS_CHARACTERISTIC_UUID_ALT,
  BMS_COMMANDS,
  BMS_NAME_PATTERNS,
} from '../constants/bms';
import { ScannedDevice, BMSBasicInfo, BMSCellInfo } from '../types/bms';
import {
  parseBasicInfo,
  parseCellVoltages,
  base64ToUint8Array,
  uint8ArrayToBase64,
  bytesToHex,
} from '../utils/bmsParser';

class BMSBleService {
  private manager: BleManager;
  private connectedDevice: Device | null = null;
  private writeCharacteristic: Characteristic | null = null;
  private notifyCharacteristic: Characteristic | null = null;
  private responseBuffer: Uint8Array = new Uint8Array(0);
  private onDataCallback: ((data: Uint8Array) => void) | null = null;
  private isInitialized: boolean = false;
  private scanSubscription: any = null;
  private monitorSubscription: any = null;
  private serviceUUID: string = BMS_SERVICE_UUID;
  private writeCharUUID: string = BMS_WRITE_CHARACTERISTIC_UUID;
  private notifyCharUUID: string = BMS_NOTIFY_CHARACTERISTIC_UUID;
  private useWriteWithoutResponse: boolean = false;

  constructor() {
    this.manager = new BleManager();
  }

  /**
   * Initialize BLE and request permissions
   */
  async initialize(): Promise<boolean> {
    try {
      // Request permissions on Android
      if (Platform.OS === 'android') {
        const granted = await this.requestAndroidPermissions();
        if (!granted) {
          console.log('Bluetooth permissions not granted');
          return false;
        }
      }

      // Check if Bluetooth is powered on
      const state = await this.manager.state();
      if (state !== State.PoweredOn) {
        console.log('Bluetooth is not powered on, current state:', state);
        
        // Wait for Bluetooth to be powered on
        return new Promise((resolve) => {
          const subscription = this.manager.onStateChange((newState) => {
            if (newState === State.PoweredOn) {
              subscription.remove();
              this.isInitialized = true;
              resolve(true);
            }
          }, true);

          // Timeout after 10 seconds
          setTimeout(() => {
            subscription.remove();
            resolve(false);
          }, 10000);
        });
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing BLE:', error);
      return false;
    }
  }

  /**
   * Request Android Bluetooth permissions
   */
  private async requestAndroidPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const apiLevel = Platform.Version;

      if (apiLevel >= 31) {
        // Android 12+
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        return (
          results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === 'granted' &&
          results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === 'granted' &&
          results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === 'granted'
        );
      } else {
        // Android 11 and below
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return result === 'granted';
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Check if a device name matches BMS patterns
   */
  private isBMSDevice(name: string | null): boolean {
    if (!name) return false;
    const lowerName = name.toLowerCase();
    return BMS_NAME_PATTERNS.some(pattern => lowerName.includes(pattern));
  }

  /**
   * Scan for BMS devices
   */
  async scanForDevices(
    onDeviceFound: (device: ScannedDevice) => void,
    duration: number = 10000
  ): Promise<void> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize Bluetooth');
      }
    }

    const discoveredIds = new Set<string>();

    return new Promise((resolve, reject) => {
      try {
        this.scanSubscription = this.manager.startDeviceScan(
          [BMS_SERVICE_UUID, BMS_SERVICE_UUID_ALT],
          { allowDuplicates: false },
          (error, device) => {
            if (error) {
              console.error('Scan error:', error);
              return;
            }

            if (device && !discoveredIds.has(device.id)) {
              // Accept devices with matching service UUIDs or BMS-like names
              const hasServiceUUID = device.serviceUUIDs?.some(
                uuid => uuid.toLowerCase().includes('ff00') || uuid.toLowerCase().includes('ffe0')
              );
              
              if (hasServiceUUID || this.isBMSDevice(device.name)) {
                discoveredIds.add(device.id);
                onDeviceFound({
                  id: device.id,
                  name: device.name,
                  rssi: device.rssi || -100,
                  serviceUUIDs: device.serviceUUIDs,
                });
              }
            }
          }
        );

        // Stop scanning after duration
        setTimeout(() => {
          this.stopScan();
          resolve();
        }, duration);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop scanning for devices
   */
  stopScan(): void {
    if (this.scanSubscription) {
      this.manager.stopDeviceScan();
      this.scanSubscription = null;
    }
  }

  /**
   * Connect to a BMS device
   */
  async connect(deviceId: string): Promise<boolean> {
    try {
      console.log('Connecting to device:', deviceId);

      // Disconnect if already connected
      if (this.connectedDevice) {
        await this.disconnect();
      }

      // Connect to device
      const device = await this.manager.connectToDevice(deviceId, {
        timeout: 10000,
      });

      console.log('Connected, discovering services...');

      // Discover services and characteristics
      await device.discoverAllServicesAndCharacteristics();

      // Find the correct service and characteristics
      const services = await device.services();
      console.log('Services found:', services.map(s => s.uuid));

      let foundService = false;

      for (const service of services) {
        const serviceUuidLower = service.uuid.toLowerCase();
        
        if (serviceUuidLower.includes('ff00')) {
          this.serviceUUID = service.uuid;
          this.writeCharUUID = BMS_WRITE_CHARACTERISTIC_UUID;
          this.notifyCharUUID = BMS_NOTIFY_CHARACTERISTIC_UUID;
          foundService = true;
          break;
        } else if (serviceUuidLower.includes('ffe0')) {
          this.serviceUUID = service.uuid;
          this.writeCharUUID = BMS_CHARACTERISTIC_UUID_ALT;
          this.notifyCharUUID = BMS_CHARACTERISTIC_UUID_ALT;
          foundService = true;
          break;
        }
      }

      if (!foundService) {
        console.log('BMS service not found');
        await device.cancelConnection();
        return false;
      }

      // Get characteristics
      const characteristics = await device.characteristicsForService(this.serviceUUID);
      console.log('Characteristics:', characteristics.map(c => ({
        uuid: c.uuid,
        isWritableWithResponse: c.isWritableWithResponse,
        isWritableWithoutResponse: c.isWritableWithoutResponse,
        isNotifiable: c.isNotifiable,
        isIndicatable: c.isIndicatable,
      })));

      for (const char of characteristics) {
        const charUuidLower = char.uuid.toLowerCase();
        
        // Check for write characteristic (ff02 or ffe1)
        if (charUuidLower.includes('ff02') || charUuidLower.includes('ffe1')) {
          if (char.isWritableWithoutResponse || char.isWritableWithResponse) {
            this.writeCharacteristic = char;
            // Prefer write without response for JBD BMS
            this.useWriteWithoutResponse = char.isWritableWithoutResponse;
            console.log('Write characteristic found:', char.uuid, 'useWriteWithoutResponse:', this.useWriteWithoutResponse);
          }
        }
        // Check for notify characteristic (ff01 or ffe1)
        if (charUuidLower.includes('ff01') || charUuidLower.includes('ffe1')) {
          if (char.isNotifiable || char.isIndicatable) {
            this.notifyCharacteristic = char;
            console.log('Notify characteristic found:', char.uuid);
          }
        }
      }

      // For single characteristic BMS (ffe1), use same for read/write
      if (!this.writeCharacteristic && this.notifyCharacteristic) {
        this.writeCharacteristic = this.notifyCharacteristic;
      }

      if (!this.writeCharacteristic || !this.notifyCharacteristic) {
        console.log('Required characteristics not found');
        await device.cancelConnection();
        return false;
      }

      // Setup notification handler
      await this.setupNotifications();

      this.connectedDevice = device;
      console.log('Successfully connected to BMS');
      
      return true;
    } catch (error) {
      console.error('Connection error:', error);
      return false;
    }
  }

  /**
   * Setup notifications to receive data from BMS
   */
  private async setupNotifications(): Promise<void> {
    if (!this.notifyCharacteristic) return;

    this.monitorSubscription = this.notifyCharacteristic.monitor((error, characteristic) => {
      if (error) {
        console.error('Notification error:', error);
        return;
      }

      if (characteristic?.value) {
        const data = base64ToUint8Array(characteristic.value);
        console.log('Received data:', bytesToHex(data));
        this.handleReceivedData(data);
      }
    });
  }

  /**
   * Handle received data from BMS
   */
  private handleReceivedData(data: Uint8Array): void {
    // Append to buffer
    const newBuffer = new Uint8Array(this.responseBuffer.length + data.length);
    newBuffer.set(this.responseBuffer);
    newBuffer.set(data, this.responseBuffer.length);
    this.responseBuffer = newBuffer;

    // Check for complete packet (ends with 0x77)
    const endIndex = this.responseBuffer.indexOf(0x77);
    if (endIndex !== -1) {
      const packet = this.responseBuffer.slice(0, endIndex + 1);
      this.responseBuffer = this.responseBuffer.slice(endIndex + 1);

      console.log('Complete packet:', bytesToHex(packet));

      if (this.onDataCallback) {
        this.onDataCallback(packet);
      }
    }
  }

  /**
   * Send command to BMS
   */
  async sendCommand(command: number[]): Promise<void> {
    if (!this.writeCharacteristic) {
      throw new Error('Not connected to BMS');
    }

    const data = new Uint8Array(command);
    const base64Data = uint8ArrayToBase64(data);

    console.log('Sending command:', bytesToHex(data), 'withoutResponse:', this.useWriteWithoutResponse);

    try {
      if (this.useWriteWithoutResponse) {
        await this.writeCharacteristic.writeWithoutResponse(base64Data);
      } else {
        await this.writeCharacteristic.writeWithResponse(base64Data);
      }
    } catch (error) {
      // If write with response fails, try without response
      console.log('Write failed, trying alternate method...');
      try {
        if (this.useWriteWithoutResponse) {
          await this.writeCharacteristic.writeWithResponse(base64Data);
        } else {
          await this.writeCharacteristic.writeWithoutResponse(base64Data);
          // If this works, switch to this method
          this.useWriteWithoutResponse = true;
        }
      } catch (retryError) {
        throw retryError;
      }
    }
  }

  /**
   * Read basic info from BMS
   */
  async readBasicInfo(): Promise<BMSBasicInfo | null> {
    return new Promise(async (resolve) => {
      const timeout = setTimeout(() => {
        this.onDataCallback = null;
        resolve(null);
      }, 5000);

      this.onDataCallback = (data) => {
        clearTimeout(timeout);
        this.onDataCallback = null;
        const info = parseBasicInfo(data);
        resolve(info);
      };

      try {
        await this.sendCommand(BMS_COMMANDS.READ_BASIC_INFO);
      } catch (error) {
        clearTimeout(timeout);
        this.onDataCallback = null;
        console.error('Error reading basic info:', error);
        resolve(null);
      }
    });
  }

  /**
   * Read cell voltages from BMS
   */
  async readCellVoltages(): Promise<BMSCellInfo | null> {
    return new Promise(async (resolve) => {
      const timeout = setTimeout(() => {
        this.onDataCallback = null;
        resolve(null);
      }, 5000);

      this.onDataCallback = (data) => {
        clearTimeout(timeout);
        this.onDataCallback = null;
        const info = parseCellVoltages(data);
        resolve(info);
      };

      try {
        await this.sendCommand(BMS_COMMANDS.READ_CELL_VOLTAGES);
      } catch (error) {
        clearTimeout(timeout);
        this.onDataCallback = null;
        console.error('Error reading cell voltages:', error);
        resolve(null);
      }
    });
  }

  /**
   * Read all BMS data
   */
  async readAllData(): Promise<{ basicInfo: BMSBasicInfo | null; cellInfo: BMSCellInfo | null }> {
    const basicInfo = await this.readBasicInfo();
    
    // Small delay between commands
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const cellInfo = await this.readCellVoltages();

    return { basicInfo, cellInfo };
  }

  /**
   * Disconnect from BMS
   */
  async disconnect(): Promise<void> {
    if (this.monitorSubscription) {
      this.monitorSubscription.remove();
      this.monitorSubscription = null;
    }

    if (this.connectedDevice) {
      try {
        await this.connectedDevice.cancelConnection();
      } catch (error) {
        console.log('Disconnect error:', error);
      }
      this.connectedDevice = null;
    }

    this.writeCharacteristic = null;
    this.notifyCharacteristic = null;
    this.responseBuffer = new Uint8Array(0);
  }

  /**
   * Check if connected to a device
   */
  isConnected(): boolean {
    return this.connectedDevice !== null;
  }

  /**
   * Get connected device info
   */
  getConnectedDevice(): Device | null {
    return this.connectedDevice;
  }

  /**
   * Destroy BLE manager
   */
  destroy(): void {
    this.stopScan();
    this.disconnect();
    this.manager.destroy();
  }
}

// Export singleton instance
export const bmsService = new BMSBleService();
export default bmsService;
