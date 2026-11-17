# AgroGuard HBTU — AI-Based Electrical Support System for Crop Disease Identification & Mitigation

> **Official Repository** for the HBTU Kanpur B.Tech Electrical Engineering Final Year Project & **UPCST Engineering Student Project Grant (2026–2027)** Prototype (*"An Expert System Prototype Development using Artificial Intelligence for Crop Management"*).

---

## Academic & Team Profile

| Field | Details |
| :--- | :--- |
| **Institution** | Department of Electrical Engineering, Harcourt Butler Technical University (HBTU), Kanpur – 208002 |
| **Project Guide** | Dr. Shailendra Kumar Bhasker (Assistant Professor, Dept. of EE) |
| **Project In-Charge** | Dr. Sanjiv Kumar (Professor, Dept. of EE) |
| **Team Members** | Ayush Agrawal (`230105019`), Trisha Singh (`230105056`), Vipranshu Sachan (`230105061`), Yashraj Dhwaj Singh (`230105064`) |
| **Target Crops** | **Wheat** (Yellow/Brown Rust, Septoria), **Tomato** (Early/Late Blight, Bacterial Spot), **Rice** (Leaf Blast, Brown Spot) |
| **Grant Target** | Rs. 20,000/- (UPCST Scheme 2026–2027) |

---

## System Architecture (4-Stage AIoT & Electrical Pipeline)

1. **Stage 1 — Continuous Field Sensing & Risk ML (38-Pin ESP32)**
   - Polls `DHT22` (Temp/RH), `Capacitive Soil Moisture`, `BH1750` (Lux), `RS485 Soil NPK`, `HC-SR04` (Ultrasonic), and `IR` row sensor.
   - Computes **Leaf Wetness Index (LWI)** and **Disease Risk Score (0–100%)** (`LOW` | `MODERATE` | `ELEVATED` | `CRITICAL`).
2. **Stage 2 — Triggered Leaf Vision & Deep Learning (`ESP32-CAM` + `MobileNetV2` / `LLM`)**
   - Automatically triggers when Risk ≥ `60%` or `HC-SR04` detects a plant (`< 32 cm`).
   - Supports 3 selectable AI modes: **Hybrid (OpenAI/Gemini Vision + Sensor Rules)**, **Custom Python FastAPI CNN (`MobileNetV2` + CLAHE + Grad-CAM)**, and **Offline Spectral Engine**.
3. **Stage 3 — Automated Mitigation & 5 Hardware Safety Interlocks**
   - Gates `12V Mini Water Pump` (`IRLZ44N MOSFET PWM`), `Nozzle Servo`, and `L298N 4WD Rover` behind 5 mandatory interlocks:
     1. AI Confidence ≥ `75%`
     2. Battery Bus Voltage ≥ `10.8 V`
     3. Tank Level ≥ `10%`
     4. Pump Cooldown ≥ `30 s`
     5. System Mode == `AUTO` (no Manual Override / E-Stop)
4. **Stage 4 — Electrical Performance Evaluation (`INA219` + `12V BMS`)**
   - Tracks 12V BMS bus voltage (`V`), load current (`A`), power draw (`W`), cumulative energy (`Wh`), `LM2596` 5V/3.3V rail stability, actuator latency (`ms`), and enclosure temperature (`°C`).

---

## Quickstart

### Option A — Full Docker Stack (Recommended)
Runs **TimescaleDB**, **Mosquitto MQTT Broker**, **Python FastAPI AI Service**, **Next.js Dashboard**, and **MQTT Worker**:

```bash
# 1. Start Docker Desktop, then build & launch all 5 containers
docker compose up --build -d
```

- **Command Center UI**: `http://localhost:3000`
- **Python AI Service Health**: `http://localhost:8000/health`
- **MQTT Broker**: `mqtt://localhost:1883` (WebSocket `9001`)

### Option B — Local Node.js Development
```bash
npm install
npm run dev
```
Open `http://localhost:3000` (includes built-in Virtual Hardware Twin for testing without physical ESP32 hardware).

---

## Training Your Own Wheat, Tomato & Rice CNN Model

Place your datasets in `dataset/train/<Crop>___<Disease>/` and `dataset/val/<Crop>___<Disease>/`, then run:

```bash
python ai-models/train_wheat_tomato_rice.py --data-dir ./dataset --epochs 15
```
Exports `.keras`, `.tflite`, and `class_labels.json` into `ai-models/models/`, which `agroguard-ai-service` loads automatically.

---

## Repository Structure

```text
├── app/                   # Next.js App Router pages & REST APIs (/api/telemetry, /api/ai/analyze-image, /api/mitigation, /api/rover)
├── components/            # Clean dark SaaS UI components + white editorial @media print report
├── lib/                   # Hybrid AI engine, disease knowledge base, persistence store, NextAuth v5
├── mqtt/                  # Node.js MQTT ingestion worker & virtual hardware simulator
├── types/                 # Strict TypeScript domain contracts
├── ai-models/             # Python FastAPI inference server, MobileNetV2 training script & Dockerfile
├── firmware/              # Arduino C++ sketches for 38-pin ESP32 & ESP32-CAM
├── docs/                  # Architecture, GPIO pinouts, HTTP/MQTT protocol, TimescaleDB DDL, 3-crop AI plan, Docker guide
├── presentations/         # First-turn, Second-turn & Report-aligned PowerPoint (.pptx) decks
├── reports/               # Minimalist printable HTML project report
├── reference-papers/      # Archived IEEE/open-access research PDFs & DOI index
├── docker-compose.yml     # 5-service Docker orchestration
└── Dockerfile             # Next.js standalone production image
```
