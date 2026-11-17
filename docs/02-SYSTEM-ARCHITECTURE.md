# 02 — System Architecture & Data Flow

This document defines the unified hardware, AI, electrical, and software architecture for the **AI-Based Electrical Support System for Crop Disease Identification and Mitigation**.

---

## 1. End-to-End Two-Stage + Mitigation Pipeline

```mermaid
flowchart TD
    subgraph S1["Stage 1: Continuous Field & Electrical Sensing (38-Pin ESP32)"]
        ENV["DHT22 (Temp/RH) + Soil Moisture + BH1750 (Lux) + NPK (RS485)"]
        NAV["HC-SR04 Ultrasonic + IR Line Sensor + 4x Wheel Encoders"]
        ELEC["12V BMS Battery -> LM2596 Buck -> INA219 V/I Sensor"]
        ESP32["ESP32 Main Controller (Wi-Fi / HTTP / MQTT)"]
        ENV --> ESP32
        NAV --> ESP32
        ELEC --> ESP32
    end

    subgraph S2["Stage 1 ML Risk Engine & Stage 2 Vision Trigger"]
        RISK["ML Risk Classifier (XGBoost / Weighted Agronomic Model)"]
        GATE{"Risk >= ELEVATED\nor Plant Target Detected\nor Manual Capture?"}
        CAM["ESP32-CAM (OV2640 + Pan/Tilt Servo + SD Card)"]
        CNN["Deep Learning CNN (MobileNetV2 / EfficientNet + Grad-CAM)"]
        ESP32 -->|"Telemetry Packet"| RISK
        RISK --> GATE
        GATE -->|"No (LOW / MODERATE)"| DASH["Next.js Glassmorphic Command Center & OLED"]
        GATE -->|"Yes (Trigger Capture)"| CAM
        CAM -->|"JPEG Base64 / Binary"| CNN
    end

    subgraph S3["Stage 3: Mitigation Decision Logic & Electrical Actuation"]
        LOGIC["Mitigation Decision Matrix + Crop Rules (NPSS)"]
        INTERLOCK{"5 Safety Interlocks Pass?\n1. Confidence >= 75%\n2. Battery >= 10.8V\n3. Tank >= 10%\n4. Cooldown Elapsed\n5. Mode == AUTO"}
        ACT["IRLZ44N MOSFET -> 12V Pump + Nozzle Servo + LED/Buzzer + L298N Rover"]
        ADVISORY["Farmer Treatment Advisory & Log Only"]
        CNN --> LOGIC
        RISK --> LOGIC
        LOGIC --> INTERLOCK
        INTERLOCK -->|"All Pass"| ACT
        INTERLOCK -->|"Blocked / Advisory Only"| ADVISORY
        ACT --> DASH
        ADVISORY --> DASH
    end
```

---

## 2. Software Monorepo & Hardware Bridge Architecture

```mermaid
flowchart LR
    HW["Physical Hardware\n(ESP32 38-Pin + ESP32-CAM)"] -->|"HTTP POST /api/telemetry\n+ /api/ai/analyze-image"| API["Next.js App Router API"]
    HW <-->|"MQTT Topics\n(agroguard/#)"| MQTT["Node.js MQTT Worker\n(/mqtt/worker.ts)"]
    SIM["Built-In Virtual Hardware Simulator\n(/mqtt/hardware-simulator.ts)"] --> API
    MQTT --> STORE["Persistence Layer\n(PostgreSQL/TimescaleDB or JSON DB)"]
    API --> AI["Shared TypeScript AI Engine\n(/lib/ai-engine.ts)"]
    AI --> KB["Pathology & NPSS Knowledge Base\n(/lib/disease-knowledge-base.ts)"]
    AI --> STORE
    STORE --> UI["Next.js Glassmorphic Dashboard\n(React + Tailwind + Recharts + Framer Motion)"]
    API -->|"Piggybacked Command Payload"| HW
```

---

## 3. Automated Mitigation State Machine

```mermaid
stateDiagram-v2
    [*] --> IDLE_MONITORING : Boot & Self-Test Pass
    IDLE_MONITORING --> ROW_PATROL : Rover Patrol Started
    ROW_PATROL --> TARGET_DETECTED : HC-SR04 < 35 cm OR Risk >= 55%
    IDLE_MONITORING --> TARGET_DETECTED : Risk >= 55% OR Manual Trigger

    TARGET_DETECTED --> IMAGE_ACQUISITION : Align Camera Servo & Flash
    IMAGE_ACQUISITION --> AI_INFERENCE : JPEG Uploaded to CNN + Grad-CAM
    AI_INFERENCE --> HEALTHY_LOG : Class == Healthy
    HEALTHY_LOG --> IDLE_MONITORING : Green LED + Resume

    AI_INFERENCE --> INTERLOCK_CHECK : Disease Detected
    INTERLOCK_CHECK --> ACTIVE_SPRAYING : All 5 Interlocks Validated
    INTERLOCK_CHECK --> ALERT_ONLY : Interlock Blocked (Low V / Low Tank / Low Conf / Manual)

    ACTIVE_SPRAYING --> COOLDOWN : Pump Run Complete (PWM Duty + Nozzle Angle)
    ALERT_ONLY --> COOLDOWN : Red LED + Buzzer + Dashboard Alert
    COOLDOWN --> IDLE_MONITORING : Cooldown Timer Expired

    IDLE_MONITORING --> EMERGENCY_STOP : E-Stop Pressed / Battery < 10.2V
    ACTIVE_SPRAYING --> EMERGENCY_STOP : E-Stop Pressed / Overcurrent Fault
    ROW_PATROL --> EMERGENCY_STOP : E-Stop Pressed
    EMERGENCY_STOP --> IDLE_MONITORING : Operator Manual Reset
```

---

## 4. Layer Responsibilities

| Layer | Directory / Target | Responsibility |
| :--- | :--- | :--- |
| **Field Sensing & Edge Control** | `firmware/esp32_main_controller/` | Reads physical sensors, controls L298N motors, MOSFET pump, servos, OLED, LED/buzzer; handles local hardware E-Stop. |
| **Edge Vision Node** | `firmware/esp32_cam_node/` | Captures OV2640 frames on risk/obstacle trigger, backs up to microSD, posts image to server. |
| **ML Training & Reference** | `ai-models/` | Python TensorFlow MobileNetV2 + Grad-CAM and environmental risk classifier scripts for offline training & TFLite export. |
| **Ingestion & Protocol** | `mqtt/` & `app/api/` | Bridges physical hardware (MQTT/HTTP) and virtual simulator scenarios into validated TypeScript domain models. |
| **Decision & Knowledge** | `lib/ai-engine.ts`, `lib/disease-knowledge-base.ts` | Stage 1 Risk scoring, Stage 2 image diagnostics, Stage 3 interlock gating, NPSS treatment recommendations. |
| **Storage** | `lib/store.ts` & `docs/06-DATABASE-SCHEMA.sql` | Time-series history for sensors, electrical metrics, detections, rover state, and mitigation logs. |
| **Presentation UI** | `app/`, `components/` | 5-tab dark-mode glassmorphic command center for live monitoring, XAI inspection, rover/pump control, and EE analytics. |
