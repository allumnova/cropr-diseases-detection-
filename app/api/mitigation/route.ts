import { NextRequest, NextResponse } from 'next/server';
import { evaluateMitigationDecision } from '@/lib/ai-engine';
import { getSystemState, saveSystemState } from '@/lib/store';
import { MitigationConfig } from '@/types';
import { clamp } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      action: 'MANUAL_SPRAY' | 'STOP_PUMP' | 'REFILL_TANK' | 'UPDATE_CONFIG' | 'TEST_ALARM';
      pumpDutyPct?: number;
      pumpDurationMs?: number;
      nozzleAngleDeg?: number;
      config?: Partial<MitigationConfig>;
    };

    const state = getSystemState();

    if (body.action === 'REFILL_TANK') {
      const nextState = saveSystemState({
        ...state,
        rover: { ...state.rover, tankLevelPct: 100 },
      });
      return NextResponse.json({ ok: true, state: nextState });
    }

    if (body.action === 'STOP_PUMP') {
      const nextState = saveSystemState({
        ...state,
        rover: {
          ...state.rover,
          pumpActive: false,
          pumpDutyPct: 0,
          oledLine2: 'PUMP HALTED',
        },
        pendingCommands: {
          ...state.pendingCommands,
          pumpActivate: false,
          pumpDutyPct: 0,
          pumpDurationMs: 0,
        },
      });
      return NextResponse.json({ ok: true, state: nextState });
    }

    if (body.action === 'TEST_ALARM') {
      const nextBuzzer = !state.rover.buzzerAlert;
      const nextState = saveSystemState({
        ...state,
        rover: {
          ...state.rover,
          buzzerAlert: nextBuzzer,
          ledAlert: nextBuzzer ? 'RED_ALARM' : 'GREEN',
        },
        pendingCommands: {
          ...state.pendingCommands,
          buzzerAlert: nextBuzzer,
          ledAlert: nextBuzzer ? 'RED_ALARM' : 'GREEN',
        },
      });
      return NextResponse.json({ ok: true, state: nextState });
    }

    if (body.action === 'UPDATE_CONFIG' && body.config) {
      const nextConfig: MitigationConfig = {
        ...state.mitigationConfig,
        ...body.config,
      };
      const nextState = saveSystemState({ ...state, mitigationConfig: nextConfig });
      return NextResponse.json({ ok: true, state: nextState });
    }

    if (body.action === 'MANUAL_SPRAY') {
      const duty = clamp(body.pumpDutyPct ?? 80, 20, 100);
      const durationMs = clamp(body.pumpDurationMs ?? 3000, 500, 8000);
      const angle = clamp(body.nozzleAngleDeg ?? state.rover.nozzleAngleDeg, 0, 180);

      const decision = evaluateMitigationDecision({
        detection: state.latestDetection,
        risk: state.latestRisk,
        electrical: state.latestElectrical,
        rover: { ...state.rover, nozzleAngleDeg: angle },
        config: state.mitigationConfig,
        systemMode: state.systemMode,
        lastSprayAt: state.lastSprayAt,
        forceManual: true,
      });

      const customAction = {
        ...decision.action,
        pumpDutyPct: decision.action.approved ? duty : 0,
        pumpDurationMs: decision.action.approved ? durationMs : 0,
        nozzleAngleDeg: angle,
      };

      const nextState = saveSystemState({
        ...state,
        lastSprayAt: customAction.approved ? customAction.timestamp : state.lastSprayAt,
        mitigationHistory: [...state.mitigationHistory, customAction].slice(-40),
        rover: {
          ...state.rover,
          nozzleAngleDeg: angle,
          tankLevelPct: customAction.tankLevelAfterPct,
          oledLine1: customAction.approved ? 'MANUAL SPRAY' : 'SPRAY BLOCKED',
          oledLine2: customAction.approved
            ? `PWM:${duty}% ${(durationMs / 1000).toFixed(1)}s`
            : 'CHECK INTERLOCKS',
        },
        pendingCommands: {
          ...decision.commands,
          pumpActivate: customAction.approved,
          pumpDutyPct: customAction.pumpDutyPct,
          pumpDurationMs: customAction.pumpDurationMs,
          nozzleAngleDeg: angle,
        },
      });

      return NextResponse.json({
        ok: true,
        interlocks: decision.interlocks,
        action: customAction,
        state: nextState,
      });
    }

    return NextResponse.json({ ok: true, state });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Mitigation command failed' },
      { status: 400 }
    );
  }
}
