import fs from 'node:fs';
import path from 'node:path';
import {
  ElectricalMetrics,
  HardwareCommands,
  ImageAnalysisResult,
  MitigationAction,
  RiskAssessment,
  SensorReading,
  SimulatorScenario,
  SystemMode,
  SystemState,
  TelemetryIngestPacket,
} from '@/types';
import {
  analyzeLeafImage,
  computeLeafWetness,
  evaluateEnvironmentalRisk,
  evaluateMitigationDecision,
} from './ai-engine';
import { findDiseaseProfile } from './disease-knowledge-base';
import { clamp, roundTo } from './utils';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'agroguard-db.json');

function createSeedState(): SystemState {
  const now = Date.now();
  const sensorHistory: SensorReading[] = [];
  const electricalHistory: ElectricalMetrics[] = [];
  const riskHistory: RiskAssessment[] = [];

  // Seed 24 realistic points across recent field telemetry
  for (let i = 23; i >= 0; i--) {
    const ts = new Date(now - i * 5 * 60 * 1000).toISOString();
    const wave = Math.sin((24 - i) * 0.35);
    const temp = roundTo(25.2 + wave * 2.4, 1);
    const hum = roundTo(68 + wave * 12, 1);
    const soil = roundTo(56 - (24 - i) * 0.35, 1);
    const lux = Math.round(24000 - wave * 6500);
    const { lwi } = computeLeafWetness(temp, hum, lux);

    const reading: SensorReading = {
      timestamp: ts,
      deviceId: 'esp32-rover-01',
      cropType: 'Tomato',
      temperatureC: temp,
      humidityPct: hum,
      soilMoisturePct: soil,
      lightLux: lux,
      leafWetnessIndex: lwi,
      npk: {
        nitrogen: Math.round(145 - (24 - i) * 0.3),
        phosphorus: 58,
        potassium: 184,
      },
      obstacleDistanceCm: i % 7 === 0 ? 28 : 95,
      irPathAligned: true,
    };

    const risk = evaluateEnvironmentalRisk(reading, 60);
    const currentA = roundTo(0.28 + (i % 5 === 0 ? 0.55 : 0.08), 2);
    const busV = roundTo(12.28 - (24 - i) * 0.015, 2);

    const elec: ElectricalMetrics = {
      timestamp: ts,
      busVoltageV: busV,
      currentA,
      powerW: roundTo(busV * currentA, 2),
      energyWh: roundTo((24 - i) * 0.42, 2),
      buck5vRailV: 5.01,
      buck3v3RailV: 3.31,
      batterySocPct: Math.round(clamp(((busV - 10.2) / 2.4) * 100, 0, 100)),
      systemTempC: roundTo(33.4 + currentA * 3.1, 1),
      actuatorLatencyMs: 42 + (i % 15),
      operatingProfile: i % 5 === 0 ? 'ROVER_MOBILITY' : 'IDLE_MONITORING',
    };

    sensorHistory.push(reading);
    riskHistory.push(risk);
    electricalHistory.push(elec);
  }

  const latestSensor = sensorHistory[sensorHistory.length - 1]!;
  const latestRisk = riskHistory[riskHistory.length - 1]!;
  const latestElectrical = electricalHistory[electricalHistory.length - 1]!;

  const initialProfile = findDiseaseProfile('tomato-early-blight', false);
  const initialDetection: ImageAnalysisResult = {
    id: 'det_seed_01',
    timestamp: new Date(now - 12 * 60 * 1000).toISOString(),
    deviceId: 'esp32-cam-01',
    cropType: 'Tomato',
    diseaseId: initialProfile.id,
    diseaseName: initialProfile.diseaseName,
    pathogenType: initialProfile.pathogenType,
    isHealthy: false,
    confidencePct: initialProfile.defaultConfidencePct,
    severityPct: initialProfile.defaultSeverityPct,
    affectedAreaPct: initialProfile.defaultAffectedAreaPct,
    triggerReason: 'RISK_THRESHOLD',
    modelBackbone: 'MobileNetV2-GradCAM',
    inferenceMs: 128,
    gradCamZones: initialProfile.defaultGradCam,
    visualFeatures: initialProfile.visualSignature,
    advisory: initialProfile.advisory,
    recommendedTreatment: initialProfile.recommendedTreatment,
  };

  const initialMitigation: MitigationAction = {
    id: 'mit_seed_01',
    timestamp: new Date(now - 11 * 60 * 1000).toISOString(),
    detectionId: initialDetection.id,
    actionType: 'TARGETED_FUNGICIDE_SPRAY',
    approved: true,
    blockedReasons: [],
    pumpDutyPct: 75,
    pumpDurationMs: 3500,
    nozzleAngleDeg: 45,
    tankLevelAfterPct: 86.5,
    triggeredBy: 'AUTO_AI',
    notes: 'Automated Stage-3 targeted mist applied after Early Blight confirmation (92.8% confidence).',
  };

  const defaultCommands: HardwareCommands = {
    cameraTrigger: false,
    cameraPanDeg: 90,
    pumpActivate: false,
    pumpDutyPct: 0,
    pumpDurationMs: 0,
    nozzleAngleDeg: 45,
    roverAction: 'STOP',
    ledAlert: 'GREEN',
    buzzerAlert: false,
    oledLine1: 'AGROGUARD READY',
    oledLine2: `RISK:${Math.round(latestRisk.riskScore)}% ${latestRisk.riskLevel}`,
  };

  return {
    systemMode: 'AUTO',
    activeScenario: 'NORMAL_FIELD',
    activeCrop: 'Tomato',
    hardwareConnected: false,
    lastHardwareHeartbeat: null,
    lastSprayAt: initialMitigation.timestamp,
    latestSensor,
    latestRisk,
    latestElectrical,
    latestDetection: initialDetection,
    rover: {
      motionState: 'STOP',
      autonomousPatrol: false,
      wheelEncodersRpm: [0, 0, 0, 0],
      distanceTraveledM: 18.4,
      cameraPanDeg: 90,
      nozzleAngleDeg: 45,
      obstacleDetected: false,
      irPathAligned: true,
      pumpActive: false,
      pumpDutyPct: 0,
      tankLevelPct: 86.5,
      ledAlert: 'GREEN',
      buzzerAlert: false,
      oledLine1: 'AGROGUARD READY',
      oledLine2: `RISK:${Math.round(latestRisk.riskScore)}% ${latestRisk.riskLevel}`,
    },
    mitigationConfig: {
      minConfidencePct: 75,
      minBatteryVoltageV: 10.8,
      minTankLevelPct: 10,
      cooldownSec: 30,
      autoTriggerRiskScore: 60,
      autoSprayEnabled: true,
    },
    sensorHistory,
    electricalHistory,
    riskHistory,
    detectionHistory: [initialDetection],
    mitigationHistory: [initialMitigation],
    pendingCommands: defaultCommands,
  };
}

