'use client';

import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bell,
  Check,
  Droplet,
  Navigation,
  RefreshCw,
  Square,
  X,
} from 'lucide-react';
import { checkSafetyInterlocks } from '@/lib/ai-engine';
import { RoverMotionState, SystemState } from '@/types';
import { cn, formatTimeShort } from '@/lib/utils';

interface MitigationRoverPanelProps {
  state: SystemState;
  onStateChange: (nextState: SystemState) => void;
}

export function MitigationRoverPanel({ state, onStateChange }: MitigationRoverPanelProps) {
  const [dutyPct, setDutyPct] = useState(80);
  const [durationMs, setDurationMs] = useState(3500);
  const [busy, setBusy] = useState(false);

  const interlocks = checkSafetyInterlocks({
    confidencePct: state.latestDetection.confidencePct,
    electrical: state.latestElectrical,
    rover: state.rover,
    config: state.mitigationConfig,
    systemMode: state.systemMode,
    lastSprayAt: state.lastSprayAt,
  });

  async function callMitigation(payload: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch('/api/mitigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.ok && json.state) onStateChange(json.state);
    } finally {
      setBusy(false);
    }
  }

  async function callRover(payload: {
    motionState?: RoverMotionState;
    autonomousPatrol?: boolean;
    cameraPanDeg?: number;
    nozzleAngleDeg?: number;
  }) {
    const res = await fetch('/api/rover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.ok && json.state) onStateChange(json.state);
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Left: Pump Control & Safety Interlocks */}
      <div className="space-y-5 lg:col-span-6">
        <div className="saas-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <Droplet className="h-4 w-4 text-zinc-400" />
                <span>12V Pump &amp; Nozzle Control</span>
              </h2>
              <p className="text-xs text-zinc-500">
                IRLZ44N MOSFET PWM (GPIO 25) with 5 hardware safety interlocks
              </p>
            </div>
            <button
              onClick={() => callMitigation({ action: 'TEST_ALARM' })}
              className={cn(
                'flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors',
                state.rover.buzzerAlert
                  ? 'border-red-500/40 bg-red-500/10 text-red-400'
                  : 'border-[#23252b] bg-[#1b1d22] text-zinc-300 hover:bg-[#23262e]'
              )}
            >
              <Bell className="h-3.5 w-3.5" />
              <span>{state.rover.buzzerAlert ? 'Silence' : 'Test Alarm'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="saas-subcard p-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Tank Level</span>
                <span className="font-semibold tabular-nums text-zinc-100">
                  {state.rover.tankLevelPct}%
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-sm bg-zinc-800">
                <div
                  className={cn(
                    'h-full',
                    state.rover.tankLevelPct < 15 ? 'bg-red-500' : 'bg-emerald-500'
                  )}
                  style={{ width: `${state.rover.tankLevelPct}%` }}
                />
              </div>
              <button
                onClick={() => callMitigation({ action: 'REFILL_TANK' })}
                className="mt-3 flex h-7 w-full items-center justify-center gap-1.5 rounded border border-[#23252b] bg-[#141519] text-xs font-medium text-zinc-300 hover:bg-[#23262e]"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Refill (100%)</span>
              </button>
            </div>

            <div className="saas-subcard p-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Nozzle Angle (GPIO 26)</span>
                <span className="font-mono font-semibold tabular-nums text-zinc-100">
                  {state.rover.nozzleAngleDeg}°
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={180}
                value={state.rover.nozzleAngleDeg}
                onChange={(e) => callRover({ nozzleAngleDeg: Number(e.target.value) })}
                className="mt-3 w-full accent-emerald-500"
              />
              <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
                <span>0° Stem</span>
                <span>90° Canopy</span>
                <span>180° Upper</span>
              </div>
            </div>
          </div>

          {/* PWM & Duration */}
          <div className="saas-subcard mt-4 space-y-3 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">MOSFET PWM Duty</span>
              <span className="font-mono font-semibold tabular-nums text-zinc-100">{dutyPct}%</span>
            </div>
            <input
              type="range"
              min={20}
              max={100}
              step={5}
              value={dutyPct}
              onChange={(e) => setDutyPct(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Spray Duration</span>
              <span className="font-mono font-semibold tabular-nums text-zinc-100">
                {(durationMs / 1000).toFixed(1)} s
              </span>
            </div>
            <input
              type="range"
              min={1000}
              max={8000}
              step={500}
              value={durationMs}
              onChange={(e) => setDurationMs(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />

            <div className="flex gap-2 pt-1">
              <button
                disabled={busy || state.systemMode === 'EMERGENCY_STOP'}
                onClick={() =>
                  callMitigation({
                    action: 'MANUAL_SPRAY',
                    pumpDutyPct: dutyPct,
                    pumpDurationMs: durationMs,
                    nozzleAngleDeg: state.rover.nozzleAngleDeg,
                  })
                }
                className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-600 text-xs font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-40"
              >
                <Droplet className="h-3.5 w-3.5" />
                <span>Execute Spray Pulse</span>
              </button>
              <button
                onClick={() => callMitigation({ action: 'STOP_PUMP' })}
                className="h-9 rounded-md border border-red-500/30 bg-red-500/10 px-4 text-xs font-medium text-red-400 hover:bg-red-500/20"
              >
                Halt Pump
              </button>
            </div>
          </div>

          {/* 5 Safety Interlocks */}
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Safety Interlocks
              </h3>
              <button
                onClick={() =>
                  callMitigation({
                    action: 'UPDATE_CONFIG',
                    config: { autoSprayEnabled: !state.mitigationConfig.autoSprayEnabled },
                  })
                }
                className={cn(
                  'rounded border px-2 py-0.5 text-[11px] font-medium',
                  state.mitigationConfig.autoSprayEnabled
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-[#23252b] bg-[#1b1d22] text-zinc-400'
                )}
              >
                Auto-Spray: {state.mitigationConfig.autoSprayEnabled ? 'On' : 'Off'}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <InterlockRow
                label={`Confidence >= ${state.mitigationConfig.minConfidencePct}%`}
                passed={interlocks.confidenceGatePass}
              />
              <InterlockRow
                label={`Battery >= ${state.mitigationConfig.minBatteryVoltageV}V`}
                passed={interlocks.batteryVoltagePass}
              />
              <InterlockRow
                label={`Tank >= ${state.mitigationConfig.minTankLevelPct}%`}
                passed={interlocks.tankLevelPass}
              />
              <InterlockRow
                label={`Cooldown >= ${state.mitigationConfig.cooldownSec}s`}
                passed={interlocks.cooldownPass}
              />
              <InterlockRow label="Mode == AUTO" passed={interlocks.autoModePass} />
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="saas-card p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Mitigation Audit Log
          </h3>
          <div className="max-h-56 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#23252b] text-zinc-500">
                  <th className="pb-2 font-medium">Action</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 text-right font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23252b]">
                {[...state.mitigationHistory]
                  .reverse()
                  .slice(0, 8)
                  .map((log) => (
                    <tr key={log.id}>
                      <td className="py-2 pr-2">
                        <div className="font-medium text-zinc-200">{log.actionType}</div>
                        <div className="text-[11px] text-zinc-500">{log.notes}</div>
                      </td>
                      <td className="py-2 pr-2 align-top">
                        <span
                          className={cn(
                            'rounded border px-1.5 py-0.5 text-[10px] font-medium',
                            log.approved
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                              : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                          )}
                        >
                          {log.approved ? 'APPROVED' : 'BLOCKED'}
                        </span>
                      </td>
                      <td className="py-2 text-right align-top tabular-nums text-zinc-500">
                        {formatTimeShort(log.timestamp)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right: 4WD Rover & OLED Mirror */}
      <div className="space-y-5 lg:col-span-6">
        <div className="saas-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <Navigation className="h-4 w-4 text-zinc-400" />
                <span>4WD Rover Mobility (L298N)</span>
              </h2>
              <p className="text-xs text-zinc-500">
                Manual D-Pad, autonomous row patrol, wheel encoders, and HC-SR04 radar
              </p>
            </div>
            <button
              onClick={() => callRover({ autonomousPatrol: !state.rover.autonomousPatrol })}
              className={cn(
                'h-8 rounded-md border px-3 text-xs font-medium transition-colors',
                state.rover.autonomousPatrol
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  : 'border-[#23252b] bg-[#1b1d22] text-zinc-300 hover:bg-[#23262e]'
              )}
            >
              {state.rover.autonomousPatrol ? 'Patrol Active' : 'Start Patrol'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* D-Pad */}
            <div className="saas-subcard flex flex-col items-center justify-center p-4">
              <div className="grid grid-cols-3 gap-1.5">
                <div />
                <RoverBtn
                  active={state.rover.motionState === 'FORWARD'}
                  onClick={() => callRover({ motionState: 'FORWARD' })}
                  icon={<ArrowUp className="h-4 w-4" />}
                  label="Forward"
                />
                <div />
                <RoverBtn
                  active={state.rover.motionState === 'LEFT'}
                  onClick={() => callRover({ motionState: 'LEFT' })}
                  icon={<ArrowLeft className="h-4 w-4" />}
                  label="Left"
                />
                <RoverBtn
                  active={state.rover.motionState === 'STOP'}
                  onClick={() => callRover({ motionState: 'STOP', autonomousPatrol: false })}
                  icon={<Square className="h-3.5 w-3.5" />}
                  label="Stop"
                  danger
                />
                <RoverBtn
                  active={state.rover.motionState === 'RIGHT'}
                  onClick={() => callRover({ motionState: 'RIGHT' })}
                  icon={<ArrowRight className="h-4 w-4" />}
                  label="Right"
                />
                <div />
                <RoverBtn
                  active={state.rover.motionState === 'REVERSE'}
                  onClick={() => callRover({ motionState: 'REVERSE' })}
                  icon={<ArrowDown className="h-4 w-4" />}
                  label="Reverse"
                />
                <div />
              </div>
              <span className="mt-3 text-xs font-medium text-zinc-400">
                State: <span className="text-zinc-100">{state.rover.motionState}</span>
              </span>
            </div>

            {/* Navigation Sensors */}
            <div className="space-y-3">
              <div className="saas-subcard p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">HC-SR04 Distance</span>
                  <span
                    className={cn(
                      'font-mono font-semibold tabular-nums',
                      state.rover.obstacleDetected ? 'text-red-400' : 'text-zinc-100'
                    )}
                  >
                    {state.latestSensor.obstacleDistanceCm} cm
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">
                  {state.rover.obstacleDetected ? 'Obstacle within 25 cm' : 'Path clear'}
                </p>
              </div>

              <div className="saas-subcard p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">IR Line Lock</span>
                  <span className="font-medium text-zinc-200">
                    {state.rover.irPathAligned ? 'Aligned' : 'Drift'}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-zinc-400">
                  <span>Odometry</span>
                  <span className="font-mono tabular-nums text-zinc-100">
                    {state.rover.distanceTraveledM} m
                  </span>
                </div>
              </div>

              <div className="saas-subcard p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Camera Pan (GPIO 27)</span>
                  <span className="font-mono font-semibold tabular-nums text-zinc-100">
                    {state.rover.cameraPanDeg}°
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={180}
                  value={state.rover.cameraPanDeg}
                  onChange={(e) => callRover({ cameraPanDeg: Number(e.target.value) })}
                  className="mt-2 w-full accent-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Wheel Encoders */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            {state.rover.wheelEncodersRpm.map((rpm, i) => (
              <div key={i} className="saas-subcard p-2.5 text-center">
                <div className="text-[10px] text-zinc-500">Wheel {i + 1}</div>
                <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-zinc-100">
                  {rpm} RPM
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SSD1306 OLED Mirror */}
        <div className="saas-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              SSD1306 OLED Mirror (I2C 0x3C)
            </h3>
            <span className="text-xs text-zinc-400">LED: {state.rover.ledAlert}</span>
          </div>

          <div className="rounded-md border border-[#32353e] bg-[#09090b] p-4 font-mono">
            <div className="text-[11px] text-zinc-500">AGROGUARD HBTU EE</div>
            <div className="mt-1 text-sm font-semibold text-zinc-100">{state.rover.oledLine1}</div>
            <div className="text-xs text-emerald-400">{state.rover.oledLine2}</div>
            <div className="mt-2 flex justify-between border-t border-[#23252b] pt-1.5 text-[11px] text-zinc-500">
              <span>T:{state.latestSensor.temperatureC}C</span>
              <span>V:{state.latestElectrical.busVoltageV}V</span>
              <span>TNK:{state.rover.tankLevelPct}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InterlockRow({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-md border px-3 py-2 text-xs',
        passed
          ? 'border-[#23252b] bg-[#1b1d22] text-zinc-200'
          : 'border-red-500/30 bg-red-500/10 text-red-300'
      )}
    >
      <span className="flex items-center gap-1.5">
        {passed ? (
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <X className="h-3.5 w-3.5 text-red-400" />
        )}
        <span>{label}</span>
      </span>
      <span className="text-[10px] font-semibold uppercase text-zinc-400">
        {passed ? 'Pass' : 'Lock'}
      </span>
    </div>
  );
}

function RoverBtn({
  icon,
  label,
  active,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-md border transition-colors',
        danger
          ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
          : active
            ? 'border-emerald-500/50 bg-emerald-600 text-white'
            : 'border-[#23252b] bg-[#141519] text-zinc-300 hover:bg-[#23262e]'
      )}
    >
      {icon}
    </button>
  );
}
