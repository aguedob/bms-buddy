// JBD/Xiaoxiang BMS Data Parser
// Parses binary data from the Smart BMS protocol

import {
  BMSBasicInfo,
  BMSCellInfo,
  ProtectionStatus,
} from '../types/bms';
import { PROTECTION_FLAGS, RESPONSE_START, RESPONSE_END } from '../constants/bms';

/**
 * Validate BMS response packet
 */
export function validateResponse(data: Uint8Array): boolean {
  if (data.length < 7) return false;
  if (data[0] !== RESPONSE_START) return false;
  if (data[data.length - 1] !== RESPONSE_END) return false;
  
  // Verify checksum
  const checksum = calculateChecksum(data);
  const receivedChecksum = (data[data.length - 3] << 8) | data[data.length - 2];
  
  return checksum === receivedChecksum;
}

/**
 * Calculate checksum for BMS packet
 */
export function calculateChecksum(data: Uint8Array): number {
  let sum = 0;
  // Sum bytes from index 2 to length - 3 (excluding start, command, checksum, and end)
  for (let i = 2; i < data.length - 3; i++) {
    sum += data[i];
  }
  return (0xFFFF - sum + 1) & 0xFFFF;
}

/**
 * Parse basic info response (command 0x03)
 */
export function parseBasicInfo(data: Uint8Array): BMSBasicInfo | null {
  try {
    // Validate response
    if (data[0] !== RESPONSE_START || data[1] !== 0x03) {
      console.log('Invalid basic info response header');
      return null;
    }

    const length = data[3];
    if (data.length < length + 7) {
      console.log('Basic info response too short');
      return null;
    }

    // Parse data starting at index 4
    let idx = 4;

    // Total voltage (2 bytes, unit: 10mV)
    const totalVoltage = ((data[idx] << 8) | data[idx + 1]) / 100;
    idx += 2;

    // Current (2 bytes, unit: 10mA, signed)
    let current = (data[idx] << 8) | data[idx + 1];
    if (current > 32767) current -= 65536; // Convert to signed
    current = current / 100;
    idx += 2;

    // Remaining capacity (2 bytes, unit: 10mAh)
    const remainingCapacity = ((data[idx] << 8) | data[idx + 1]) / 100;
    idx += 2;

    // Nominal capacity (2 bytes, unit: 10mAh)
    const nominalCapacity = ((data[idx] << 8) | data[idx + 1]) / 100;
    idx += 2;

    // Cycle count (2 bytes)
    const cycleCount = (data[idx] << 8) | data[idx + 1];
    idx += 2;

    // Production date (2 bytes)
    const prodDateRaw = (data[idx] << 8) | data[idx + 1];
    const productionDate = prodDateRaw > 0 
      ? new Date(2000 + ((prodDateRaw >> 9) & 0x7F), ((prodDateRaw >> 5) & 0x0F) - 1, prodDateRaw & 0x1F)
      : null;
    idx += 2;

    // Balance status (2 bytes for cells 1-16)
    const balanceStatus = (data[idx] << 8) | data[idx + 1];
    idx += 2;

    // Balance status high (2 bytes for cells 17-32)
    const balanceStatusHigh = (data[idx] << 8) | data[idx + 1];
    idx += 2;

    // Protection status (2 bytes)
    const protectionStatus = (data[idx] << 8) | data[idx + 1];
    idx += 2;

    // Software version (1 byte)
    const softwareVersion = data[idx];
    idx += 1;

    // Remaining SOC (1 byte, %)
    const rsoc = data[idx];
    idx += 1;

    // MOS status (1 byte)
    const mosStatus = data[idx];
    const chargeMosEnabled = (mosStatus & 0x01) !== 0;
    const dischargeMosEnabled = (mosStatus & 0x02) !== 0;
    idx += 1;

    // Number of cells (1 byte)
    const cellCount = data[idx];
    idx += 1;

    // Number of NTC sensors (1 byte)
    const ntcCount = data[idx];
    idx += 1;

    // Temperatures (2 bytes each, unit: 0.1K)
    const temperatures: number[] = [];
    for (let i = 0; i < ntcCount; i++) {
      const tempRaw = (data[idx] << 8) | data[idx + 1];
      const tempCelsius = (tempRaw - 2731) / 10; // Convert from 0.1K to °C
      temperatures.push(Math.round(tempCelsius * 10) / 10);
      idx += 2;
    }

    // Calculate SOC based on remaining/nominal capacity
    const soc = nominalCapacity > 0 
      ? Math.round((remainingCapacity / nominalCapacity) * 100) 
      : rsoc;

    return {
      totalVoltage,
      current,
      remainingCapacity,
      nominalCapacity,
      soc: Math.min(100, Math.max(0, soc)),
      cycleCount,
      productionDate,
      balanceStatus,
      balanceStatusHigh,
      protectionStatus,
      softwareVersion,
      rsoc,
      chargeMosEnabled,
      dischargeMosEnabled,
      cellCount,
      ntcCount,
      temperatures,
    };
  } catch (error) {
    console.error('Error parsing basic info:', error);
    return null;
  }
}

