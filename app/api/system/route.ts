import { NextRequest, NextResponse } from 'next/server';
import {
  getSystemState,
  ingestTelemetryPacket,
  saveSystemState,
  setActiveScenario,
  setSystemMode,
} from '@/lib/store';
import { generateSimulatedPacket } from '@/mqtt/hardware-simulator';
import { CropType, SimulatorScenario, SystemMode } from '@/types';

export async function GET() {
  const state = getSystemState();
  return NextResponse.json({ ok: true, state });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      action?: 'TICK_SIMULATOR' | 'SET_SCENARIO' | 'SET_MODE' | 'SET_CROP' | 'RESET_SIMULATION';
      scenario?: SimulatorScenario;
      mode?: SystemMode;
      cropType?: CropType;
    };

    const current = getSystemState();

    if (body.action === 'SET_SCENARIO' && body.scenario) {
      const updated = setActiveScenario(body.scenario);
      const packet = generateSimulatedPacket(body.scenario, updated.activeCrop, updated.rover);
      const { state } = await ingestTelemetryPacket(packet, false);
      return NextResponse.json({ ok: true, state });
    }

    if (body.action === 'SET_MODE' && body.mode) {
      const state = setSystemMode(body.mode);
      return NextResponse.json({ ok: true, state });
    }

    if (body.action === 'SET_CROP' && body.cropType) {
      const state = saveSystemState({ ...current, activeCrop: body.cropType });
      return NextResponse.json({ ok: true, state });
    }

    if (body.action === 'TICK_SIMULATOR') {
      const packet = generateSimulatedPacket(
        current.activeScenario,
        current.activeCrop,
        current.rover
      );
      const { state, risk, commands } = await ingestTelemetryPacket(packet, false);
      return NextResponse.json({ ok: true, state, risk, commands });
    }

    return NextResponse.json({ ok: true, state: current });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Invalid request' },
      { status: 400 }
    );
  }
}
