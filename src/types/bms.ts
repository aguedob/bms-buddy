// BMS Data Types for JBD/Xiaoxiang Smart BMS

export interface BMSBasicInfo {
  // Voltage in V
  totalVoltage: number;
  
  // Current in A (positive = charging, negative = discharging)
  current: number;
  
  // Remaining capacity in Ah
  remainingCapacity: number;
  
  // Nominal capacity in Ah
  nominalCapacity: number;
  
  // State of charge in %
  soc: number;
  
  // Cycle count
  cycleCount: number;
  
  // Production date
  productionDate: Date | null;
  
  // Balance status (bitmask for each cell)
  balanceStatus: number;
  balanceStatusHigh: number;
  
  // Protection status (bitmask)
  protectionStatus: number;
  
  // Software version
  softwareVersion: number;
  
  // Remaining capacity in %
  rsoc: number;
  
  // MOS status
  chargeMosEnabled: boolean;
  dischargeMosEnabled: boolean;
  
  // Number of cells
  cellCount: number;
  
  // Number of NTC (temperature sensors)
  ntcCount: number;
  
  // Temperatures in °C
  temperatures: number[];
}

export interface BMSCellInfo {
  // Cell voltages in V
  cellVoltages: number[];
  
  // Average cell voltage
  averageVoltage: number;
  
  // Cell voltage difference (max - min)
  voltageDelta: number;
  
  // Highest cell voltage
  maxVoltage: number;
  maxVoltageCell: number;
  
  // Lowest cell voltage
  minVoltage: number;
  minVoltageCell: number;
}

export interface BMSDeviceInfo {
  name: string;
  id: string;
  rssi: number;
  isConnected: boolean;
}

export interface ProtectionStatus {
  cellOvervoltage: boolean;
  cellUndervoltage: boolean;
  packOvervoltage: boolean;
  packUndervoltage: boolean;
  chargeOvertemperature: boolean;
  chargeUndertemperature: boolean;
  dischargeOvertemperature: boolean;
  dischargeUndertemperature: boolean;
  chargeOvercurrent: boolean;
  dischargeOvercurrent: boolean;
  shortCircuit: boolean;
  icError: boolean;
  mosLock: boolean;
}

export interface BMSData {
  basicInfo: BMSBasicInfo | null;
  cellInfo: BMSCellInfo | null;
  deviceInfo: BMSDeviceInfo | null;
  protectionDetails: ProtectionStatus | null;
  lastUpdate: Date | null;
  isLoading: boolean;
  error: string | null;
}

export interface ScannedDevice {
  id: string;
  name: string | null;
  rssi: number;
  serviceUUIDs: string[] | null;
}

export type ConnectionStatus = 'disconnected' | 'scanning' | 'connecting' | 'connected' | 'error';
