export type RiskLevel = 'LOW' | 'MODERATE' | 'ELEVATED' | 'CRITICAL';

export type SystemMode = 'AUTO' | 'MANUAL' | 'EMERGENCY_STOP';

export type RoverMotionState = 'STOP' | 'FORWARD' | 'REVERSE' | 'LEFT' | 'RIGHT' | 'AUTO_PATROL';

export type SimulatorScenario =
  | 'NORMAL_FIELD'
  | 'FUNGAL_BLIGHT_OUTBREAK'
  | 'DROUGHT_HEAT_STRESS'
  | 'OBSTACLE_PLANT_TRIGGER'
  | 'LOW_BATTERY_FAULT';

export type CropType = 'Tomato' | 'Rice' | 'Wheat' | 'Potato' | 'Mango' | 'Citrus';

export type AiProcessingMode = 'HYBRID_LLM_RULES' | 'CUSTOM_CNN_SERVICE' | 'RULE_BASED_SPECTRAL';

export interface NpkReading {
  nitrogen: number; // mg/kg
  phosphorus: number; // mg/kg
  potassium: number; // mg/kg
}

export interface SensorReading {
  timestamp: string;
  deviceId: string;
  cropType: CropType;
  temperatureC: number;
  humidityPct: number;
  soilMoisturePct: number;
  lightLux: number;
  leafWetnessIndex: number; // 0-100 computed or measured
  npk: NpkReading;
  obstacleDistanceCm: number;
  irPathAligned: boolean;
}

export interface ElectricalMetrics {
  timestamp: string;
  busVoltageV: number; // 12V battery rail via INA219
  currentA: number; // instantaneous current draw (A)
  powerW: number; // instantaneous power (W)
  energyWh: number; // cumulative session energy (Wh)
  buck5vRailV: number; // LM2596 regulated 5V rail
  buck3v3RailV: number; // AMS1117 3.3V logic rail
  batterySocPct: number; // 0-100%
  systemTempC: number; // enclosure/MOSFET thermal reading
  actuatorLatencyMs: number; // command -> actuator turn-on latency
  operatingProfile: 'IDLE_MONITORING' | 'CAMERA_TX_BURST' | 'ROVER_MOBILITY' | 'PUMP_MITIGATION';
}

export interface PathogenBreakdown {
  fungalBlight: number; // 0-100
  powderyMildew: number; // 0-100
  bacterialWilt: number; // 0-100
  rootAndNutrientStress: number; // 0-100
}

export interface RiskAssessment {
  timestamp: string;
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  leafWetnessIndex: number;
  dewPointC: number;
  triggerCamera: boolean;
  triggerReason: 'NONE' | 'RISK_THRESHOLD' | 'OBSTACLE_PLANT' | 'MANUAL_UI';
  pathogens: PathogenBreakdown;
  summary: string;
}

export interface GradCamZone {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  radius: number; // percentage radius
  intensity: number; // 0-1
  label: string;
}

export interface ImageAnalysisResult {
  id: string;
  timestamp: string;
  deviceId: string;
  cropType: CropType;
  diseaseId: string;
  diseaseName: string;
  pathogenType: 'Fungal' | 'Bacterial' | 'Viral' | 'Healthy' | 'Abiotic';
  isHealthy: boolean;
  confidencePct: number;
  severityPct: number;
  affectedAreaPct: number;
  triggerReason: 'RISK_THRESHOLD' | 'OBSTACLE_PLANT' | 'MANUAL_UI' | 'ESP32_CAM_AUTO';
  modelBackbone:
    | 'MobileNetV2-GradCAM'
    | 'EfficientNetB0-XAI'
    | 'OpenAI-GPT4o-Vision'
    | 'Gemini-Vision-Hybrid'
    | 'Python-FastAPI-CNN';
  aiModeUsed?: AiProcessingMode;
  llmReasoning?: string;
  inferenceMs: number;
  gradCamZones: GradCamZone[];
  visualFeatures: {
    chlorosisPct: number;
    necrosisPct: number;
    healthyGreenPct: number;
  };
  advisory: string;
  recommendedTreatment: string;
  imageUrl?: string;
}

