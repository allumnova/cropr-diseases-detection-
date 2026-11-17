import { NextRequest, NextResponse } from 'next/server';
import { verifyDeviceKey } from '@/lib/auth';
import { analyzeLeafImage, evaluateMitigationDecision } from '@/lib/ai-engine';
import { getSystemState, saveSystemState } from '@/lib/store';
import { AiProcessingMode, CropType, GradCamZone, ImageAnalysisResult } from '@/types';

export async function POST(req: NextRequest) {
  if (!verifyDeviceKey(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized device key' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      deviceId?: string;
      cropType?: CropType;
      specimenId?: string;
      imageBase64?: string;
      aiMode?: AiProcessingMode;
      triggerReason?: ImageAnalysisResult['triggerReason'];
      autoMitigate?: boolean;
      customVisualFeatures?: {
        chlorosisPct: number;
        necrosisPct: number;
        healthyGreenPct: number;
        gradCamZones?: GradCamZone[];
      };
    };

    const state = getSystemState();
    const cropType = body.cropType ?? state.activeCrop;

    const detection = await analyzeLeafImage({
      deviceId: body.deviceId ?? 'esp32-cam-01',
      cropType,
      specimenId: body.specimenId,
      imageBase64: body.imageBase64,
      aiMode: body.aiMode,
      triggerReason: body.triggerReason ?? 'MANUAL_UI',
      customVisualFeatures: body.customVisualFeatures,
      sensorContext: state.latestSensor,
    });

    const decision = evaluateMitigationDecision({
      detection,
      risk: state.latestRisk,
      electrical: state.latestElectrical,
      rover: state.rover,
      config: state.mitigationConfig,
      systemMode: state.systemMode,
      lastSprayAt: state.lastSprayAt,
    });

    const shouldApplyMitigation = body.autoMitigate !== false;
    const nextMitigationHistory = shouldApplyMitigation
      ? [...state.mitigationHistory, decision.action].slice(-40)
      : state.mitigationHistory;

    const nextRover = {
      ...state.rover,
      tankLevelPct:
        shouldApplyMitigation && decision.action.approved
          ? decision.action.tankLevelAfterPct
          : state.rover.tankLevelPct,
      nozzleAngleDeg: decision.commands.nozzleAngleDeg,
      ledAlert: decision.commands.ledAlert,
      buzzerAlert: decision.commands.buzzerAlert,
      oledLine1: decision.commands.oledLine1,
      oledLine2: decision.commands.oledLine2,
    };

    const nextState = saveSystemState({
      ...state,
      activeCrop: cropType,
      latestDetection: detection,
      detectionHistory: [...state.detectionHistory, detection].slice(-30),
      mitigationHistory: nextMitigationHistory,
      lastSprayAt:
        shouldApplyMitigation && decision.action.approved
          ? decision.action.timestamp
          : state.lastSprayAt,
      rover: nextRover,
      pendingCommands: decision.commands,
    });

    return NextResponse.json({
      ok: true,
      detection,
      mitigationDecision: decision.action,
      interlocks: decision.interlocks,
      commands: decision.commands,
      state: nextState,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Image analysis failed' },
      { status: 400 }
    );
  }
}
