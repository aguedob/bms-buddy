# Battery Meter - JBD/Xiaoxiang BMS Monitor

A React Native app for monitoring LiFePO4 batteries managed by JBD/Xiaoxiang Smart BMS (Jiabaida) via Bluetooth.

## Features

- 📊 **Real-time Monitoring** - View battery voltage, current, SOC, and power
- 🔋 **Cell Voltages** - Monitor individual cell voltages with balance status
- 🌡️ **Temperature Sensors** - Track BMS and cell temperatures
- 🛡️ **Protection Status** - View all protection states (overvoltage, overcurrent, etc.)
- ⚡ **MOS Status** - Check charge/discharge MOSFET states
- 📱 **Auto-refresh** - Configurable automatic data updates
- 🎨 **Dark Theme** - Battery-friendly dark UI

## Supported BMS

This app supports **JBD/Jiabaida Smart BMS** devices with Bluetooth connectivity:
- BD/Jiabaida Smart BMS 4S 200A (and other configurations)
- XiaoXiang BMS (same protocol)
- Compatible with LiFePO4, Li-ion, and other lithium battery chemistries

## Requirements

- iOS 13+ or Android 6.0+
- Bluetooth Low Energy (BLE) support
- JBD/Xiaoxiang compatible BMS with Bluetooth module

## Installation

### Prerequisites

1. Install Node.js (v18+)
2. Install Expo CLI:
   ```bash
   npm install -g @expo/cli
   ```

### Setup

1. Clone or navigate to the project:
   ```bash
   cd batteryMeter
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a development build (required for BLE):
   ```bash
   npx expo prebuild
   ```

4. Run on device:
   
   **iOS:**
   ```bash
   npx expo run:ios
   ```
   
   **Android:**
   ```bash
   npx expo run:android
   ```

> **Note:** BLE requires a physical device. Simulators/emulators do not support Bluetooth.

## Usage

1. **Power on your BMS** - Ensure your battery pack is connected and the BMS is active
2. **Open the app** and go to **Settings**
3. **Tap "Scan for BMS"** - The app will search for nearby BMS devices
4. **Select your BMS** from the list (usually named "xiaoxiang" or "JBD-xxx")
5. **View data** on the Dashboard and Cells screens

## Screens

### Dashboard
- Main battery gauge showing SOC, voltage, and current
- Power consumption/charging rate
- Quick stats (capacity, cycles, cell count)
- Cell voltage overview with balance indicators
- Temperature readings
- Protection status

### Cells
- Detailed cell voltage list
- Cell deviation from average
- Balance status per cell
- LiFePO4 voltage reference

### Settings
- Bluetooth connection management
- Device scanning
- Auto-refresh configuration
- App information

## BMS Protocol

This app implements the JBD/Xiaoxiang BMS UART/Bluetooth protocol:

| Command | Description |
|---------|-------------|
| 0x03 | Read basic info (voltage, current, SOC, etc.) |
| 0x04 | Read cell voltages |
| 0x05 | Read device name/version |

### BLE Service UUIDs
- Service: `0000ff00-0000-1000-8000-00805f9b34fb`
- Write: `0000ff02-0000-1000-8000-00805f9b34fb`
- Notify: `0000ff01-0000-1000-8000-00805f9b34fb`

## LiFePO4 Voltage Reference

| State | Cell Voltage | 4S Pack |
|-------|--------------|---------|
| Full | 3.65V | 14.6V |
| High Warning | 3.5V | 14.0V |
| Nominal | 3.2V | 12.8V |
| Empty | 2.8V | 11.2V |
| Low Warning | 2.5V | 10.0V |

## Troubleshooting

### BMS not found during scan
- Ensure BMS is powered (battery connected)
- Check Bluetooth is enabled on your phone
- Move closer to the BMS
- Some BMS modules need a wake-up signal

### Connection drops
- Keep phone within 5 meters of BMS
- Reduce refresh interval
- Check BMS Bluetooth module

### Wrong data displayed
- Verify BMS cell count matches your battery
- Check if BMS firmware is compatible

## Project Structure

```
batteryMeter/
├── App.tsx                 # App entry point
├── src/
│   ├── components/         # UI components
│   │   ├── BatteryGauge/   # Main battery gauge
│   │   ├── CellVoltage/    # Cell voltage bars
│   │   ├── StatCard/       # Statistics cards
│   │   ├── ProtectionStatus/
│   │   └── Temperature/
│   ├── constants/
│   │   └── bms.ts          # BMS constants and UUIDs
│   ├── context/
│   │   └── BMSContext.tsx  # BMS state management
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── screens/
│   │   ├── DashboardScreen.tsx
│   │   ├── CellsScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── services/
│   │   └── bleService.ts   # BLE communication
│   ├── theme/
│   │   └── index.ts        # App theming
│   ├── types/
│   │   └── bms.ts          # TypeScript types
│   └── utils/
│       └── bmsParser.ts    # BMS data parser
└── package.json
```

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License

## Disclaimer

This app is not affiliated with JBD, Jiabaida, or XiaoXiang. Use at your own risk. Always follow battery safety guidelines.
