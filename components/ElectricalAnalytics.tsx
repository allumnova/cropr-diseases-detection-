'use client';

import React from 'react';
import {
  BatteryCharging,
  Cpu,
  Flame,
  Gauge,
  Timer,
  Zap,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SystemState } from '@/types';
import { cn, formatTimeShort } from '@/lib/utils';

export function ElectricalAnalytics({ state }: { state: SystemState }) {
  const e = state.latestElectrical;

  const historyData = state.electricalHistory.slice(-24).map((pt) => ({
    time: formatTimeShort(pt.timestamp),
    voltage: pt.busVoltageV,
    power: pt.powerW,
  }));

  const profileBenchmarks = [
    { state: 'Idle Monitoring', watts: 3.6 },
    { state: 'ESP32-CAM TX', watts: 5.4 },
    { state: '4WD Rover', watts: 11.2 },
    { state: '12V Pump Spray', watts: 9.8 },
    { state: 'Live Draw', watts: e.powerW },
  ];

  const isLowVoltage = e.busVoltageV < state.mitigationConfig.minBatteryVoltageV;

  return (
    <div className="space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <ElecCard
          icon={<BatteryCharging className={cn('h-4 w-4', isLowVoltage ? 'text-red-400' : 'text-zinc-400')} />}
          label="12V Bus Voltage"
          value={`${e.busVoltageV} V`}
          sub={`SoC ${e.batterySocPct}% · Min 10.8V`}
          warning={isLowVoltage}
        />
        <ElecCard
          icon={<Zap className="h-4 w-4 text-zinc-400" />}
          label="Load Current"
          value={`${e.currentA} A`}
          sub={e.operatingProfile.replace('_', ' ')}
        />
        <ElecCard
          icon={<Gauge className="h-4 w-4 text-zinc-400" />}
          label="Power Draw"
          value={`${e.powerW} W`}
          sub={`Session ${e.energyWh} Wh`}
        />
        <ElecCard
          icon={<Cpu className="h-4 w-4 text-zinc-400" />}
          label="Buck 5V / 3.3V"
          value={`${e.buck5vRailV}V / ${e.buck3v3RailV}V`}
          sub="LM2596 rail stability"
        />
        <ElecCard
          icon={<Timer className="h-4 w-4 text-zinc-400" />}
          label="Actuator Latency"
          value={`${e.actuatorLatencyMs} ms`}
          sub="MOSFET turn-on"
        />
        <ElecCard
          icon={<Flame className="h-4 w-4 text-zinc-400" />}
          label="System Temp"
          value={`${e.systemTempC} °C`}
          sub={e.systemTempC > 55 ? 'Thermal warning' : 'Nominal'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="saas-card p-5 lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-zinc-100">
              Power Consumption (W) &amp; Bus Voltage (V)
            </h3>
            <p className="text-xs text-zinc-500">
              INA219 I2C shunt telemetry across operating states
            </p>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="#1f2128" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#141519',
                    border: '1px solid #23252b',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="power"
                  name="Power (W)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="voltage"
                  name="Bus Voltage (V)"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="saas-card p-5">
          <h3 className="text-sm font-semibold text-zinc-100">Subsystem Load Profile</h3>
          <p className="mt-0.5 text-xs text-zinc-500">Average power draw by operating mode (W)</p>
          <div className="mt-4 h-[255px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={profileBenchmarks}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 6, bottom: 0 }}
              >
                <CartesianGrid stroke="#1f2128" horizontal={false} />
                <XAxis type="number" stroke="#71717a" fontSize={11} />
                <YAxis
                  dataKey="state"
                  type="category"
                  width={108}
                  stroke="#a1a1aa"
                  fontSize={11}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#141519',
                    border: '1px solid #23252b',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="watts" name="Power (W)" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function ElecCard({
  icon,
  label,
  value,
  sub,
  warning,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  warning?: boolean;
}) {
  return (
    <div
      className={cn(
        'saas-card p-4',
        warning && 'border-red-500/40 bg-red-500/5'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400">{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-xl font-semibold tabular-nums text-zinc-100">{value}</div>
      <p className="mt-1 text-[11px] text-zinc-500">{sub}</p>
    </div>
  );
}
