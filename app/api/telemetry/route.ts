import { NextRequest, NextResponse } from 'next/server';
import { verifyDeviceKey } from '@/lib/auth';
import { ingestTelemetryPacket } from '@/lib/store';
import { TelemetryIngestPacket } from '@/types';

export async function POST(req: NextRequest) {
  if (!verifyDeviceKey(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized device key' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Partial<TelemetryIngestPacket>;
    if (!body.sensors || !body.electrical) {
      return NextResponse.json(
        { ok: false, error: 'Missing required sensors or electrical telemetry object' },
        { status: 400 }
      );
    }

    const packet: TelemetryIngestPacket = {
      deviceId: body.deviceId ?? 'esp32-rover-01',
      cropType: body.cropType ?? 'Tomato',
      sensors: {
        temperatureC: Number(body.sensors.temperatureC ?? 25),
        humidityPct: Number(body.sensors.humidityPct ?? 65),
        soilMoisturePct: Number(body.sensors.soilMoisturePct ?? 55),
        lightLux: Number(body.sensors.lightLux ?? 18000),
        npk: {
          nitrogen: Number(body.sensors.npk?.nitrogen ?? 140),
          phosphorus: Number(body.sensors.npk?.phosphorus ?? 55),
          potassium: Number(body.sensors.npk?.potassium ?? 180),
        },
        obstacleDistanceCm: Number(body.sensors.obstacleDistanceCm ?? 100),
        irPathAligned: Boolean(body.sensors.irPathAligned ?? true),
      },
      electrical: {
        busVoltageV: Number(body.electrical.busVoltageV ?? 12.1),
        currentA: Number(body.electrical.currentA ?? 0.35),
        powerW: Number(
          body.electrical.powerW ??
            Number(body.electrical.busVoltageV ?? 12.1) * Number(body.electrical.currentA ?? 0.35)
        ),
        buck5vRailV: body.electrical.buck5vRailV,
        buck3v3RailV: body.electrical.buck3v3RailV,
        systemTempC: body.electrical.systemTempC,
        batterySocPct: body.electrical.batterySocPct,
        actuatorLatencyMs: body.electrical.actuatorLatencyMs,
      },
      rover: body.rover,
    };

    const { state, risk, commands } = await ingestTelemetryPacket(packet, true);

    return NextResponse.json({
      ok: true,
      timestamp: risk.timestamp,
      riskAssessment: risk,
      commands,
      systemMode: state.systemMode,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Telemetry ingestion failed' },
      { status: 400 }
    );
  }
}
