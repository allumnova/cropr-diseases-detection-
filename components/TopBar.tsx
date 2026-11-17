'use client';

import React from 'react';
import {
  OctagonAlert,
  Pause,
  Play,
  Printer,
} from 'lucide-react';
import { CropType, SimulatorScenario, SystemMode, SystemState } from '@/types';
import { cn, formatTimeShort } from '@/lib/utils';
import type { TabId } from './Sidebar';

interface TopBarProps {
  state: SystemState;
  activeTab: TabId;
  simRunning: boolean;
  onToggleSim: () => void;
  onSelectScenario: (scenario: SimulatorScenario) => void;
  onSelectCrop: (crop: CropType) => void;
  onChangeMode: (mode: SystemMode) => void;
}

const TAB_TITLES: Record<TabId, string> = {
  overview: 'Overview',
  vision: 'AI Vision & ESP32-CAM',
  mitigation: 'Mitigation & 4WD Rover',
  electrical: 'Electrical Power',
  hardware: 'Hardware & Docs',
};

const SCENARIOS: { value: SimulatorScenario; label: string }[] = [
  { value: 'NORMAL_FIELD', label: 'Normal Field' },
  { value: 'FUNGAL_BLIGHT_OUTBREAK', label: 'Fungal Blight Spike' },
  { value: 'DROUGHT_HEAT_STRESS', label: 'Drought & NPK Stress' },
  { value: 'OBSTACLE_PLANT_TRIGGER', label: 'Plant Target (< 25 cm)' },
  { value: 'LOW_BATTERY_FAULT', label: 'Low Battery (< 10.8V)' },
];

const CROPS: CropType[] = ['Tomato', 'Rice', 'Wheat', 'Potato', 'Mango', 'Citrus'];

export function TopBar({
  state,
  activeTab,
  simRunning,
  onToggleSim,
  onSelectScenario,
  onSelectCrop,
  onChangeMode,
}: TopBarProps) {
  const isEstop = state.systemMode === 'EMERGENCY_STOP';

  return (
    <header className="no-print flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-[#23252b] bg-[#0f1012] px-4 py-2.5 sm:px-6">
      {/* Left: Breadcrumbs + Page Title + Timestamp */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span>AgroGuard</span>
            <span>/</span>
            <span className="text-zinc-300">{TAB_TITLES[activeTab]}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm font-semibold text-zinc-100">{TAB_TITLES[activeTab]}</h1>
            <span className="text-[11px] tabular-nums text-zinc-500">
              Updated {formatTimeShort(state.latestSensor.timestamp)}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Operational Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Active Crop"
          value={state.activeCrop}
          onChange={(e) => onSelectCrop(e.target.value as CropType)}
          className="h-8 rounded-md border border-[#23252b] bg-[#141519] px-2.5 text-xs font-medium text-zinc-200 outline-none focus:border-emerald-500/60"
        >
          {CROPS.map((crop) => (
            <option key={crop} value={crop}>
              {crop}
            </option>
          ))}
        </select>

        <select
          aria-label="Simulator Scenario"
          value={state.activeScenario}
          onChange={(e) => onSelectScenario(e.target.value as SimulatorScenario)}
          className="h-8 max-w-[175px] rounded-md border border-[#23252b] bg-[#141519] px-2.5 text-xs font-medium text-zinc-200 outline-none focus:border-emerald-500/60"
        >
          {SCENARIOS.map((sc) => (
            <option key={sc.value} value={sc.value}>
              {sc.label}
            </option>
          ))}
        </select>

        <button
          onClick={onToggleSim}
          className={cn(
            'flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors',
            simRunning
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15'
              : 'border-[#23252b] bg-[#141519] text-zinc-300 hover:bg-[#1b1d22]'
          )}
        >
          {simRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{simRunning ? 'Live' : 'Paused'}</span>
        </button>

        <button
          onClick={() => onChangeMode(state.systemMode === 'AUTO' ? 'MANUAL' : 'AUTO')}
          disabled={isEstop}
          className={cn(
            'h-8 rounded-md border px-2.5 text-xs font-medium transition-colors',
            state.systemMode === 'AUTO'
              ? 'border-[#23252b] bg-[#141519] text-zinc-200 hover:bg-[#1b1d22]'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-300',
            isEstop && 'opacity-50'
          )}
        >
          {state.systemMode}
        </button>

        <button
          onClick={() => window.print()}
          title="Print Editorial Status Report"
          className="flex h-8 items-center gap-1.5 rounded-md border border-[#23252b] bg-[#141519] px-2.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-[#1b1d22]"
        >
          <Printer className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Report</span>
        </button>

        <button
          onClick={() => onChangeMode(isEstop ? 'AUTO' : 'EMERGENCY_STOP')}
          className={cn(
            'flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold transition-colors',
            isEstop
              ? 'border-red-500 bg-red-600 text-white'
              : 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
          )}
        >
          <OctagonAlert className="h-3.5 w-3.5" />
          <span>{isEstop ? 'Reset' : 'E-Stop'}</span>
        </button>
      </div>
    </header>
  );
}
