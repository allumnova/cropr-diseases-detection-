/**
 * ============================================================================
 * Node.js MQTT Ingestion Worker (Physical Hardware Bridge)
 * ============================================================================
 * Bridges live MQTT messages from ESP32 & ESP32-CAM devices into the
 * Next.js /api/telemetry & /api/ai/analyze-image endpoints and publishes
 * returned hardware commands back to `agroguard/{deviceId}/cmd/*`.
 *
 * Run with: npm run mqtt:worker
 * ============================================================================
 */
import mqtt from 'mqtt';

const BROKER_URL = process.env.MQTT_BROKER_URL ?? 'mqtt://localhost:1883';
const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000';
const DEVICE_KEY = process.env.AGROGUARD_DEVICE_KEY ?? 'hbtu-agroguard-2026';

console.log(`[MQTT Worker] Connecting to broker ${BROKER_URL} ...`);
const client = mqtt.connect(BROKER_URL, {
  reconnectPeriod: 5000,
});

client.on('connect', () => {
  console.log('[MQTT Worker] Connected! Subscribing to agroguard/+/telemetry/# and agroguard/+/cam/#');
  client.subscribe('agroguard/+/telemetry/#');
  client.subscribe('agroguard/+/cam/capture');
});

client.on('error', (err) => {
  console.warn('[MQTT Worker] Broker connection notice (ensure Mosquitto/EMQX is running for physical MQTT mode):', err.message);
});

client.on('message', async (topic, payload) => {
  try {
    const parts = topic.split('/');
    const deviceId = parts[1] ?? 'esp32-rover-01';
    const data = JSON.parse(payload.toString('utf-8'));

    if (topic.includes('/telemetry/')) {
      const res = await fetch(`${SERVER_URL}/api/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': DEVICE_KEY,
        },
        body: JSON.stringify({ deviceId, ...data }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.commands) {
          client.publish(`agroguard/${deviceId}/cmd/mitigate`, JSON.stringify(json.commands));
          if (json.commands.cameraTrigger) {
            client.publish(`agroguard/${deviceId}/cmd/camera`, JSON.stringify({ action: 'CAPTURE_NOW' }));
          }
        }
      }
    } else if (topic.endsWith('/cam/capture')) {
      await fetch(`${SERVER_URL}/api/ai/analyze-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': DEVICE_KEY,
        },
        body: JSON.stringify({ deviceId, ...data }),
      });
    }
  } catch (err) {
    console.error('[MQTT Worker] Failed to process message:', err);
  }
});
