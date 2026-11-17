'use client';

import React, { useRef, useState } from 'react';
import {
  BrainCircuit,
  Camera,
  Eye,
  Upload,
} from 'lucide-react';
import { DISEASE_KNOWLEDGE_BASE, findDiseaseProfile } from '@/lib/disease-knowledge-base';
import { AiProcessingMode, CropType, GradCamZone, ImageAnalysisResult, SystemState } from '@/types';
import { cn, formatTimeShort } from '@/lib/utils';

interface VisionStudioProps {
  state: SystemState;
  onAnalysisComplete: (nextState: SystemState) => void;
}

export function VisionStudio({ state, onAnalysisComplete }: VisionStudioProps) {
  const [selectedSpecimen, setSelectedSpecimen] = useState<string>(
    state.latestDetection.diseaseId || 'tomato-late-blight'
  );
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(
    state.latestDetection.imageUrl ?? null
  );
  const [showGradCam, setShowGradCam] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedCropForUpload, setSelectedCropForUpload] = useState<CropType>(state.activeCrop);
  const [aiMode, setAiMode] = useState<AiProcessingMode>('HYBRID_LLM_RULES');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const det: ImageAnalysisResult = state.latestDetection;
  const activeProfile = findDiseaseProfile(selectedSpecimen, false);

  async function runSpecimenAnalysis(specimenId: string) {
    setAnalyzing(true);
    setSelectedSpecimen(specimenId);
    setUploadedPreview(null);
    try {
      const profile = findDiseaseProfile(specimenId, false);
      const res = await fetch('/api/ai/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropType: profile.cropType,
          specimenId,
          aiMode,
          triggerReason: 'MANUAL_UI',
        }),
      });
      const json = await res.json();
      if (json.ok && json.state) {
        onAnalysisComplete(json.state);
      }
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzing(true);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        imageReaderFallback(reader, file);
      });

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = dataUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = 224;
      canvas.height = 224;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, 224, 224);
      const imgData = ctx.getImageData(0, 0, 224, 224).data;

      let greenCount = 0;
      let yellowCount = 0;
      let necroticCount = 0;
      let totalLeafPixels = 0;
      const gridLesions = Array.from({ length: 16 }, () => 0);

      for (let y = 0; y < 224; y++) {
        for (let x = 0; x < 224; x++) {
          const idx = (y * 224 + x) * 4;
          const r = imgData[idx] ?? 0;
          const g = imgData[idx + 1] ?? 0;
          const b = imgData[idx + 2] ?? 0;

          const brightness = (r + g + b) / 3;
          if (brightness > 235 || brightness < 15) continue;

          totalLeafPixels++;
          const gx = Math.min(3, Math.floor((x / 224) * 4));
          const gy = Math.min(3, Math.floor((y / 224) * 4));
          const cell = gy * 4 + gx;

          if (g > r + 10 && g > b + 12) {
            greenCount++;
          } else if (r > 130 && g > 110 && b < 110) {
            yellowCount++;
            gridLesions[cell] = (gridLesions[cell] ?? 0) + 1;
          } else if (r > b && brightness < 135) {
            necroticCount++;
            gridLesions[cell] = (gridLesions[cell] ?? 0) + 1.3;
          }
        }
      }

      const denom = Math.max(totalLeafPixels, 1);
      const healthyGreenPct = (greenCount / denom) * 100;
      const chlorosisPct = (yellowCount / denom) * 100;
      const necrosisPct = (necroticCount / denom) * 100;

      const maxCell = Math.max(...gridLesions, 1);
      const gradCamZones: GradCamZone[] = [];
      gridLesions.forEach((score, i) => {
        const intensity = score / maxCell;
        if (intensity > 0.45 && gradCamZones.length < 3) {
          const cx = ((i % 4) + 0.5) * 25;
          const cy = (Math.floor(i / 4) + 0.5) * 25;
          gradCamZones.push({
            x: Math.round(cx),
            y: Math.round(cy),
            radius: 18,
            intensity: Number(intensity.toFixed(2)),
            label: 'Detected Lesion Activation',
          });
        }
      });

      setUploadedPreview(dataUrl);
      const res = await fetch('/api/ai/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropType: selectedCropForUpload,
          imageBase64: dataUrl,
          aiMode,
          triggerReason: 'MANUAL_UI',
          customVisualFeatures: {
            chlorosisPct,
            necrosisPct,
            healthyGreenPct,
            gradCamZones,
          },
        }),
      });
      const json = await res.json();
      if (json.ok && json.state) {
        onAnalysisComplete(json.state);
      }
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Left Column: Viewport & Input */}
      <div className="saas-card p-5 lg:col-span-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
              <Camera className="h-4 w-4 text-zinc-400" />
              <span>ESP32-CAM Inspection Viewport</span>
            </h2>
            <p className="text-xs text-zinc-500">
              Select a field specimen or upload a leaf image (224×224 input)
            </p>
          </div>
          <button
            onClick={() => setShowGradCam((v) => !v)}
            className={cn(
              'flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors',
              showGradCam
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                : 'border-[#23252b] bg-[#1b1d22] text-zinc-300'
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Grad-CAM {showGradCam ? 'On' : 'Off'}</span>
          </button>
        </div>

        {/* Image Viewport */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border border-[#23252b] bg-[#0b0c0e]">
          {uploadedPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={uploadedPreview}
              alt="Uploaded crop leaf"
              className="h-full w-full object-contain"
            />
          ) : (
            <SyntheticLeafCanvas profile={activeProfile} />
          )}

          {showGradCam &&
            det.gradCamZones.map((zone, idx) => (
              <div
                key={`${zone.x}-${zone.y}-${idx}`}
                style={{
                  left: `${zone.x}%`,
                  top: `${zone.y}%`,
                  width: `${zone.radius * 2}%`,
                  height: `${zone.radius * 2}%`,
                  transform: 'translate(-50%, -50%)',
                  background: `radial-gradient(circle, rgba(239,68,68,${0.55 * zone.intensity}) 0%, rgba(245,158,11,${0.3 * zone.intensity}) 45%, rgba(0,0,0,0) 75%)`,
                }}
                className="pointer-events-none absolute rounded-full"
                title={zone.label}
              >
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-[#23252b] bg-[#09090b] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-zinc-200">
                  {Math.round(zone.intensity * 100)}%
                </span>
              </div>
            ))}

          <div className="pointer-events-none absolute inset-x-2.5 bottom-2.5 flex items-center justify-between rounded border border-[#23252b] bg-[#09090b]/90 px-2.5 py-1 text-[11px] text-zinc-400">
            <span>
              {det.deviceId} · {det.modelBackbone}
            </span>
            <span className="font-mono tabular-nums text-zinc-200">{det.inferenceMs} ms</span>
          </div>

          {analyzing && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#09090b]/80">
              <div className="flex items-center gap-2 rounded-md border border-[#23252b] bg-[#141519] px-3.5 py-2 text-xs font-medium text-zinc-200">
                <BrainCircuit className="h-4 w-4 animate-spin text-emerald-400" />
                <span>Running MobileNetV2 inference...</span>
              </div>
            </div>
          )}
        </div>

        {/* Upload Bar */}
        <div className="saas-subcard mt-4 flex flex-wrap items-center justify-between gap-2 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="AI Engine Mode"
              value={aiMode}
              onChange={(e) => setAiMode(e.target.value as AiProcessingMode)}
              className="h-8 rounded-md border border-[#23252b] bg-[#141519] px-2 text-xs text-zinc-200"
            >
              <option value="HYBRID_LLM_RULES">Hybrid (LLM + Rules)</option>
              <option value="CUSTOM_CNN_SERVICE">Python CNN Service</option>
              <option value="RULE_BASED_SPECTRAL">Offline Spectral</option>
            </select>
            <select
              aria-label="Target Crop for Uploaded Photo"
              value={selectedCropForUpload}
              onChange={(e) => setSelectedCropForUpload(e.target.value as CropType)}
              className="h-8 rounded-md border border-[#23252b] bg-[#141519] px-2 text-xs text-zinc-200"
            >
              <option value="Tomato">Tomato</option>
              <option value="Rice">Rice</option>
              <option value="Wheat">Wheat</option>
              <option value="Mango">Mango</option>
              <option value="Citrus">Citrus</option>
            </select>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 px-3 text-xs font-medium text-white transition-colors hover:bg-emerald-500"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload &amp; Analyze</span>
          </button>
        </div>

        {/* Specimen Presets */}
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-zinc-400">Reference Specimens</p>
          <div className="flex flex-wrap gap-1.5">
            {DISEASE_KNOWLEDGE_BASE.map((item) => (
              <button
                key={item.id}
                onClick={() => runSpecimenAnalysis(item.id)}
                className={cn(
                  'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                  selectedSpecimen === item.id && !uploadedPreview
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-[#23252b] bg-[#1b1d22] text-zinc-300 hover:border-zinc-600'
                )}
              >
                {item.cropType}: {item.isHealthy ? 'Healthy' : item.diseaseName.split('(')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Diagnosis & History */}
      <div className="space-y-5 lg:col-span-6">
        <div className="saas-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span
                className={cn(
                  'inline-block rounded border px-2 py-0.5 text-[11px] font-medium',
                  det.isHealthy
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-red-500/30 bg-red-500/10 text-red-400'
                )}
              >
                {det.pathogenType}
              </span>
              <h3 className="mt-2 text-lg font-semibold text-zinc-100">{det.diseaseName}</h3>
              <p className="text-xs text-zinc-500">
                {det.cropType} · Trigger: {det.triggerReason} · {formatTimeShort(det.timestamp)}
              </p>
            </div>
            <div className="saas-subcard px-3 py-2 text-right">
              <div className="text-xl font-semibold tabular-nums text-zinc-100">
                {det.confidencePct}%
              </div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">Confidence</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="saas-subcard p-3">
              <span className="text-[11px] text-zinc-500">Severity</span>
              <div className="mt-1 text-base font-semibold tabular-nums text-zinc-100">
                {det.severityPct}%
              </div>
            </div>
            <div className="saas-subcard p-3">
              <span className="text-[11px] text-zinc-500">Affected Area</span>
              <div className="mt-1 text-base font-semibold tabular-nums text-zinc-100">
                {det.affectedAreaPct}%
              </div>
            </div>
            <div className="saas-subcard p-3">
              <span className="text-[11px] text-zinc-500">Grad-CAM Zones</span>
              <div className="mt-1 text-base font-semibold tabular-nums text-zinc-100">
                {det.gradCamZones.length}
              </div>
            </div>
          </div>

          {/* Spectral Composition */}
          <div className="saas-subcard mt-4 p-3.5">
            <div className="mb-2 text-xs font-medium text-zinc-400">
              Tissue Composition (224×224)
            </div>
            <div className="flex h-2 w-full overflow-hidden rounded-sm bg-zinc-800">
              <div
                style={{ width: `${det.visualFeatures.healthyGreenPct}%` }}
                className="bg-emerald-500"
              />
              <div
                style={{ width: `${det.visualFeatures.chlorosisPct}%` }}
                className="bg-amber-500"
              />
              <div
                style={{ width: `${det.visualFeatures.necrosisPct}%` }}
                className="bg-red-500"
              />
            </div>
            <div className="mt-2 flex flex-wrap justify-between gap-2 text-[11px] tabular-nums text-zinc-400">
              <span>Healthy: {det.visualFeatures.healthyGreenPct}%</span>
              <span>Chlorosis: {det.visualFeatures.chlorosisPct}%</span>
              <span>Necrosis: {det.visualFeatures.necrosisPct}%</span>
            </div>
          </div>

          {/* Treatment Advisory */}
          <div className="saas-subcard mt-4 p-3.5">
            <div className="text-xs font-medium text-emerald-400">
              Treatment &amp; NPSS Advisory
            </div>
            <p className="mt-1 text-xs font-medium text-zinc-100">{det.recommendedTreatment}</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">{det.advisory}</p>
            {det.llmReasoning && (
              <p className="mt-2 border-t border-[#23252b] pt-2 text-xs text-zinc-300">
                <span className="font-medium text-zinc-400">LLM Fusion: </span>
                {det.llmReasoning}
              </p>
            )}
          </div>
        </div>

        {/* Compact Detection History Table */}
        <div className="saas-card p-5">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Recent Detections
          </h4>
          <div className="max-h-52 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#23252b] text-zinc-500">
                  <th className="pb-2 font-medium">Diagnosis</th>
                  <th className="pb-2 font-medium">Crop</th>
                  <th className="pb-2 text-right font-medium">Conf</th>
                  <th className="pb-2 text-right font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23252b]">
                {[...state.detectionHistory]
                  .reverse()
                  .slice(0, 8)
                  .map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 pr-2 font-medium text-zinc-200">{item.diseaseName}</td>
                      <td className="py-2 pr-2 text-zinc-400">{item.cropType}</td>
                      <td className="py-2 pr-2 text-right tabular-nums text-zinc-200">
                        {item.confidencePct}%
                      </td>
                      <td className="py-2 text-right tabular-nums text-zinc-500">
                        {formatTimeShort(item.timestamp)}
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

function imageReaderFallback(reader: FileReader, file: File) {
  reader.readAsDataURL(file);
}

function SyntheticLeafCanvas({
  profile,
}: {
  profile: ReturnType<typeof findDiseaseProfile>;
}) {
  const { baseGreen, lesionColor, haloColor, spotPattern } = profile.specimenPalette;

  return (
    <svg viewBox="0 0 400 300" className="h-full w-full bg-[#0b0c0e]">
      <path
        d="M200,32 C280,55 320,130 295,215 C270,262 225,276 200,276 C175,276 130,262 105,215 C80,130 120,55 200,32 Z"
        fill={baseGreen}
        stroke="#164e28"
        strokeWidth="2.5"
      />
      <path d="M200,34 L200,290" stroke="#86efac" strokeOpacity="0.4" strokeWidth="2.5" />
      <path
        d="M200,90 L145,75 M200,125 L130,105 M200,165 L125,148 M200,205 L140,192 M200,90 L255,75 M200,125 L270,105 M200,165 L275,148 M200,205 L260,192"
        stroke="#86efac"
        strokeOpacity="0.25"
        strokeWidth="1.5"
      />
      {spotPattern === 'blight' && (
        <>
          <ellipse cx="152" cy="128" rx="34" ry="26" fill={haloColor} opacity="0.7" />
          <ellipse cx="148" cy="126" rx="23" ry="17" fill={lesionColor} opacity="0.92" />
          <ellipse cx="248" cy="172" rx="28" ry="22" fill={haloColor} opacity="0.65" />
          <ellipse cx="252" cy="174" rx="18" ry="14" fill={lesionColor} opacity="0.9" />
        </>
      )}
      {spotPattern === 'rings' && (
        <>
          <circle cx="192" cy="116" r="26" fill={haloColor} opacity="0.85" />
          <circle cx="192" cy="116" r="18" fill={lesionColor} />
          <circle cx="192" cy="116" r="11" fill="none" stroke={haloColor} strokeWidth="2" />
          <circle cx="235" cy="196" r="20" fill={haloColor} opacity="0.8" />
          <circle cx="235" cy="196" r="13" fill={lesionColor} />
        </>
      )}
      {spotPattern === 'rust-stripes' && (
        <>
          <rect x="148" y="96" width="104" height="9" rx="3" fill={haloColor} opacity="0.85" />
          <rect x="155" y="98" width="90" height="5" rx="2" fill={lesionColor} />
          <rect x="135" y="138" width="130" height="10" rx="3" fill={haloColor} opacity="0.85" />
          <rect x="142" y="140" width="115" height="6" rx="2" fill={lesionColor} />
          <rect x="146" y="182" width="106" height="8" rx="3" fill={haloColor} opacity="0.85" />
        </>
      )}
      {spotPattern === 'anthracnose' && (
        <>
          <path d="M210,145 Q265,130 278,185 Q245,228 205,198 Z" fill={haloColor} opacity="0.7" />
          <path d="M218,152 Q260,142 270,182 Q245,215 214,190 Z" fill={lesionColor} opacity="0.95" />
        </>
      )}
    </svg>
  );
}
