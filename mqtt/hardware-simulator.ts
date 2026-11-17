import { CropType, RoverStatus, SimulatorScenario, TelemetryIngestPacket } from '@/types';
import { roundTo } from '@/lib/utils';

function jitter(base: number, spread: number): number {
  return base + (Math.random() * 2 - 1) * spread;
}

export function generateSimulatedPacket(
  scenario: SimulatorScenario,
  cropType: CropType,
  rover: RoverStatus
): TelemetryIngestPacket {
  const isPatrolling = rover.autonomousPatrol || rover.motionState !== 'STOP';
  const baseVoltage = scenario === 'LOW_BATTERY_FAULT' ? 10.45 : 12.14;
  const baseRpm = isPatrolling ? 42 : 0;

  let temp = jitter(26.0, 0.8);
  let humidity = jitter(62.0, 3.0);
  let soilMoisture = jitter(58.0, 2.5);
  let lux = Math.round(jitter(26000, 1800));
  let nitrogen = Math.round(jitter(142, 4));
  let phosphorus = Math.round(jitter(58, 2));
  let potassium = Math.round(jitter(182, 5));
  let obstacleCm = isPatrolling ? roundTo(jitter(75, 18), 1) : 110;
  let currentA = isPatrolling ? 0.92 : 0.31;

  switch (scenario) {
    case 'FUNGAL_BLIGHT_OUTBREAK':
      temp = jitter(23.5, 0.6);
      humidity = jitter(89.5, 2.5);
      soilMoisture = jitter(76.0, 3.0);
      lux = Math.round(jitter(7800, 900));
      currentA = 0.48;
      break;

    case 'DROUGHT_HEAT_STRESS':
      temp = jitter(35.8, 1.0);
      humidity = jitter(34.0, 2.5);
      soilMoisture = jitter(19.5, 2.0);
      lux = Math.round(jitter(54000, 3000));
      nitrogen = Math.round(jitter(78, 4));
      potassium = Math.round(jitter(92, 4));
      break;

    case 'OBSTACLE_PLANT_TRIGGER':
      obstacleCm = roundTo(jitter(22.0, 3.5), 1);
      humidity = jitter(74.0, 2.0);
      currentA = 0.41;
      break;

    case 'LOW_BATTERY_FAULT':
      currentA = 0.25;
      break;

    case 'NORMAL_FIELD':
    default:
      break;
  }

  if (rover.pumpActive) {
    currentA += 0.68;
  }

  return {
    deviceId: 'esp32-sim-01',
    cropType,
    sensors: {
      temperatureC: roundTo(temp, 1),
      humidityPct: roundTo(Math.min(Math.max(humidity, 15), 99), 1),
      soilMoisturePct: roundTo(Math.min(Math.max(soilMoisture, 5), 98), 1),
      lightLux: Math.max(200, lux),
      npk: { nitrogen, phosphorus, potassium },
      obstacleDistanceCm: obstacleCm,
      irPathAligned: true,
    },
    electrical: {
      busVoltageV: roundTo(jitter(baseVoltage, 0.06), 2),
      currentA: roundTo(currentA, 2),
      powerW: roundTo(baseVoltage * currentA, 2),
      buck5vRailV: roundTo(jitter(5.01, 0.02), 2),
      buck3v3RailV: roundTo(jitter(3.31, 0.01), 2),
      systemTempC: roundTo(temp + 5.2 + currentA * 2.1, 1),
      actuatorLatencyMs: 38 + Math.floor(Math.random() * 18),
    },
    rover: {
      motionState: rover.motionState,
      wheelEncodersRpm: [baseRpm, baseRpm, baseRpm, baseRpm],
      distanceTraveledM: isPatrolling ? roundTo(rover.distanceTraveledM + 0.35, 2) : rover.distanceTraveledM,
      cameraPanDeg: rover.cameraPanDeg,
      nozzleAngleDeg: rover.nozzleAngleDeg,
    },
  };
}
