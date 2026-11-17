# AGENTS.md — AI-Based Electrical Support System for Crop Disease Identification & Mitigation

> **Repository Role**: Official software, AI/ML, documentation, and hardware-integration platform for the HBTU Kanpur B.Tech Electrical Engineering Final Year Project & UPCST Engineering Student Project Grant (2026–2027).

---

## 1. Project Identity & Academic Context
- **Proposal Title** (`UPCST report-4.pdf`): *"An Expert System Prototype Development using Artificial Intelligence for Crop Management"* (UPCST Grant Scheme 2026–2027, Grant: Rs. 20,000/-, Duration: 6 Months)
- **Progress Report Title** (`crop-disease-detection-final-print(2).pdf`): *"Design and Development of an AI-Based Electrical Support System for Crop Disease Identification and Mitigation"* (October 2026)
- **Institution**: Department of Electrical Engineering, School of Engineering, Harcourt Butler Technical University (HBTU), Kanpur – 208002
- **Project Guide**: Dr. Shailendra Kumar Bhasker (Assistant Professor, Dept. of Electrical Engineering)
- **Project In-Charge**: Dr. Sanjiv Kumar (Professor, Dept. of Electrical Engineering)
- **Team Members**:
  - Ayush Agrawal (`230105019`)
  - Trisha Singh (`230105056`)
  - Vipranshu Sachan (`230105061`)
  - Yashraj Dhwaj Singh (`230105064`)

---

## 2. Core System Architecture (Do Not Break These Contracts)
The system implements an integrated **4-stage hardware-software-AI pipeline**:

1. **Stage 1 — Environmental & Soil Sensing + ML Disease-Risk Assessment**
   - **Sensors (38-pin ESP32)**: DHT22 (Ambient Temp °C, Relative Humidity %), Capacitive Soil Moisture (%), BH1750 Light Intensity (Lux), RS485 Soil NPK (Nitrogen, Phosphorus, Potassium mg/kg), Computed Leaf Wetness Index (LWI 0–100%), HC-SR04 Ultrasonic Distance (cm), IR Line-Following Sensor.
   - **Behavior**: Continuously measures parameters and computes an early-warning **Disease Risk Score (0–100%)** (`LOW` | `MODERATE` | `ELEVATED` | `CRITICAL`) and pathogen conduciveness (Fungal Blight, Powdery Mildew, Bacterial Wilt, Root Rot).
   - **Trigger**: When Risk is `ELEVATED` / `CRITICAL` OR HC-SR04 detects a plant target within capture range OR manually requested, Stage 2 is triggered.

2. **Stage 2 — Triggered Image Acquisition (ESP32-CAM) & Deep Learning Identification**
   - **Hardware**: ESP32-CAM with OV2640 camera, 1× pan/tilt servo bracket, SD card local backup.
   - **Model**: MobileNetV2 / EfficientNet CNN + Grad-CAM XAI visual heatmap overlay (`ai-models/crop_disease_ai_pipeline.py` & `/lib/ai-engine.ts`).
   - **Output**: Crop species, Disease class, Confidence Score (%), Infected Leaf Area (%), Grad-CAM hotspot bounding boxes, and NPSS-aligned treatment advisory.

3. **Stage 3 — Mitigation Decision Logic & Electrical Control Integration**
   - **Decision Gate**: Combines Stage 1 Risk + Stage 2 Disease & Confidence + **5 Hardware Safety Interlocks**:
     1. AI Confidence >= configured threshold (default `75%`)
     2. Battery Voltage >= `10.8 V` (protect Li-ion/LiFePO4 BMS from deep discharge)
     3. Spray Tank Level >= `10%` (prevent dry-running 12V mini water pump)
     4. Pump Cooldown elapsed (prevent over-spraying the same plant)
     5. System Mode is `AUTO` (not `MANUAL` override or `EMERGENCY_STOP`)
   - **Actuators**: 12V Mini DC Water Pump via IRLZ44N MOSFET PWM, Spray Nozzle Servo, 4WD Metal Chassis Rover via L298N + 4 Wheel Encoders, SSD1306 OLED Display, Status LED & Buzzer.

4. **Stage 4 — Electrical Performance & Prototype Evaluation**
   - **Power Subsystem**: 12V Rechargeable Battery Pack with BMS, Main Switch & Fuse, LM2596 DC-DC Buck Converter (12V -> 5V/3.3V), INA219 Voltage & Current Sensing Module.
   - **Metrics Tracked**: Bus Voltage (V), Current Demand (A), Power Draw (W), Cumulative Energy (Wh), Actuator Response Time (ms), System Operating Temperature (°C).

---

## 3. Tech Stack & Coding Standards
- **Frontend**: Next.js (App Router), React, TypeScript (`strict: true`), TailwindCSS, Framer Motion, Recharts, Lucide React.
- **Backend & API**: Next.js App Router API routes (`/app/api/*`) + Node.js MQTT ingestion worker (`/mqtt/worker.ts`) and hardware simulator (`/mqtt/hardware-simulator.ts`).
- **Database**: PostgreSQL + TimescaleDB schema defined in `docs/06-DATABASE-SCHEMA.sql` (with automatic zero-config JSON persistence in `data/agroguard-db.json` when `DATABASE_URL` is not configured).
- **Auth**: NextAuth.js v5 (`next-auth`) compatible session & device API key (`x-device-key`) verification.
- **Directory Layout**:
  - `/app`: Next.js pages, layouts, global CSS, and REST API routes.
  - `/components`: Modular dark-mode glassmorphic UI components.
  - `/lib`: Shared AI engine, disease knowledge base, persistence store, auth helpers, formatting utilities.
  - `/mqtt`: MQTT worker (`worker.ts`) and virtual ESP32 hardware simulator (`hardware-simulator.ts`).
  - `/types`: Strict TypeScript interfaces shared across frontend, API, and MQTT worker.
  - `/docs`: Complete technical documentation, BOM, pinouts, protocol specs, and SQL DDL.
  - `/firmware`: Arduino C++ sketches for 38-pin ESP32 and ESP32-CAM.
  - `/ai-models`: TensorFlow/Keras MobileNetV2 + Grad-CAM + XGBoost Python pipeline.

---

## 4. Agent Rules for Working in This Repository
1. **Preserve Hardware-Software Contracts**: Never rename JSON fields in `/types/index.ts`, `/app/api/telemetry/route.ts`, `/app/api/ai/analyze-image/route.ts`, `/app/api/mitigation/route.ts`, or `/app/api/rover/route.ts` without updating `docs/04-HARDWARE-SOFTWARE-PROTOCOL.md` and `firmware/*.ino` simultaneously.
2. **Never Bypass Safety Interlocks**: Pump actuation logic MUST always verify battery voltage, tank level, cooldown, and emergency-stop state before returning `pumpActivate: true` to hardware.
3. **Strict TypeScript**: Always run `npx tsc --noEmit` and `npm run build` after code edits. No `any` types unless strictly unavoidable and documented.
4. **UI/UX Consistency**: Maintain the dark-mode glassmorphic aesthetic (`bg-slate-950`, translucent slate cards, emerald/cyan/amber/rose status tokens) and keep all pages mobile-first and responsive.
5. **Documentation Sync**: Keep `task.md` and `implementation_plan.md` updated whenever milestones change. Use Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).
6. **Do Not Modify Source PDFs**: `UPCST report-4.pdf` and `crop-disease-detection-final-print(2).pdf` are archival source documents and must remain untouched.
