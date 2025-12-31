// JBD/Xiaoxiang BMS Bluetooth Constants
// Smart BMS 4S 200A with Bluetooth + UART

// BLE Service and Characteristic UUIDs for JBD BMS
export const BMS_SERVICE_UUID = '0000ff00-0000-1000-8000-00805f9b34fb';
export const BMS_WRITE_CHARACTERISTIC_UUID = '0000ff02-0000-1000-8000-00805f9b34fb';
export const BMS_NOTIFY_CHARACTERISTIC_UUID = '0000ff01-0000-1000-8000-00805f9b34fb';

// Alternative UUIDs (some JBD BMS variants use these)
export const BMS_SERVICE_UUID_ALT = '0000ffe0-0000-1000-8000-00805f9b34fb';
export const BMS_CHARACTERISTIC_UUID_ALT = '0000ffe1-0000-1000-8000-00805f9b34fb';

// JBD BMS Commands
export const BMS_COMMANDS = {
  // Read basic info (voltage, current, SOC, etc.)
  READ_BASIC_INFO: [0xDD, 0xA5, 0x03, 0x00, 0xFF, 0xFD, 0x77],
  
  // Read cell voltages
  READ_CELL_VOLTAGES: [0xDD, 0xA5, 0x04, 0x00, 0xFF, 0xFC, 0x77],
  
  // Read BMS name/version
  READ_VERSION: [0xDD, 0xA5, 0x05, 0x00, 0xFF, 0xFB, 0x77],
  
  // Enter factory mode (for configuration)
  ENTER_FACTORY_MODE: [0xDD, 0x5A, 0x00, 0x02, 0x56, 0x78, 0xFF, 0x30, 0x77],
  
  // Exit factory mode
  EXIT_FACTORY_MODE: [0xDD, 0x5A, 0x01, 0x02, 0x00, 0x00, 0xFF, 0xFD, 0x77],
};

// Response start/end markers
export const RESPONSE_START = 0xDD;
export const RESPONSE_END = 0x77;

// BMS Device name patterns
export const BMS_NAME_PATTERNS = [
  'xiaoxiang',
  'jbd-',
  'jbd_',
  'sp',
  'bms',
  'smart bms',
  'jiabaida',
];

// LiFePO4 voltage thresholds (per cell)
export const LIFEPO4_CELL_VOLTAGES = {
  MIN: 2.5,        // Absolute minimum
  LOW: 2.8,        // Low warning
  NOMINAL: 3.2,    // Nominal voltage
  HIGH: 3.5,       // High warning
  MAX: 3.65,       // Absolute maximum
  FULL: 3.4,       // Considered full
  EMPTY: 2.8,      // Considered empty
};

// 4S LiFePO4 pack voltage thresholds
export const LIFEPO4_4S_PACK_VOLTAGES = {
  MIN: 10.0,
  LOW: 11.2,
  NOMINAL: 12.8,
  HIGH: 14.0,
  MAX: 14.6,
};

// Protection flags
export const PROTECTION_FLAGS = {
  CELL_OVERVOLTAGE: 0x01,
  CELL_UNDERVOLTAGE: 0x02,
  PACK_OVERVOLTAGE: 0x04,
  PACK_UNDERVOLTAGE: 0x08,
  CHARGE_OVERTEMPERATURE: 0x10,
  CHARGE_UNDERTEMPERATURE: 0x20,
  DISCHARGE_OVERTEMPERATURE: 0x40,
  DISCHARGE_UNDERTEMPERATURE: 0x80,
  CHARGE_OVERCURRENT: 0x100,
  DISCHARGE_OVERCURRENT: 0x200,
  SHORT_CIRCUIT: 0x400,
  IC_ERROR: 0x800,
  MOS_LOCK: 0x1000,
};

// Fetch status
export const FETCH_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
};