let cachedState: SystemState | null = null;

function persistState(state: SystemState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[AgroGuard Store] Could not write JSON persistence file:', err);
  }
}

export function getSystemState(): SystemState {
  if (cachedState) return cachedState;

  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      cachedState = JSON.parse(raw) as SystemState;
      return cachedState;
    }
  } catch (err) {
    console.warn('[AgroGuard Store] Corrupted DB file, re-seeding:', err);
  }

  cachedState = createSeedState();
  persistState(cachedState);
  return cachedState;
}

export function saveSystemState(nextState: SystemState): SystemState {
  cachedState = nextState;
  persistState(nextState);
  return cachedState;
}

function appendBounded<T>(arr: T[], item: T, limit = 60): T[] {
  const next = [...arr, item];
  return next.length > limit ? next.slice(next.length - limit) : next;
}

/**
 * Ingests a real ESP32 telemetry packet (or simulator packet), runs Stage 1 Risk Assessment,
 * updates electrical & rover metrics, and computes piggybacked hardware commands.
 */
export async function ingestTelemetryPacket(
  packet: TelemetryIngestPacket,
  fromRealHardware = true
): Promise<{ state: SystemState; risk: RiskAssessment; commands: HardwareCommands }> {
  const state = getSystemState();
  const nowIso = new Date().toISOString();

  const { lwi } = computeLeafWetness(
    packet.sensors.temperatureC,
    packet.sensors.humidityPct,
    packet.sensors.lightLux
  );

  const sensorReading: SensorReading = {
    timestamp: nowIso,
    deviceId: packet.deviceId,
    cropType: packet.cropType,
    temperatureC: roundTo(packet.sensors.temperatureC, 1),
    humidityPct: roundTo(packet.sensors.humidityPct, 1),
    soilMoisturePct: roundTo(packet.sensors.soilMoisturePct, 1),
    lightLux: Math.round(packet.sensors.lightLux),
    leafWetnessIndex: lwi,
    npk: packet.sensors.npk,
    obstacleDistanceCm: roundTo(packet.sensors.obstacleDistanceCm, 1),
    irPathAligned: packet.sensors.irPathAligned,
  };

  const risk = evaluateEnvironmentalRisk(
    sensorReading,
    state.mitigationConfig.autoTriggerRiskScore
  );

  const busV = roundTo(packet.electrical.busVoltageV, 2);
  const currentA = roundTo(packet.electrical.currentA, 2);
  const powerW = roundTo(packet.electrical.powerW || busV * currentA, 2);
  const prevEnergy = state.latestElectrical.energyWh;

  const operatingProfile: ElectricalMetrics['operatingProfile'] = state.rover.pumpActive
    ? 'PUMP_MITIGATION'
    : risk.triggerCamera
      ? 'CAMERA_TX_BURST'
      : (packet.rover?.motionState ?? state.rover.motionState) !== 'STOP'
        ? 'ROVER_MOBILITY'
        : 'IDLE_MONITORING';

  const electrical: ElectricalMetrics = {
    timestamp: nowIso,
    busVoltageV: busV,
    currentA,
    powerW,
    energyWh: roundTo(prevEnergy + powerW * (3 / 3600), 3),
    buck5vRailV: roundTo(packet.electrical.buck5vRailV ?? 5.01, 2),
    buck3v3RailV: roundTo(packet.electrical.buck3v3RailV ?? 3.31, 2),
    batterySocPct:
      packet.electrical.batterySocPct ??
      Math.round(clamp(((busV - 10.2) / 2.4) * 100, 0, 100)),
    systemTempC: roundTo(packet.electrical.systemTempC ?? sensorReading.temperatureC + 4.8, 1),
    actuatorLatencyMs: packet.electrical.actuatorLatencyMs ?? (risk.triggerCamera ? 58 : 41),
    operatingProfile,
  };

  const obstacleDetected = sensorReading.obstacleDistanceCm <= 25;
  const motionState = obstacleDetected
    ? 'STOP'
    : (packet.rover?.motionState ?? state.rover.motionState);

  const nextRover = {
    ...state.rover,
    motionState,
    wheelEncodersRpm: packet.rover?.wheelEncodersRpm ?? state.rover.wheelEncodersRpm,
    distanceTraveledM: roundTo(
      packet.rover?.distanceTraveledM ?? state.rover.distanceTraveledM,
      2
    ),
    cameraPanDeg: packet.rover?.cameraPanDeg ?? state.rover.cameraPanDeg,
    nozzleAngleDeg: packet.rover?.nozzleAngleDeg ?? state.rover.nozzleAngleDeg,
    obstacleDetected,
    irPathAligned: sensorReading.irPathAligned,
    ledAlert:
      risk.riskLevel === 'CRITICAL'
        ? ('RED_ALARM' as const)
        : risk.riskLevel === 'ELEVATED'
          ? ('AMBER_BLINK' as const)
          : ('GREEN' as const),
    buzzerAlert: risk.riskLevel === 'CRITICAL' || obstacleDetected,
    oledLine1: `T:${sensorReading.temperatureC}C H:${sensorReading.humidityPct}%`,
    oledLine2: `RISK:${Math.round(risk.riskScore)}% ${risk.riskLevel}`,
  };

  let nextDetection = state.latestDetection;
  let nextDetectionHistory = state.detectionHistory;
  let nextMitigationHistory = state.mitigationHistory;
  let nextLastSprayAt = state.lastSprayAt;
  let commands: HardwareCommands = {
    cameraTrigger: risk.triggerCamera,
    cameraPanDeg: nextRover.cameraPanDeg,
    pumpActivate: false,
    pumpDutyPct: 0,
    pumpDurationMs: 0,
    nozzleAngleDeg: nextRover.nozzleAngleDeg,
    roverAction: nextRover.motionState,
    ledAlert: nextRover.ledAlert,
    buzzerAlert: nextRover.buzzerAlert,
    oledLine1: nextRover.oledLine1,
    oledLine2: nextRover.oledLine2,
  };

  // Automatic Stage 1 -> Stage 2 -> Stage 3 escalation when camera trigger fires in AUTO mode
  if (
    risk.triggerCamera &&
    state.systemMode === 'AUTO' &&
    (!fromRealHardware || risk.triggerReason === 'RISK_THRESHOLD')
  ) {
    nextDetection = await analyzeLeafImage({
      cropType: packet.cropType,
      triggerReason: risk.triggerReason === 'OBSTACLE_PLANT' ? 'OBSTACLE_PLANT' : 'RISK_THRESHOLD',
      sensorContext: sensorReading,
    });
    nextDetectionHistory = appendBounded(nextDetectionHistory, nextDetection, 30);

    const decision = evaluateMitigationDecision({
      detection: nextDetection,
      risk,
      electrical,
      rover: nextRover,
      config: state.mitigationConfig,
      systemMode: state.systemMode,
      lastSprayAt: state.lastSprayAt,
    });
    nextMitigationHistory = appendBounded(nextMitigationHistory, decision.action, 40);
    if (decision.action.approved) {
      nextLastSprayAt = decision.action.timestamp;
      nextRover.tankLevelPct = decision.action.tankLevelAfterPct;
    }
    commands = { ...decision.commands, cameraTrigger: true };
    nextRover.oledLine1 = commands.oledLine1;
    nextRover.oledLine2 = commands.oledLine2;
  }

  const nextState: SystemState = {
    ...state,
    activeCrop: packet.cropType,
    hardwareConnected: fromRealHardware ? true : state.hardwareConnected,
    lastHardwareHeartbeat: fromRealHardware ? nowIso : state.lastHardwareHeartbeat,
    lastSprayAt: nextLastSprayAt,
    latestSensor: sensorReading,
    latestRisk: risk,
    latestElectrical: electrical,
    latestDetection: nextDetection,
    rover: nextRover,
    sensorHistory: appendBounded(state.sensorHistory, sensorReading, 60),
    electricalHistory: appendBounded(state.electricalHistory, electrical, 60),
    riskHistory: appendBounded(state.riskHistory, risk, 60),
    detectionHistory: nextDetectionHistory,
    mitigationHistory: nextMitigationHistory,
    pendingCommands: commands,
  };

  saveSystemState(nextState);
  return { state: nextState, risk, commands };
}