/**
 * Parse cell voltages response (command 0x04)
 */
export function parseCellVoltages(data: Uint8Array, expectedCells: number = 4): BMSCellInfo | null {
  try {
    // Validate response
    if (data[0] !== RESPONSE_START || data[1] !== 0x04) {
      console.log('Invalid cell voltage response header');
      return null;
    }

    const length = data[3];
    const cellCount = Math.floor(length / 2);

    if (cellCount === 0) {
      console.log('No cell data in response');
      return null;
    }

    // Parse cell voltages starting at index 4
    const cellVoltages: number[] = [];
    let idx = 4;

    for (let i = 0; i < cellCount; i++) {
      // Each cell voltage is 2 bytes, unit: 1mV
      const voltage = ((data[idx] << 8) | data[idx + 1]) / 1000;
      cellVoltages.push(Math.round(voltage * 1000) / 1000);
      idx += 2;
    }

    // Calculate statistics
    const minVoltage = Math.min(...cellVoltages);
    const maxVoltage = Math.max(...cellVoltages);
    const averageVoltage = cellVoltages.reduce((a, b) => a + b, 0) / cellVoltages.length;
    const voltageDelta = maxVoltage - minVoltage;

    const minVoltageCell = cellVoltages.indexOf(minVoltage) + 1;
    const maxVoltageCell = cellVoltages.indexOf(maxVoltage) + 1;

    return {
      cellVoltages,
      averageVoltage: Math.round(averageVoltage * 1000) / 1000,
      voltageDelta: Math.round(voltageDelta * 1000) / 1000,
      maxVoltage,
      maxVoltageCell,
      minVoltage,
      minVoltageCell,
    };
  } catch (error) {
    console.error('Error parsing cell voltages:', error);
    return null;
  }
}

/**
 * Parse protection status flags
 */
export function parseProtectionStatus(status: number): ProtectionStatus {
  return {
    cellOvervoltage: (status & PROTECTION_FLAGS.CELL_OVERVOLTAGE) !== 0,
    cellUndervoltage: (status & PROTECTION_FLAGS.CELL_UNDERVOLTAGE) !== 0,
    packOvervoltage: (status & PROTECTION_FLAGS.PACK_OVERVOLTAGE) !== 0,
    packUndervoltage: (status & PROTECTION_FLAGS.PACK_UNDERVOLTAGE) !== 0,
    chargeOvertemperature: (status & PROTECTION_FLAGS.CHARGE_OVERTEMPERATURE) !== 0,
    chargeUndertemperature: (status & PROTECTION_FLAGS.CHARGE_UNDERTEMPERATURE) !== 0,
    dischargeOvertemperature: (status & PROTECTION_FLAGS.DISCHARGE_OVERTEMPERATURE) !== 0,
    dischargeUndertemperature: (status & PROTECTION_FLAGS.DISCHARGE_UNDERTEMPERATURE) !== 0,
    chargeOvercurrent: (status & PROTECTION_FLAGS.CHARGE_OVERCURRENT) !== 0,
    dischargeOvercurrent: (status & PROTECTION_FLAGS.DISCHARGE_OVERCURRENT) !== 0,
    shortCircuit: (status & PROTECTION_FLAGS.SHORT_CIRCUIT) !== 0,
    icError: (status & PROTECTION_FLAGS.IC_ERROR) !== 0,
    mosLock: (status & PROTECTION_FLAGS.MOS_LOCK) !== 0,
  };
}

/**
 * Check if any protection is active
 */
export function hasActiveProtection(status: ProtectionStatus): boolean {
  return Object.values(status).some(v => v);
}

/**
 * Get active protection names
 */
export function getActiveProtections(status: ProtectionStatus): string[] {
  const protections: string[] = [];
  
  if (status.cellOvervoltage) protections.push('Cell Overvoltage');
  if (status.cellUndervoltage) protections.push('Cell Undervoltage');
  if (status.packOvervoltage) protections.push('Pack Overvoltage');
  if (status.packUndervoltage) protections.push('Pack Undervoltage');
  if (status.chargeOvertemperature) protections.push('Charge Over Temperature');
  if (status.chargeUndertemperature) protections.push('Charge Under Temperature');
  if (status.dischargeOvertemperature) protections.push('Discharge Over Temperature');
  if (status.dischargeUndertemperature) protections.push('Discharge Under Temperature');
  if (status.chargeOvercurrent) protections.push('Charge Overcurrent');
  if (status.dischargeOvercurrent) protections.push('Discharge Overcurrent');
  if (status.shortCircuit) protections.push('Short Circuit');
  if (status.icError) protections.push('IC Error');
  if (status.mosLock) protections.push('MOS Locked');
  
  return protections;
}

/**
 * Convert byte array to hex string for debugging
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ');
}

/**
 * Convert base64 string to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert Uint8Array to base64 string
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
