# 08 — Docker Deployment, 3-Crop Model Training & LLM Hybrid Setup

This guide explains how to run the entire **AgroGuard HBTU** platform as a 5-container Docker stack, train your own **Wheat / Tomato / Rice** CNN model, and enable optional **OpenAI / Gemini Vision** reasoning.

---

## 1. Dockerized Multi-Service Architecture

| Container | Service | Port | Purpose |
| :--- | :--- | :---: | :--- |
| `agroguard-timescaledb` | `db` (`timescale/timescaledb:latest-pg16`) | `5432` | Auto-initializes `docs/06-DATABASE-SCHEMA.sql` for time-series telemetry |
| `agroguard-mqtt-broker` | `mosquitto` (`eclipse-mosquitto:2`) | `1883`, `9001` | Receives live MQTT packets from physical ESP32 & ESP32-CAM |
| `agroguard-ai-service` | `ai-service` (`ai-models/Dockerfile`) | `8000` | Python FastAPI server: CLAHE preprocessing + MobileNetV2 CNN + Grad-CAM |
| `agroguard-web` | `web` (`Dockerfile`) | `3000` | Next.js standalone dashboard, REST APIs, and Hybrid LLM/Rule engine |
| `agroguard-mqtt-worker` | `mqtt-worker` (`docker/worker.Dockerfile`) | — | Bridges `mosquitto` (`agroguard/#`) ↔ `web` (`/api/telemetry`) |

---

## 2. Launching the Full Docker Stack

1. Ensure **Docker Desktop** is running.
2. (Optional) Create `.env` in the root folder to enable OpenAI or Gemini Vision:
   ```env
   OPENAI_API_KEY=sk-...
   GEMINI_API_KEY=AIza...
   AGROGUARD_DEVICE_KEY=hbtu-agroguard-2026
   ```
3. Build and start all 5 containers:
   ```bash
   docker compose up --build -d
   ```
4. Access the services:
   - **Dashboard**: `http://localhost:3000`
   - **Python AI Service Health**: `http://localhost:8000/health`
   - **MQTT Broker**: `mqtt://localhost:1883`

---

## 3. Training Your Own Wheat, Tomato & Rice CNN Model

1. Place your Wheat, Tomato, and Rice leaf datasets (from PlantVillage, PlantDoc, Mendeley Rice, Kaggle Wheat + ESP32-CAM field captures) into:
   ```text
   dataset/
   ├── train/<Crop>___<Disease>/
   └── val/<Crop>___<Disease>/
   ```
2. Run the 2-phase MobileNetV2 training + TFLite export script (Python 3.10–3.12 with TensorFlow):
   ```bash
   python ai-models/train_wheat_tomato_rice.py --data-dir ./dataset --epochs 15
   ```
3. Outputs are automatically saved to `ai-models/models/`:
   - `agroguard_3crop_mobilenetv2.keras`
   - `agroguard_3crop.tflite`
   - `class_labels.json`
4. Because `./ai-models/models` is mounted into `agroguard-ai-service`, the FastAPI container automatically loads your custom `.keras` weights on the next prediction!