export function setActiveScenario(scenario: SimulatorScenario): SystemState {
  const state = getSystemState();
  return saveSystemState({ ...state, activeScenario: scenario });
}

export function setSystemMode(mode: SystemMode): SystemState {
  const state = getSystemState();
  const isEstop = mode === 'EMERGENCY_STOP';
  const nextRover = {
    ...state.rover,
    motionState: isEstop ? ('STOP' as const) : state.rover.motionState,
    autonomousPatrol: isEstop ? false : state.rover.autonomousPatrol,
    pumpActive: isEstop ? false : state.rover.pumpActive,
    pumpDutyPct: isEstop ? 0 : state.rover.pumpDutyPct,
    ledAlert: isEstop ? ('RED_ALARM' as const) : state.rover.ledAlert,
    buzzerAlert: isEstop ? true : false,
    oledLine1: isEstop ? '!! E-STOP ACTIVE !!' : 'AGROGUARD READY',
    oledLine2: isEstop ? 'MOTORS & PUMP OFF' : `MODE: ${mode}`,
  };
  return saveSystemState({
    ...state,
    systemMode: mode,
    rover: nextRover,
    pendingCommands: {
      ...state.pendingCommands,
      pumpActivate: false,
      pumpDutyPct: 0,
      roverAction: nextRover.motionState,
      ledAlert: nextRover.ledAlert,
      buzzerAlert: nextRover.buzzerAlert,
      oledLine1: nextRover.oledLine1,
      oledLine2: nextRover.oledLine2,
    },
  });
}
