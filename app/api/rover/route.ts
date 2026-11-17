import { NextRequest, NextResponse } from 'next/server';
import { getSystemState, saveSystemState } from '@/lib/store';
import { RoverMotionState } from '@/types';
import { clamp, roundTo } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      motionState?: RoverMotionState;
      autonomousPatrol?: boolean;
      cameraPanDeg?: number;
      nozzleAngleDeg?: number;
    };

    const state = getSystemState();
    if (state.systemMode === 'EMERGENCY_STOP' && body.motionState && body.motionState !== 'STOP') {
      return NextResponse.json(
        { ok: false, error: 'Cannot move rover while EMERGENCY STOP is active.' },
        { status: 409 }
      );
    }

    const nextMotion: RoverMotionState =
      body.autonomousPatrol === true
        ? 'AUTO_PATROL'
        : body.autonomousPatrol === false && state.rover.motionState === 'AUTO_PATROL'
          ? 'STOP'
          : (body.motionState ?? state.rover.motionState);

    const moving = nextMotion !== 'STOP';
    const rpm = nextMotion === 'FORWARD' || nextMotion === 'AUTO_PATROL'
      ? ([44, 43, 44, 43] as [number, number, number, number])
      : nextMotion === 'REVERSE'
        ? ([-38, -38, -38, -38] as [number, number, number, number])
        : nextMotion === 'LEFT'
          ? ([-35, 35, -35, 35] as [number, number, number, number])
          : nextMotion === 'RIGHT'
            ? ([35, -35, 35, -35] as [number, number, number, number])
            : ([0, 0, 0, 0] as [number, number, number, number]);

    const nextPan = clamp(body.cameraPanDeg ?? state.rover.cameraPanDeg, 0, 180);
    const nextNozzle = clamp(body.nozzleAngleDeg ?? state.rover.nozzleAngleDeg, 0, 180);

    const nextRover = {
      ...state.rover,
      motionState: nextMotion,
      autonomousPatrol: body.autonomousPatrol ?? (nextMotion === 'AUTO_PATROL'),
      wheelEncodersRpm: rpm,
      distanceTraveledM: moving
        ? roundTo(state.rover.distanceTraveledM + 0.45, 2)
        : state.rover.distanceTraveledM,
      cameraPanDeg: nextPan,
      nozzleAngleDeg: nextNozzle,
      oledLine1: `ROVER: ${nextMotion}`,
      oledLine2: `CAM:${nextPan} NZL:${nextNozzle}`,
    };

    const nextState = saveSystemState({
      ...state,
      rover: nextRover,
      pendingCommands: {
        ...state.pendingCommands,
        roverAction: nextMotion,
        cameraPanDeg: nextPan,
        nozzleAngleDeg: nextNozzle,
        oledLine1: nextRover.oledLine1,
        oledLine2: nextRover.oledLine2,
      },
    });

    return NextResponse.json({ ok: true, state: nextState });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Rover control failed' },
      { status: 400 }
    );
  }
}
