# 03 — Hardware Pinout, Electrical Circuit & Power Design

This specification translates the 21-item BOM in `UPCST report-4.pdf` into a conflict-free wiring and electrical protection architecture for the **38-Pin ESP32 DevKit** and **ESP32-CAM (AI-Thinker)**.

---

## 1. Power Distribution & Electrical Protection Architecture

```text
[12V Li-ion/LiFePO4 Battery Pack + BMS (3S 11.1V–12.6V)]
   │
   ├──► [Main SPST Cutoff Switch] ──► [5A Blade/Glass Fuse]
   │        │
   │        ├──(12V Unregulated Power Bus)──► [INA219 Shunt (+IN / -IN)]
   │        │                                       │
   │        │         ┌─────────────────────────────┴──────────────────────────┐
   │        │         ▼                                                        ▼
   │        │   [L298N Motor Driver VCC (+12V)]                   [12V Mini Water Pump (+)]
   │        │    └─ 4WD Geared DC Motors (Left/Right)              └─ Pump (-) -> IRLZ44N Drain
   │        │                                                        └─ 1N4007 Flyback Diode across Pump
   │        │
   │        └──► [LM2596 / XL4015 DC-DC Buck Converter (Set to 5.00V, 3A)]
   │                  │
   │                  ├──► ESP32 38-Pin VIN (5V) ──► Onboard AMS1117-3.3V
   │                  ├──► ESP32-CAM 5V Pin (Separate filtered LC/bulk cap 470µF)
   │                  ├──► 5x Servo Motors V+ (Pan/Tilt/Nozzle - powered from 5V Buck, NOT ESP32 3.3V!)
   │                  ├──► HC-SR04 Ultrasonic VCC (5V, Echo voltage-divided to 3.3V!)
   │                  └──► RS485-to-TTL Module + NPK Sensor (5V/12V boost as per sensor spec)
```

> [!CAUTION]
> **Critical Electrical Rules**:
> 1. **Common Ground**: Battery `-`, Buck `-`, ESP32 `GND`, ESP32-CAM `GND`, L298N `GND`, and MOSFET `Source` MUST share a common ground star point.
> 2. **Inductive Flyback Protection**: Place a `1N4007` (or `1N5819` Schottky) flyback diode in reverse parallel across the 12V Mini Water Pump terminals to prevent inductive voltage spikes from resetting the ESP32.
> 3. **Echo Voltage Divider**: HC-SR04 `ECHO` outputs 5V logic. Use a `1kΩ / 2kΩ` resistor divider before connecting to ESP32 GPIO34 (input-only 3.3V tolerant pin).
> 4. **Bulk Capacitance**: Place a `470µF 16V` electrolytic capacitor + `100nF` ceramic capacitor on the 5V rail near the ESP32-CAM to prevent brownout resets during Wi-Fi TX + Flash LED bursts.

---

## 2. 38-Pin ESP32 DevKit GPIO Pinout Map

*(Selected to avoid strapping-pin boot conflicts on GPIO0, GPIO2, GPIO12, GPIO15 and ADC2 conflicts when Wi-Fi is active — all analog reads use **ADC1** pins GPIO32–39!)*

