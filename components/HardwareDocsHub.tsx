'use client';

import React, { useState } from 'react';
import {
  Check,
  Copy,
  Send,
} from 'lucide-react';
import { SystemState } from '@/types';

const PINOUT_ROWS = [
  { gpio: 'GPIO 21 / 22', peripheral: 'I2C Bus (BH1750, SSD1306 OLED, INA219)', proto: 'I2C (0x23, 0x3C, 0x40)' },
  { gpio: 'GPIO 4', peripheral: 'DHT22 Temp & Relative Humidity', proto: '1-Wire Digital' },
  { gpio: 'GPIO 34', peripheral: 'Capacitive Soil Moisture Sensor', proto: 'ADC1 Analog In' },
  { gpio: 'GPIO 36', peripheral: 'IR Row-Path Tracking Sensor', proto: 'Digital / ADC1 In' },
  { gpio: 'GPIO 16 / 17 / 5', peripheral: 'RS485 Soil NPK Sensor (MAX485)', proto: 'UART2 Modbus RTU' },
  { gpio: 'GPIO 18 / 39', peripheral: 'HC-SR04 Ultrasonic Obstacle Sensor', proto: 'Trigger / 3.3V Echo' },
  { gpio: 'GPIO 25', peripheral: '12V Mini Water Pump (IRLZ44N MOSFET)', proto: 'LEDC PWM Out' },
  { gpio: 'GPIO 26 / 27', peripheral: 'Nozzle Servo & Camera Pan Servo', proto: '50Hz Servo PWM' },
  { gpio: 'GPIO 14,13,32,33,23,19', peripheral: 'L298N Dual H-Bridge (4WD Motors)', proto: 'Dir + PWM Speed' },
  { gpio: 'GPIO 15', peripheral: 'Wheel Encoders (RPM & Odometry)', proto: 'Hardware Interrupt' },
  { gpio: 'GPIO 2 / 12', peripheral: 'Status Alert LED & Piezo Buzzer', proto: 'Digital / Tone Out' },
];

const BOM_ITEMS = [
  { sno: 1, item: 'ESP32 (38 Pin) Development Board', qty: 1, cost: 450 },
  { sno: 2, item: 'ESP32-CAM + OV2640 Camera Module', qty: 1, cost: 675 },
  { sno: 3, item: 'DHT22 Sensor', qty: 1, cost: 175 },
  { sno: 4, item: 'Temperature & Humidity Redundant Probe', qty: 1, cost: 200 },
  { sno: 5, item: 'Capacitive Soil Moisture Sensor', qty: 1, cost: 200 },
  { sno: 6, item: 'BH1750 Light Intensity Sensor', qty: 1, cost: 150 },
  { sno: 7, item: 'HC-SR04 Ultrasonic Sensor', qty: 1, cost: 139 },
  { sno: 8, item: 'IR Path-Following Sensor', qty: 1, cost: 149 },
  { sno: 9, item: 'SSD1306 OLED Display + SD Card', qty: 1, cost: 300 },
  { sno: 10, item: '4WD Metal Chassis, Geared Motors & Wheels', qty: 1, cost: 2500 },
  { sno: 11, item: 'L298N Motor Drive Module', qty: 1, cost: 500 },
  { sno: 12, item: '4× Wheel Encoders', qty: 1, cost: 580 },
  { sno: 13, item: 'Servo Motors (Camera + Nozzle + Arm)', qty: 5, cost: 1000 },
  { sno: 14, item: '12V Rechargeable Battery Pack with BMS', qty: 1, cost: 1350 },
  { sno: 15, item: 'DC-DC Buck Converter (LM2596)', qty: 1, cost: 500 },
  { sno: 16, item: 'INA219 Voltage & Current Sensing Module', qty: 1, cost: 250 },
  { sno: 17, item: '12V Mini Water Pump', qty: 1, cost: 250 },
  { sno: 18, item: 'IRLZ44N MOSFET Driver Module', qty: 1, cost: 150 },
  { sno: 19, item: 'Small Tank, Spray Nozzle & Valve', qty: 1, cost: 350 },
  { sno: 20, item: 'Main Switch & Fuse Protection', qty: 1, cost: 300 },
  { sno: 21, item: 'LED, Buzzer, Wires, Connectors, Standoffs', qty: 1, cost: 800 },
];

