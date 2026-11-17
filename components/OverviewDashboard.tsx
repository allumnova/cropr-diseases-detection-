'use client';

import React from 'react';
import {
  Camera,
  ChevronRight,
  Droplets,
  FlaskConical,
  Leaf,
  Sun,
  Thermometer,
  Waves,
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
import type { TabId } from './Sidebar';

interface OverviewDashboardProps {
  state: SystemState;
  onTriggerCapture: () => void;
  onNavigateTab: (tab: TabId) => void;
}

export function OverviewDashboard({
  state,
  onTriggerCapture,
  onNavigateTab,
}: OverviewDashboardProps) {
  const { latestSensor: s, latestRisk: r, latestDetection: det, rover } = state;

  const riskBadgeClass =
    r.riskLevel === 'CRITICAL'
      ? 'border-red-500/30 bg-red-500/10 text-red-400'
      : r.riskLevel === 'ELEVATED'
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
        : r.riskLevel === 'MODERATE'
          ? 'border-zinc-600 bg-zinc-800 text-zinc-200'
          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';

  const chartData = state.sensorHistory.slice(-20).map((item, idx) => ({
    time: formatTimeShort(item.timestamp),
    humidity: item.humidityPct,
    soil: item.soilMoisturePct,
    risk: state.riskHistory[state.riskHistory.length - 20 + idx]?.riskScore ?? r.riskScore,
  }));

  const pathogenBars = [
    { name: 'Fungal Blight', value: r.pathogens.fungalBlight },
    { name: 'Powdery Mildew', value: r.pathogens.powderyMildew },
    { name: 'Bacterial Wilt', value: r.pathogens.bacterialWilt },
    { name: 'Root / NPK', value: r.pathogens.rootAndNutrientStress },
  ];

  const latestMitigation = state.mitigationHistory[state.mitigationHistory.length - 1];

  return (
    <div className="space-y-5">
      {/* Pipeline Status Summary Bar */}
      <div className="saas-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              System Pipeline Status
            </h2>
          </div>
          <button
            onClick={onTriggerCapture}
            className="flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 px-3 text-xs font-medium text-white transition-colors hover:bg-emerald-500"
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Trigger Camera Scan</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="saas-subcard p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Stage 1 · Risk Assessment</span>
              <span className={cn('rounded border px-1.5 py-0.5 text-[11px] font-semibold tabular-nums', riskBadgeClass)}>
                {r.riskLevel} · {r.riskScore}%
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-300">{r.summary}</p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('vision')}
            className="saas-subcard p-3.5 text-left transition-colors hover:border-zinc-600"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Stage 2 · AI Vision</span>
              <span className="flex items-center gap-1 text-[11px] font-medium tabular-nums text-zinc-300">
                {det.confidencePct}% conf <ChevronRight className="h-3 w-3 text-zinc-500" />
              </span>
            </div>
            <p className="mt-2 truncate text-xs font-semibold text-zinc-100">{det.diseaseName}</p>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              {det.isHealthy ? 'Healthy tissue' : `Severity ${det.severityPct}% · ${det.modelBackbone}`}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('mitigation')}
            className="saas-subcard p-3.5 text-left transition-colors hover:border-zinc-600"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Stage 3 · Mitigation Gate</span>
              <span className="flex items-center gap-1 text-[11px] font-medium tabular-nums text-zinc-300">
                Tank {rover.tankLevelPct}% <ChevronRight className="h-3 w-3 text-zinc-500" />
              </span>
            </div>
            <p className="mt-2 text-xs font-semibold text-zinc-100">
              {latestMitigation?.approved ? 'Spray Executed' : 'Interlock Standby'}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-zinc-400">
              {latestMitigation?.actionType ?? 'NO_ACTION'}
            </p>
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          icon={<Thermometer className="h-4 w-4 text-zinc-400" />}
          label="Ambient Temp"
          value={`${s.temperatureC} °C`}
          sub={`Dew point ${r.dewPointC} °C`}
        />
        <KpiCard
          icon={<Droplets className="h-4 w-4 text-zinc-400" />}
          label="Rel. Humidity"
          value={`${s.humidityPct}%`}
          sub={s.humidityPct > 80 ? 'Fungal risk window' : 'Normal range'}
        />
        <KpiCard
          icon={<Waves className="h-4 w-4 text-zinc-400" />}
          label="Soil Moisture"
          value={`${s.soilMoisturePct}%`}
          sub={s.soilMoisturePct < 30 ? 'Irrigation needed' : 'Adequate'}
        />
        <KpiCard
          icon={<Sun className="h-4 w-4 text-zinc-400" />}
          label="Illuminance"
          value={`${s.lightLux.toLocaleString()} lx`}
          sub={s.lightLux < 10000 ? 'Low light / shade' : 'Daylight'}
        />
        <KpiCard
          icon={<Leaf className="h-4 w-4 text-zinc-400" />}
          label="Leaf Wetness"
          value={`${s.leafWetnessIndex}%`}
          sub={s.leafWetnessIndex > 65 ? 'Condensation high' : 'Surface dry'}
        />
        <div className="saas-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Soil NPK (mg/kg)</span>
            <FlaskConical className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="mt-2.5 space-y-1.5 text-xs">
            <NpkRow label="N" value={s.npk.nitrogen} max={240} />
            <NpkRow label="P" value={s.npk.phosphorus} max={120} />
            <NpkRow label="K" value={s.npk.potassium} max={280} />
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="saas-card p-5 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Environmental &amp; Disease Risk History
              </h3>
              <p className="text-xs text-zinc-500">
                Last 20 telemetry intervals from ESP32 sensor node
              </p>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#1f2128" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#141519',
                    border: '1px solid #23252b',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#f4f4f5',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  name="Humidity (%)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="soil"
                  name="Soil Moisture (%)"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="risk"
                  name="Risk Score (%)"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pathogen Conduciveness & Field Proximity */}
        <div className="saas-card flex flex-col justify-between p-5">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-100">Pathogen Conduciveness</h3>
              <span className="text-xs font-semibold tabular-nums text-zinc-300">
                Score {r.riskScore}%
              </span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500">
              Model breakdown based on micro-climate
            </p>

            <div className="mt-4 h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={pathogenBars}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 4, bottom: 0 }}
                >
                  <CartesianGrid stroke="#1f2128" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="#71717a" fontSize={11} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={96}
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
                  <Bar dataKey="value" name="Risk (%)" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[#23252b] pt-3 text-xs text-zinc-400">
            <span>HC-SR04: {s.obstacleDistanceCm} cm</span>
            <span>IR Row: {s.irPathAligned ? 'Aligned' : 'Drift'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="saas-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400">{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-zinc-100">
        {value}
      </div>
      <p className="mt-1 text-[11px] text-zinc-500">{sub}</p>
    </div>
  );
}

function NpkRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <span className="w-3 font-medium text-zinc-400">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-zinc-800">
        <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right font-mono text-[11px] tabular-nums text-zinc-300">
        {value}
      </span>
    </div>
  );
}
