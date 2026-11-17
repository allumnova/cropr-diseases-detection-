# Implementation Plan — AI-Based Electrical Support System for Crop Disease Identification and Mitigation

## 1. Executive Summary
This plan transforms the HBTU Kanpur B.Tech Electrical Engineering project proposals (`UPCST report-4.pdf` and `crop-disease-detection-final-print(2).pdf`) into a complete documentation suite, agent-ready codebase, firmware package, Python ML reference pipeline, and production-grade Next.js software platform ready for physical ESP32 hardware attachment.

---

## 2. Phase Breakdown

### Phase 1: Technical Documentation & Agent Infrastructure
- **Goal**: Establish complete architectural clarity, pinouts, electrical schematics, data schemas, and AI-agent rules before writing application code.
- **Deliverables**:
  - `AGENTS.md`, `CLAUDE.md`, `implementation_plan.md`, `task.md`
  - `docs/01-DOCUMENT-ANALYSIS-AND-SYNTHESIS.md` (Synthesis of both PDFs, 15 literature references, 21-item BOM within Rs. 20,000 budget)
  - `docs/02-SYSTEM-ARCHITECTURE.md` (Mermaid end-to-end architecture, Stage 1->2->3 pipeline, state machine)
  - `docs/03-HARDWARE-PINOUT-AND-ELECTRICAL-DESIGN.md` (38-pin ESP32 & ESP32-CAM GPIOs, LM2596 buck converter, INA219 sensing, IRLZ44N MOSFET pump driver, L298N 4WD driver)
  - `docs/04-HARDWARE-SOFTWARE-PROTOCOL.md` (MQTT topics, HTTP REST contracts, device key auth, piggybacked command responses)
  - `docs/05-AI-ML-PIPELINE-AND-MITIGATION-LOGIC.md` (Stage 1 Risk model, Stage 2 MobileNetV2/EfficientNet + Grad-CAM, Stage 3 Interlocks & NPSS treatments)
  - `docs/06-DATABASE-SCHEMA.sql` (PostgreSQL + TimescaleDB hypertables)

### Phase 2: Firmware & Python AI Reference Pipelines
- **Goal**: Provide ready-to-flash Arduino C++ sketches and Python TensorFlow/XGBoost training scripts matching the project reports.
- **Deliverables**:
  - `firmware/esp32_main_controller/esp32_main_controller.ino`
  - `firmware/esp32_cam_node/esp32_cam_node.ino`
  - `ai-models/crop_disease_ai_pipeline.py`

### Phase 3: Full-Stack Software Core (Next.js App Router + TypeScript)
- **Goal**: Build the complete software brain, persistence layer, REST APIs, and virtual hardware simulator.
- **Deliverables**:
  - Strict TypeScript types (`/types/index.ts`)
  - Agronomic & Disease Knowledge Base (`/lib/disease-knowledge-base.ts`)
  - Stage 1, 2, 3 AI & Decision Engine (`/lib/ai-engine.ts`)
  - Persistent Data Store with seeded 24h telemetry (`/lib/store.ts`)
  - NextAuth v5 compatible configuration (`/lib/auth.ts` & `/app/api/auth/[...nextauth]/route.ts`)
  - Virtual Hardware Simulator & MQTT Worker (`/mqtt/hardware-simulator.ts`, `/mqtt/worker.ts`)
  - REST APIs (`/app/api/system`, `/app/api/telemetry`, `/app/api/ai/analyze-image`, `/app/api/mitigation`, `/app/api/rover`)

### Phase 4: Glassmorphic Dark-Mode Command Center UI
- **Goal**: Build a responsive, real-time operator & researcher dashboard using TailwindCSS, Framer Motion, Recharts, and Lucide React.
- **Deliverables**:
  - **Command Center Overview**: Live Stage 1 -> Stage 2 -> Stage 3 status flow, sensor cards (Temp, Humidity, Soil Moisture, Light, LWI, NPK), Recharts environmental trends, Risk Assessment gauge & pathogen breakdown.
  - **AI Vision & ESP32-CAM Studio**: Specimen selector + custom leaf image uploader + camera capture, Grad-CAM visual attention heatmap overlay, lesion severity analysis, confidence score, and NPSS farmer advisory.
  - **Mitigation & 4WD Rover Control**: 12V Pump MOSFET control, PWM duty & duration, tank & nozzle servo controls, 5-gate safety interlock visualizer, 4WD rover D-pad & autonomous patrol, 4-wheel encoder RPMs, HC-SR04 radar, IR line tracking, live OLED SSD1306 mirror.
  - **Electrical Engineering Analytics**: INA219 bus voltage, current demand, power draw breakdown (Idle vs Rover vs Pump), actuator latency, operating temperature, battery SoC/BMS health.
  - **Hardware Integration & Docs Hub**: Interactive ESP32 GPIO table, live cURL/Arduino hardware connector tester, BOM & cost breakdown table.

### Phase 5: Verification & Hardware Readiness
- **Goal**: Confirm zero build/type errors and end-to-end API pipeline validation.
- **Checks**:
  - `npx tsc --noEmit`
  - `npm run build`
  - Live server API verification covering telemetry ingestion -> risk escalation -> image analysis -> mitigation command generation.