export function HardwareDocsHub({
  state,
  onHardwarePacketSent,
}: {
  state: SystemState;
  onHardwarePacketSent: (nextState: SystemState) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const sampleCurl = `curl -X POST http://localhost:3000/api/telemetry \\
  -H "Content-Type: application/json" \\
  -H "x-device-key: hbtu-agroguard-2026" \\
  -d '{"deviceId":"esp32-rover-01","cropType":"${state.activeCrop}","sensors":{"temperatureC":24.6,"humidityPct":88.4,"soilMoisturePct":66.0,"lightLux":9500,"npk":{"nitrogen":135,"phosphorus":54,"potassium":176},"obstacleDistanceCm":24,"irPathAligned":true},"electrical":{"busVoltageV":12.1,"currentA":0.45,"powerW":5.45}}'`;

  function copyCurl() {
    navigator.clipboard?.writeText(sampleCurl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function sendTestHardwarePacket() {
    const res = await fetch('/api/telemetry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-key': 'hbtu-agroguard-2026',
      },
      body: JSON.stringify({
        deviceId: 'esp32-rover-01',
        cropType: state.activeCrop,
        sensors: {
          temperatureC: 24.6,
          humidityPct: 88.4,
          soilMoisturePct: 66.0,
          lightLux: 9500,
          npk: { nitrogen: 135, phosphorus: 54, potassium: 176 },
          obstacleDistanceCm: 24,
          irPathAligned: true,
        },
        electrical: {
          busVoltageV: 12.1,
          currentA: 0.45,
          powerW: 5.45,
        },
      }),
    });
    const json = await res.json();
    if (json.ok) {
      setTestResult(
        `200 OK · Risk ${json.riskAssessment.riskScore}% (${json.riskAssessment.riskLevel}) · Camera Trigger: ${json.commands.cameraTrigger}`
      );
      const sysRes = await fetch('/api/system');
      const sysJson = await sysRes.json();
      if (sysJson.ok && sysJson.state) onHardwarePacketSent(sysJson.state);
    }
  }

  const bomTotal = BOM_ITEMS.reduce((acc, item) => acc + item.cost, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Hardware Ingestion Tester */}
        <div className="saas-card p-5">
          <h2 className="text-sm font-semibold text-zinc-100">
            ESP32 Hardware Ingestion Endpoint
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Flash <code>firmware/esp32_main_controller/esp32_main_controller.ino</code> and{' '}
            <code>firmware/esp32_cam_node/esp32_cam_node.ino</code> to stream live telemetry.
          </p>

          <div className="mt-4 rounded-md border border-[#23252b] bg-[#09090b] p-3">
            <div className="mb-2 flex items-center justify-between text-[11px] text-zinc-500">
              <span>POST /api/telemetry</span>
              <button
                onClick={copyCurl}
                className="flex items-center gap-1 rounded border border-[#23252b] bg-[#141519] px-2 py-0.5 text-zinc-300 hover:bg-[#1b1d22]"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="overflow-x-auto text-[11px] leading-relaxed text-zinc-300">
              {sampleCurl}
            </pre>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={sendTestHardwarePacket}
              className="flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 px-3 text-xs font-medium text-white transition-colors hover:bg-emerald-500"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send Test Telemetry Packet</span>
            </button>
            {testResult && <span className="text-xs text-emerald-400">{testResult}</span>}
          </div>
        </div>

        {/* Project Team Metadata */}
        <div className="saas-card p-5">
          <h2 className="text-sm font-semibold text-zinc-100">
            Academic &amp; Grant Metadata
          </h2>
          <div className="mt-3 space-y-1.5 text-xs text-zinc-400">
            <p>
              <span className="text-zinc-200 font-medium">Institution:</span> Harcourt Butler Technical University, Kanpur (Dept. of Electrical Engineering)
            </p>
            <p>
              <span className="text-zinc-200 font-medium">Grant Scheme:</span> UPCST Engineering Student Project Grant 2026–2027 (Rs. 20,000/-)
            </p>
            <p>
              <span className="text-zinc-200 font-medium">Project Guide:</span> Dr. Shailendra Kumar Bhasker (Assistant Professor, EE)
            </p>
            <p>
              <span className="text-zinc-200 font-medium">Project In-Charge:</span> Dr. Sanjiv Kumar (Professor, EE)
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {[
              { name: 'Ayush Agrawal', roll: '230105019' },
              { name: 'Trisha Singh', roll: '230105056' },
              { name: 'Vipranshu Sachan', roll: '230105061' },
              { name: 'Yashraj Dhwaj Singh', roll: '230105064' },
            ].map((m) => (
              <div key={m.roll} className="saas-subcard px-3 py-2">
                <div className="font-medium text-zinc-200">{m.name}</div>
                <div className="font-mono text-[11px] text-zinc-500">{m.roll}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pinout & BOM Tables */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="saas-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-zinc-100">38-Pin ESP32 GPIO Map</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#23252b] text-zinc-500">
                  <th className="py-2 pr-3 font-medium">GPIO</th>
                  <th className="py-2 pr-3 font-medium">Peripheral</th>
                  <th className="py-2 font-medium">Interface</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23252b]">
                {PINOUT_ROWS.map((row) => (
                  <tr key={row.gpio}>
                    <td className="py-2 pr-3 font-mono font-medium text-emerald-400">{row.gpio}</td>
                    <td className="py-2 pr-3 text-zinc-200">{row.peripheral}</td>
                    <td className="py-2 text-zinc-400">{row.proto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="saas-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-100">
              Hardware Bill of Materials
            </h3>
            <span className="rounded border border-[#23252b] bg-[#1b1d22] px-2 py-0.5 text-xs font-medium tabular-nums text-zinc-200">
              Rs. {bomTotal.toLocaleString()} / 20,000
            </span>
          </div>
          <div className="max-h-[410px] overflow-y-auto pr-1">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#141519]">
                <tr className="border-b border-[#23252b] text-zinc-500">
                  <th className="py-2 pr-2 font-medium">#</th>
                  <th className="py-2 pr-3 font-medium">Component</th>
                  <th className="py-2 pr-2 text-center font-medium">Qty</th>
                  <th className="py-2 text-right font-medium">Cost (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23252b]">
                {BOM_ITEMS.map((b) => (
                  <tr key={b.sno}>
                    <td className="py-1.5 pr-2 tabular-nums text-zinc-500">{b.sno}</td>
                    <td className="py-1.5 pr-3 text-zinc-200">{b.item}</td>
                    <td className="py-1.5 pr-2 text-center tabular-nums text-zinc-400">{b.qty}</td>
                    <td className="py-1.5 text-right font-mono tabular-nums text-zinc-200">
                      ₹{b.cost}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
