'use client';

import React, { useEffect, useState } from 'react';
import { CropType, SimulatorScenario, SystemMode, SystemState } from '@/types';
import { Sidebar, TabId } from './Sidebar';
import { TopBar } from './TopBar';
import { OverviewDashboard } from './OverviewDashboard';
import { VisionStudio } from './VisionStudio';
import { MitigationRoverPanel } from './MitigationRoverPanel';
import { ElectricalAnalytics } from './ElectricalAnalytics';
import { HardwareDocsHub } from './HardwareDocsHub';
import { formatTimeShort } from '@/lib/utils';

export function DashboardShell({ initialState }: { initialState: SystemState }) {
  const [state, setState] = useState<SystemState>(initialState);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [simRunning, setSimRunning] = useState(true);

  useEffect(() => {
    if (!simRunning) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch('/api/system', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'TICK_SIMULATOR' }),
        });
        const json = await res.json();
        if (json.ok && json.state) {
          setState(json.state);
        }
      } catch {
        // Retain last valid state on transient error
      }
    }, 4000);
    return () => clearInterval(id);
  }, [simRunning]);

  async function handleSelectScenario(scenario: SimulatorScenario) {
    const res = await fetch('/api/system', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SET_SCENARIO', scenario }),
    });
    const json = await res.json();
    if (json.ok && json.state) setState(json.state);
  }

  async function handleSelectCrop(cropType: CropType) {
    const res = await fetch('/api/system', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SET_CROP', cropType }),
    });
    const json = await res.json();
    if (json.ok && json.state) setState(json.state);
  }

  async function handleChangeMode(mode: SystemMode) {
    const res = await fetch('/api/system', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SET_MODE', mode }),
    });
    const json = await res.json();
    if (json.ok && json.state) setState(json.state);
  }

  async function handleQuickCapture() {
    const res = await fetch('/api/ai/analyze-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cropType: state.activeCrop,
        triggerReason: 'MANUAL_UI',
      }),
    });
    const json = await res.json();
    if (json.ok && json.state) {
      setState(json.state);
      setActiveTab('vision');
    }
  }

  const isRealHw =
    state.hardwareConnected &&
    state.lastHardwareHeartbeat !== null &&
    Date.now() - new Date(state.lastHardwareHeartbeat).getTime() < 20000;

  return (
    <div className="flex min-h-screen flex-col bg-[#09090b] text-zinc-100 lg:flex-row">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        deviceId={state.latestSensor.deviceId}
        hardwareConnected={isRealHw}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          state={state}
          activeTab={activeTab}
          simRunning={simRunning}
          onToggleSim={() => setSimRunning((v) => !v)}
          onSelectScenario={handleSelectScenario}
          onSelectCrop={handleSelectCrop}
          onChangeMode={handleChangeMode}
        />

        <main className="no-print mx-auto w-full max-w-[1380px] flex-1 p-4 sm:p-6">
          {activeTab === 'overview' && (
            <OverviewDashboard
              state={state}
              onTriggerCapture={handleQuickCapture}
              onNavigateTab={setActiveTab}
            />
          )}
          {activeTab === 'vision' && (
            <VisionStudio state={state} onAnalysisComplete={setState} />
          )}
          {activeTab === 'mitigation' && (
            <MitigationRoverPanel state={state} onStateChange={setState} />
          )}
          {activeTab === 'electrical' && <ElectricalAnalytics state={state} />}
          {activeTab === 'hardware' && (
            <HardwareDocsHub state={state} onHardwarePacketSent={setState} />
          )}
        </main>

        {/* Dedicated White Editorial Printable Summary (visible only during print) */}
        <section className="print-only p-4 text-black">
          <div className="border-b-2 border-zinc-900 pb-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
              Department of Electrical Engineering · HBTU Kanpur · UPCST 2026–2027
            </div>
            <h1 className="mt-1 text-xl font-bold text-zinc-900">
              AgroGuard System Telemetry &amp; Diagnostic Report
            </h1>
            <p className="mt-1 text-xs text-zinc-600">
              Generated: {new Date().toLocaleString('en-IN')} · Active Crop: {state.activeCrop} ·
              Mode: {state.systemMode} · Node: {state.latestSensor.deviceId}
            </p>
          </div>

          <h2 className="mt-5 text-sm font-bold uppercase tracking-wide text-zinc-800">
            1. Stage 1 Environmental &amp; Risk Summary
          </h2>
          <table className="mt-2 w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-400 text-left">
                <th className="py-1.5">Temperature</th>
                <th className="py-1.5">Humidity</th>
                <th className="py-1.5">Soil Moisture</th>
                <th className="py-1.5">Light (Lux)</th>
                <th className="py-1.5">Leaf Wetness</th>
                <th className="py-1.5">Risk Score</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-200">
                <td className="py-1.5">{state.latestSensor.temperatureC} °C</td>
                <td className="py-1.5">{state.latestSensor.humidityPct}%</td>
                <td className="py-1.5">{state.latestSensor.soilMoisturePct}%</td>
                <td className="py-1.5">{state.latestSensor.lightLux} lx</td>
                <td className="py-1.5">{state.latestRisk.leafWetnessIndex}%</td>
                <td className="py-1.5 font-bold">
                  {state.latestRisk.riskScore}% ({state.latestRisk.riskLevel})
                </td>
              </tr>
            </tbody>
          </table>

          <h2 className="mt-5 text-sm font-bold uppercase tracking-wide text-zinc-800">
            2. Stage 2 Latest AI Vision Identification
          </h2>
          <div className="mt-2 rounded border border-zinc-300 p-3 text-xs">
            <div>
              <strong>Diagnosis:</strong> {state.latestDetection.diseaseName} (
              {state.latestDetection.confidencePct}% confidence, Severity{' '}
              {state.latestDetection.severityPct}%)
            </div>
            <div className="mt-1">
              <strong>Recommended Treatment:</strong> {state.latestDetection.recommendedTreatment}
            </div>
            <div className="mt-1">
              <strong>Advisory:</strong> {state.latestDetection.advisory}
            </div>
          </div>

          <h2 className="mt-5 text-sm font-bold uppercase tracking-wide text-zinc-800">
            3. Stage 4 Electrical Telemetry (INA219 &amp; BMS)
          </h2>
          <table className="mt-2 w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-400 text-left">
                <th className="py-1.5">Bus Voltage</th>
                <th className="py-1.5">Current</th>
                <th className="py-1.5">Power</th>
                <th className="py-1.5">5V / 3.3V Rails</th>
                <th className="py-1.5">Latency</th>
                <th className="py-1.5">Tank Level</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-200">
                <td className="py-1.5">
                  {state.latestElectrical.busVoltageV} V ({state.latestElectrical.batterySocPct}%)
                </td>
                <td className="py-1.5">{state.latestElectrical.currentA} A</td>
                <td className="py-1.5">{state.latestElectrical.powerW} W</td>
                <td className="py-1.5">
                  {state.latestElectrical.buck5vRailV}V / {state.latestElectrical.buck3v3RailV}V
                </td>
                <td className="py-1.5">{state.latestElectrical.actuatorLatencyMs} ms</td>
                <td className="py-1.5">{state.rover.tankLevelPct}%</td>
              </tr>
            </tbody>
          </table>

          <h2 className="mt-5 text-sm font-bold uppercase tracking-wide text-zinc-800">
            4. Recent Mitigation Audit Log
          </h2>
          <table className="mt-2 w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-400 text-left">
                <th className="py-1.5">Time</th>
                <th className="py-1.5">Action</th>
                <th className="py-1.5">Status</th>
                <th className="py-1.5">Notes</th>
              </tr>
            </thead>
            <tbody>
              {state.mitigationHistory.slice(-5).reverse().map((m) => (
                <tr key={m.id} className="border-b border-zinc-200">
                  <td className="py-1.5">{formatTimeShort(m.timestamp)}</td>
                  <td className="py-1.5">{m.actionType}</td>
                  <td className="py-1.5">{m.approved ? 'APPROVED' : 'BLOCKED'}</td>
                  <td className="py-1.5">{m.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
