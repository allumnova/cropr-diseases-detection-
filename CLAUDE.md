# CLAUDE.md — Engineering Guidance for Claude / AI Assistants

This repository implements the software control plane, AI inference engine, MQTT/HTTP hardware bridge, firmware, and documentation for the HBTU Kanpur Final Year B.Tech (Electrical Engineering) project:
**"Design and Development of an AI-Based Electrical Support System for Crop Disease Identification and Mitigation"** (incorporating the UPCST Grant Prototype *"An Expert System Prototype Development using Artificial Intelligence for Crop Management"*).

See [AGENTS.md](./AGENTS.md) for the complete architectural contract, academic metadata, and safety rules.

---

## Quick Orientation

- **Primary Documentation**: `docs/`
  - `docs/01-DOCUMENT-ANALYSIS-AND-SYNTHESIS.md` — Full synthesis of both PDFs, 15 literature survey papers, and Rs. 20,000 BOM.
  - `docs/02-SYSTEM-ARCHITECTURE.md` — Mermaid system block diagrams & state machines.
  - `docs/03-HARDWARE-PINOUT-AND-ELECTRICAL-DESIGN.md` — ESP32 (38-pin) & ESP32-CAM GPIO tables, MOSFET/L298N/INA219/LM2596 circuits.
  - `docs/04-HARDWARE-SOFTWARE-PROTOCOL.md` — MQTT topics & HTTP REST API payload schemas.
  - `docs/05-AI-ML-PIPELINE-AND-MITIGATION-LOGIC.md` — Stage 1 Risk Math, Stage 2 CNN/Grad-CAM, Stage 3 Interlocks.
  - `docs/06-DATABASE-SCHEMA.sql` — PostgreSQL + TimescaleDB schema.
- **Hardware Firmware**:
  - `firmware/esp32_main_controller/esp32_main_controller.ino`
  - `firmware/esp32_cam_node/esp32_cam_node.ino`
- **Python AI Reference**:
  - `ai-models/crop_disease_ai_pipeline.py`
- **Next.js Application**:
  - `/types/index.ts` — Shared TypeScript domain models.
  - `/lib/` — `ai-engine.ts`, `disease-knowledge-base.ts`, `store.ts`, `utils.ts`, `auth.ts`.
  - `/mqtt/` — `hardware-simulator.ts`, `worker.ts`.
  - `/app/api/` — REST endpoints for telemetry ingestion, AI vision analysis, mitigation, rover control, and auth.
  - `/components/` & `/app/page.tsx` — Glassmorphic Dark Mode Command Center UI.

---

## Essential Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run MQTT ingestion worker (optional alongside Next.js)
npm run mqtt:worker

# Type-check & Build
npx tsc --noEmit
npm run build

# Lint
npm run lint
```

---

## Key Design Invariants

1. **Dual-Mode Execution (Hardware Ready + Built-In Simulator)**:
   The platform works immediately without physical hardware via `mqtt/hardware-simulator.ts`, while simultaneously exposing production HTTP endpoints (`/api/telemetry`, `/api/ai/analyze-image`) and MQTT topics (`agroguard/#`) that accept live packets from an ESP32 + ESP32-CAM with zero code changes.
2. **Piggybacked Command Dispatch**:
   When the physical ESP32 calls `POST /api/telemetry`, the JSON response includes `commands: { pumpActivate, pumpDurationMs, nozzleAngleDeg, roverAction, cameraTrigger, ledAlert, buzzerAlert }` so the microcontroller can receive commands over standard HTTP even on networks where inbound MQTT ports are blocked.
3. **Electrical Safety First**:
   Any automated mitigation command must pass all 5 interlocks in `evaluateMitigationDecision()` inside `lib/ai-engine.ts`.