| ESP32 GPIO | Pin Label | Peripheral / Subsystem | Signal Direction / Protocol | Notes & Electrical Interface |
| :---: | :--- | :--- | :--- | :--- |
| **GPIO 21** | SDA | **Shared I2C Bus** (BH1750, SSD1306 OLED, INA219) | Bidirectional (I2C) | Addresses: OLED `0x3C`, BH1750 `0x23`, INA219 `0x40` |
| **GPIO 22** | SCL | **Shared I2C Bus** (BH1750, SSD1306 OLED, INA219) | Output (I2C Clock) | 4.7kΩ pull-ups to 3.3V |
| **GPIO 4** | D4 | **DHT22** (Temp & Humidity) | Bidirectional (1-Wire) | 10kΩ pull-up to 3.3V |
| **GPIO 34** | ADC1_CH6 | **Capacitive Soil Moisture Sensor** | Analog Input (0–3.3V) | Input-only ADC1 (works alongside Wi-Fi) |
| **GPIO 35** | ADC1_CH7 | **Secondary Temp / Leaf Wetness Analog** | Analog Input (0–3.3V) | Input-only ADC1 |
| **GPIO 36** | VP / ADC1_CH0 | **IR Path / Line Sensor** | Digital/Analog Input | Detects crop-row boundary |
| **GPIO 16** | RX2 | **RS485 NPK Sensor (UART2 RX)** | UART RX (3.3V) | Connected via MAX485 RO pin |
| **GPIO 17** | TX2 | **RS485 NPK Sensor (UART2 TX)** | UART TX (3.3V) | Connected via MAX485 DI pin |
| **GPIO 5** | D5 | **MAX485 DE/RE Direction Control** | Digital Output | HIGH = Transmit Modbus RTU query, LOW = Receive |
| **GPIO 18** | D18 | **HC-SR04 TRIG** | Digital Output | 10µs trigger pulse |
| **GPIO 39** | VN | **HC-SR04 ECHO** | Digital Input | Via 1kΩ/2kΩ 5V->3.3V voltage divider |
| **GPIO 25** | D25 | **12V Water Pump MOSFET Gate (IRLZ44N)** | PWM Output (LEDC Ch0) | 220Ω series gate resistor + 10kΩ pull-down to GND |
| **GPIO 26** | D26 | **Spray Nozzle Servo** | PWM Output (50Hz) | Adjusts spray elevation angle (0°–180°) |
| **GPIO 27** | D27 | **Camera Gimbal Pan Servo** | PWM Output (50Hz) | Pans ESP32-CAM bracket toward target leaf |
| **GPIO 14** | D14 | **L298N IN1 (Left Motors Forward)** | Digital Output | Left bank direction A |
| **GPIO 13** | D13 | **L298N IN2 (Left Motors Reverse)** | Digital Output | Left bank direction B |
| **GPIO 32** | D32 | **L298N ENA (Left Motors Speed)** | PWM Output | Speed control 0–255 |
| **GPIO 33** | D33 | **L298N IN3 (Right Motors Forward)** | Digital Output | Right bank direction A |
| **GPIO 23** | D23 | **L298N IN4 (Right Motors Reverse)** | Digital Output | Right bank direction B |
| **GPIO 19** | D19 | **L298N ENB (Right Motors Speed)** | PWM Output | Speed control 0–255 |
| **GPIO 15** | D15 | **Wheel Encoder Input (Left/Aggregate)** | Interrupt Input | Optical slot encoder pulse counter |
| **GPIO 2** | D2 | **Status LED (Disease Alert / Onboard)** | Digital Output | Flashes on `ELEVATED`/`CRITICAL` alert |
| **GPIO 12** | D12* | **Piezo Buzzer (Alarm)** | PWM / Tone Output | Active-low or NPN transistor drive (*ensure low at boot*) |

---

## 3. ESP32-CAM (AI-Thinker) Pinout Map

| ESP32-CAM Pin | Function | Notes |
| :---: | :--- | :--- |
| **5V / GND** | Power Supply | From LM2596 5.0V rail with 470µF decoupling capacitor |
| **GPIO 4** | Onboard High-Power Flash LED | Pulse briefly during dark/shaded leaf capture only |
| **GPIO 12 / 13 / 14 / 15 / 2** | MicroSD Card Slot (SPI/MMC) | Local backup of captured diseased leaf images |
| **GPIO 16** | External Trigger Input (optional) | Can receive hardware trigger pulse from Main ESP32 (or HTTP/MQTT trigger) |
| **OV2640 Camera Pins** | Internal CSI/SCCB | Fixed internal PCB routing (PWDN 32, XCLK 0, SIOD 26, SIOC 27, VSYNC 25, HREF 23, PCLK 22, Y2–Y9) |

---

## 4. Electrical Performance Testing Plan (Section 4.4)

The INA219 sensor continuously reports instantaneous bus voltage $V_{\text{bus}}$ (V), shunt current $I$ (A), and power $P = V \times I$ (W) across four distinct operating states:
1. **Idle / Environmental Monitoring**: ESP32 active + sensors polling (~1.2W–1.8W)
2. **Image Capture + Wi-Fi TX Burst**: ESP32-CAM OV2640 + Flash LED (~3.5W–4.8W)
3. **4WD Rover Mobility**: 4× Geared DC Motors via L298N (~8.5W–14.0W depending on terrain)
4. **Mitigation Actuation**: 12V Mini Water Pump + Servo (~6.0W–10.5W peak)

**Battery Low-Voltage Interlock**:
- Nominal 3S Li-ion Voltage: `11.1V` (`12.6V` full, `10.8V` warning threshold, `10.2V` hard cutoff).
- If $V_{\text{bus}} < 10.8\text{ V}$, Stage 3 automatically blocks pump/motor actuation to preserve microcontroller telemetry and protect battery cells.
