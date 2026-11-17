-- ============================================================================
-- 06 — PostgreSQL + TimescaleDB Schema
-- Project: AI-Based Electrical Support System for Crop Disease Identification & Mitigation
-- Institution: Dept. of Electrical Engineering, HBTU Kanpur
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Registered Hardware Nodes (ESP32 Main Controller & ESP32-CAM)
CREATE TABLE IF NOT EXISTS devices (
    device_id       VARCHAR(64) PRIMARY KEY,
    device_type     VARCHAR(32) NOT NULL CHECK (device_type IN ('ESP32_MAIN', 'ESP32_CAM')),
    firmware_ver    VARCHAR(24) NOT NULL DEFAULT '1.0.0',
    crop_type       VARCHAR(64) NOT NULL DEFAULT 'Tomato',
    field_zone      VARCHAR(64) NOT NULL DEFAULT 'HBTU-TestPlot-A',
    status          VARCHAR(16) NOT NULL DEFAULT 'ONLINE',
    last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Stage 1 Environmental & Soil Telemetry (Time-Series Hypertable)
CREATE TABLE IF NOT EXISTS sensor_telemetry (
    time                TIMESTAMPTZ NOT NULL,
    device_id           VARCHAR(64) NOT NULL REFERENCES devices(device_id),
    crop_type           VARCHAR(64) NOT NULL,
    temperature_c       DOUBLE PRECISION NOT NULL,
    humidity_pct        DOUBLE PRECISION NOT NULL,
    soil_moisture_pct   DOUBLE PRECISION NOT NULL,
    light_lux           DOUBLE PRECISION NOT NULL,
    leaf_wetness_index  DOUBLE PRECISION NOT NULL,
    nitrogen_mg_kg      DOUBLE PRECISION NOT NULL,
    phosphorus_mg_kg    DOUBLE PRECISION NOT NULL,
    potassium_mg_kg     DOUBLE PRECISION NOT NULL,
    obstacle_dist_cm    DOUBLE PRECISION NOT NULL,
    ir_path_aligned     BOOLEAN NOT NULL DEFAULT TRUE,
    risk_score          DOUBLE PRECISION NOT NULL,
    risk_level          VARCHAR(16) NOT NULL CHECK (risk_level IN ('LOW', 'MODERATE', 'ELEVATED', 'CRITICAL'))
);

SELECT create_hypertable('sensor_telemetry', 'time', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS idx_sensor_device_time ON sensor_telemetry (device_id, time DESC);

-- 3. Stage 4 Electrical Performance Telemetry (Time-Series Hypertable)
CREATE TABLE IF NOT EXISTS electrical_telemetry (
    time                TIMESTAMPTZ NOT NULL,
    device_id           VARCHAR(64) NOT NULL REFERENCES devices(device_id),
    bus_voltage_v       DOUBLE PRECISION NOT NULL,
    current_a           DOUBLE PRECISION NOT NULL,
    power_w             DOUBLE PRECISION NOT NULL,
    energy_wh           DOUBLE PRECISION NOT NULL,
    buck_5v_rail_v      DOUBLE PRECISION NOT NULL,
    buck_3v3_rail_v     DOUBLE PRECISION NOT NULL,
    battery_soc_pct     DOUBLE PRECISION NOT NULL,
    system_temp_c       DOUBLE PRECISION NOT NULL,
    actuator_latency_ms INTEGER NOT NULL DEFAULT 0,
    operating_mode      VARCHAR(32) NOT NULL DEFAULT 'MONITORING'
);

SELECT create_hypertable('electrical_telemetry', 'time', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS idx_elec_device_time ON electrical_telemetry (device_id, time DESC);

-- 4. Stage 2 AI Vision Disease Identifications
CREATE TABLE IF NOT EXISTS disease_detections (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    detected_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_id           VARCHAR(64) NOT NULL REFERENCES devices(device_id),
    crop_type           VARCHAR(64) NOT NULL,
    disease_name        VARCHAR(128) NOT NULL,
    is_healthy          BOOLEAN NOT NULL,
    confidence_pct      DOUBLE PRECISION NOT NULL,
    severity_pct        DOUBLE PRECISION NOT NULL,
    affected_area_pct   DOUBLE PRECISION NOT NULL,
    trigger_reason      VARCHAR(32) NOT NULL,
    model_backbone      VARCHAR(64) NOT NULL DEFAULT 'MobileNetV2-GradCAM',
    inference_ms        INTEGER NOT NULL,
    grad_cam_json       JSONB NOT NULL DEFAULT '[]'::jsonb,
    advisory_text       TEXT NOT NULL,
    image_ref           TEXT
);

CREATE INDEX IF NOT EXISTS idx_detections_time ON disease_detections (detected_at DESC);

-- 5. Stage 3 Mitigation & Safety Interlock Logs
CREATE TABLE IF NOT EXISTS mitigation_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    executed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_id           VARCHAR(64) NOT NULL REFERENCES devices(device_id),
    detection_id        UUID REFERENCES disease_detections(id),
    action_type         VARCHAR(64) NOT NULL,
    approved            BOOLEAN NOT NULL,
    blocked_reasons     JSONB NOT NULL DEFAULT '[]'::jsonb,
    pump_duty_pct       INTEGER NOT NULL DEFAULT 0,
    pump_duration_ms    INTEGER NOT NULL DEFAULT 0,
    nozzle_angle_deg    INTEGER NOT NULL DEFAULT 45,
    tank_level_after    DOUBLE PRECISION NOT NULL,
    triggered_by        VARCHAR(32) NOT NULL CHECK (triggered_by IN ('AUTO_AI', 'MANUAL_UI', 'SAFETY_LOCK'))
);

-- 6. Users & Operators (NextAuth v5 compatible)
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(128) NOT NULL,
    email           VARCHAR(128) UNIQUE NOT NULL,
    role            VARCHAR(32) NOT NULL DEFAULT 'RESEARCHER',
    password_hash   TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
