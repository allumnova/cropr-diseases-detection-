# 04 — Hardware–Software Communication Protocol (HTTP + MQTT)

This document defines the exact wire protocol linking the physical **ESP32 (38-Pin)**, **ESP32-CAM**, **Node.js MQTT Worker**, and **Next.js Application Server**. Any compliant firmware or hardware node can attach immediately without modifying server code.

---

## 1. Dual Transport Architecture (Zero-Friction Hardware Attachment)

1. **HTTP REST Mode (Recommended for Lab & Wi-Fi Prototyping)**:
   - The ESP32 pushes sensor + electrical + rover telemetry every 3–5 seconds to `POST /api/telemetry`.
   - The server **evaluates Stage 1 Risk** and **piggybacks any pending commands** (e.g., `cameraTrigger: true`, `pumpActivate: true`, `roverAction: "STOP"`) directly in the JSON response body.
   - The ESP32-CAM captures a JPEG when triggered and posts it to `POST /api/ai/analyze-image`.
2. **MQTT Pub/Sub Mode (Recommended for Multi-Node Field Deployment)**:
   - Handled by `/mqtt/worker.ts` subscribing to `agroguard/#` and forwarding validated frames into the same shared AI engine and persistence pipeline.

---

## 2. Authentication Header

All hardware endpoints accept optional device key validation via `x-device-key` header (configured via `AGROGUARD_DEVICE_KEY` environment variable; defaults to `hbtu-agroguard-2026` in dev mode):

```http
Content-Type: application/json
x-device-key: hbtu-agroguard-2026
```

---

## 3. HTTP REST Contracts

### 3.1 `POST /api/telemetry` (ESP32 Main Controller -> Server)

**Request Payload**:
```json
{
  "deviceId": "esp32-rover-01",
  "cropType": "Tomato",
  "sensors": {
    "temperatureC": 27.4,
    "humidityPct": 86.2,
    "soilMoisturePct": 68.5,
    "lightLux": 14200,
    "npk": { "nitrogen": 142, "phosphorus": 58, "potassium": 185 },
    "obstacleDistanceCm": 28.5,
    "irPathAligned": true
  },
  "electrical": {
    "busVoltageV": 11.84,
    "currentA": 0.42,
    "powerW": 4.97,
    "buck5vRailV": 5.01,
    "buck3v3RailV": 3.31,
    "systemTempC": 36.2,
    "batterySocPct": 82
  },
  "rover": {
    "motionState": "FORWARD",
    "wheelEncodersRpm": [42, 41, 42, 40],
    "distanceTraveledM": 12.4,
    "cameraPanDeg": 90,
    "nozzleAngleDeg": 45
  }
}
```

**Server Response (`200 OK`) — Includes Stage 1 Risk & Piggybacked Commands**:
```json
{
  "ok": true,
  "timestamp": "2026-11-15T12:00:00.000Z",
  "riskAssessment": {
    "riskScore": 78,
    "riskLevel": "ELEVATED",
    "leafWetnessIndex": 81.4,
    "triggerCamera": true,
    "summary": "High relative humidity (>85%) + warm foliage window favors Fungal Blight."
  },
  "commands": {
    "cameraTrigger": true,
    "cameraPanDeg": 90,
    "pumpActivate": false,
    "pumpDutyPct": 0,
    "pumpDurationMs": 0,
    "nozzleAngleDeg": 45,
    "roverAction": "STOP",
    "ledAlert": "AMBER_BLINK",
    "buzzerAlert": false,
    "oledLine1": "RISK: 78% ELEVATED",
    "oledLine2": "CAM CAPTURE ACTIVE"
  }
}
```

---

### 3.2 `POST /api/ai/analyze-image` (ESP32-CAM or UI -> Server)

**Request Payload** (`application/json` or `multipart/form-data`):
```json
{
  "deviceId": "esp32-cam-01",
  "cropType": "Tomato",
  "triggerReason": "RISK_THRESHOLD",
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "specimenId": "tomato-late-blight"
}
```
*(Note: Either `imageBase64` from live hardware/upload or `specimenId` from the test bench is accepted.)*

**Server Response (`200 OK`)**:
```json
{
  "ok": true,
  "detection": {
    "id": "det_1731672000",
    "cropType": "Tomato",
    "diseaseName": "Late Blight (Phytophthora infestans)",
    "isHealthy": false,
    "confidencePct": 94.2,
    "severityPct": 38.5,
    "affectedAreaPct": 29.0,
    "gradCamZones": [
      { "x": 38, "y": 44, "radius": 22, "intensity": 0.94 }
    ],
    "advisory": "Apply Metalaxyl + Mancozeb (2.5 g/L). Reduce overhead irrigation."
  },
  "mitigationDecision": {
    "approved": true,
    "actionType": "TARGETED_FUNGICIDE_SPRAY",
    "pumpDurationMs": 4500,
    "pumpDutyPct": 85,
    "nozzleAngleDeg": 55,
    "blockedReasons": []
  }
}
```

---

## 4. MQTT Topic Tree

| Topic | Direction | QoS | Description |
| :--- | :--- | :---: | :--- |
| `agroguard/{deviceId}/telemetry/sensors` | ESP32 -> Server | 0 | DHT22, Soil Moisture, BH1750, NPK, HC-SR04, IR |
| `agroguard/{deviceId}/telemetry/electrical` | ESP32 -> Server | 1 | INA219 Bus Voltage, Current, Power, Rail stability, Temp |
| `agroguard/{deviceId}/telemetry/rover` | ESP32 -> Server | 0 | 4WD motion state, wheel encoders RPM, servo angles |
| `agroguard/{deviceId}/cam/capture` | ESP32-CAM -> Server | 1 | Base64 JPEG payload + capture metadata |
| `agroguard/{deviceId}/cmd/mitigate` | Server -> ESP32 | 1 | Pump MOSFET PWM, duration, nozzle servo angle, alarm LED/buzzer |
| `agroguard/{deviceId}/cmd/rover` | Server -> ESP32 | 1 | `FORWARD`, `REVERSE`, `LEFT`, `RIGHT`, `STOP`, `AUTO_PATROL` |
| `agroguard/{deviceId}/cmd/camera` | Server -> ESP32-CAM | 1 | `CAPTURE_NOW`, `FLASH_ON`, `FLASH_OFF`, `PAN_ANGLE` |