export interface InterlockStatus {
  confidenceGatePass: boolean;
  batteryVoltagePass: boolean;
  tankLevelPass: boolean;
  cooldownPass: boolean;
  autoModePass: boolean;
  allPassed: boolean;
  blockedReasons: string[];
}

export interface MitigationAction {
  id: string;
  timestamp: string;
  detectionId?: string;
  actionType:
    | 'TARGETED_FUNGICIDE_SPRAY'
    | 'IRRIGATION_PULSE'
    | 'NUTRIENT_FOLIAR_SPRAY'
    | 'ALERT_ONLY_BLOCKED'
    | 'MANUAL_SPRAY'
    | 'NO_ACTION_HEALTHY';
  approved: boolean;
  blockedReasons: string[];
  pumpDutyPct: number;
  pumpDurationMs: number;
  nozzleAngleDeg: number;
  tankLevelAfterPct: number;
  triggeredBy: 'AUTO_AI' | 'MANUAL_UI' | 'SAFETY_LOCK';
  notes: string;
}

export interface MitigationConfig {
  minConfidencePct: number; // default 75
  minBatteryVoltageV: number; // default 10.8
  minTankLevelPct: number; // default 10
  cooldownSec: number; // default 30
  autoTriggerRiskScore: number; // default 60
  autoSprayEnabled: boolean;
}

export interface RoverStatus {
  motionState: RoverMotionState;
  autonomousPatrol: boolean;
  wheelEncodersRpm: [number, number, number, number];
  distanceTraveledM: number;
  cameraPanDeg: number;
  nozzleAngleDeg: number;
  obstacleDetected: boolean;
  irPathAligned: boolean;
  pumpActive: boolean;
  pumpDutyPct: number;
  tankLevelPct: number;
  ledAlert: 'GREEN' | 'AMBER_BLINK' | 'RED_ALARM';
  buzzerAlert: boolean;
  oledLine1: string;
  oledLine2: string;
}

export interface HardwareCommands {
  cameraTrigger: boolean;
  cameraPanDeg: number;
  pumpActivate: boolean;
  pumpDutyPct: number;
  pumpDurationMs: number;
  nozzleAngleDeg: number;
  roverAction: RoverMotionState;
  ledAlert: 'GREEN' | 'AMBER_BLINK' | 'RED_ALARM';
  buzzerAlert: boolean;
  oledLine1: string;
  oledLine2: string;
}

export interface TelemetryIngestPacket {
  deviceId: string;
  cropType: CropType;
  sensors: {
    temperatureC: number;
    humidityPct: number;
    soilMoisturePct: number;
    lightLux: number;
    npk: NpkReading;
    obstacleDistanceCm: number;
    irPathAligned: boolean;
  };
  electrical: {
    busVoltageV: number;
    currentA: number;
    powerW: number;
    buck5vRailV?: number;
    buck3v3RailV?: number;
    systemTempC?: number;
    batterySocPct?: number;
    actuatorLatencyMs?: number;
  };
  rover?: {
    motionState?: RoverMotionState;
    wheelEncodersRpm?: [number, number, number, number];
    distanceTraveledM?: number;
    cameraPanDeg?: number;
    nozzleAngleDeg?: number;
  };
}

export interface SystemState {
  systemMode: SystemMode;
  activeScenario: SimulatorScenario;
  activeCrop: CropType;
  hardwareConnected: boolean;
  lastHardwareHeartbeat: string | null;
  lastSprayAt: string | null;
  latestSensor: SensorReading;
  latestRisk: RiskAssessment;
  latestElectrical: ElectricalMetrics;
  latestDetection: ImageAnalysisResult;
  rover: RoverStatus;
  mitigationConfig: MitigationConfig;
  sensorHistory: SensorReading[];
  electricalHistory: ElectricalMetrics[];
  riskHistory: RiskAssessment[];
  detectionHistory: ImageAnalysisResult[];
  mitigationHistory: MitigationAction[];
  pendingCommands: HardwareCommands;
}
