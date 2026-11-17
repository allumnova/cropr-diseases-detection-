import { CropType, GradCamZone } from '@/types';

export interface DiseaseProfile {
  id: string;
  cropType: CropType;
  diseaseName: string;
  pathogenType: 'Fungal' | 'Bacterial' | 'Viral' | 'Healthy' | 'Abiotic';
  isHealthy: boolean;
  symptoms: string;
  favorableEnv: string;
  recommendedTreatment: string;
  advisory: string;
  actionType: 'TARGETED_FUNGICIDE_SPRAY' | 'IRRIGATION_PULSE' | 'NUTRIENT_FOLIAR_SPRAY' | 'NO_ACTION_HEALTHY';
  pumpDutyPct: number;
  pumpDurationMs: number;
  nozzleAngleDeg: number;
  defaultConfidencePct: number;
  defaultSeverityPct: number;
  defaultAffectedAreaPct: number;
  defaultGradCam: GradCamZone[];
  visualSignature: {
    chlorosisPct: number;
    necrosisPct: number;
    healthyGreenPct: number;
  };
  specimenPalette: {
    baseGreen: string;
    lesionColor: string;
    haloColor: string;
    spotPattern: 'blight' | 'rings' | 'rust-stripes' | 'anthracnose' | 'healthy';
  };
}

export const DISEASE_KNOWLEDGE_BASE: DiseaseProfile[] = [
  {
    id: 'tomato-late-blight',
    cropType: 'Tomato',
    diseaseName: 'Late Blight (Phytophthora infestans)',
    pathogenType: 'Fungal',
    isHealthy: false,
    symptoms: 'Irregular dark water-soaked necrotic blotches with pale yellow-green chlorotic margins.',
    favorableEnv: 'Cool-humid canopy (18–26 °C, RH > 82%, prolonged leaf wetness).',
    recommendedTreatment: 'Metalaxyl-M + Mancozeb (2.5 g/L) targeted foliar mist + remove severely blighted lower leaves.',
    advisory: 'NPSS Advisory: Suspend overhead irrigation immediately. Apply targeted systemic fungicide spray at 85% nozzle pressure.',
    actionType: 'TARGETED_FUNGICIDE_SPRAY',
    pumpDutyPct: 85,
    pumpDurationMs: 4500,
    nozzleAngleDeg: 55,
    defaultConfidencePct: 95.4,
    defaultSeverityPct: 42.0,
    defaultAffectedAreaPct: 31.5,
    defaultGradCam: [
      { x: 36, y: 42, radius: 22, intensity: 0.96, label: 'Primary Necrotic Blight Lesion' },
      { x: 64, y: 58, radius: 17, intensity: 0.84, label: 'Spreading Water-Soaked Margin' },
    ],
    visualSignature: { chlorosisPct: 24, necrosisPct: 31, healthyGreenPct: 45 },
    specimenPalette: {
      baseGreen: '#2f6d3b',
      lesionColor: '#2d1e17',
      haloColor: '#a3a832',
      spotPattern: 'blight',
    },
  },
  {
    id: 'tomato-early-blight',
    cropType: 'Tomato',
    diseaseName: 'Early Blight (Alternaria solani)',
    pathogenType: 'Fungal',
    isHealthy: false,
    symptoms: 'Dark brown concentric target-board rings surrounded by bright yellow chlorosis.',
    favorableEnv: 'Warm humid alternation (24–30 °C, RH > 75%, moderate Potassium deficiency).',
    recommendedTreatment: 'Azoxystrobin / Chlorothalonil (2 mL/L) + Potassium foliar booster.',
    advisory: 'NPSS Advisory: Target lower/older foliage first; verify soil K level via NPK sensor and supplement potash.',
    actionType: 'TARGETED_FUNGICIDE_SPRAY',
    pumpDutyPct: 75,
    pumpDurationMs: 3500,
    nozzleAngleDeg: 45,
    defaultConfidencePct: 92.8,
    defaultSeverityPct: 33.0,
    defaultAffectedAreaPct: 22.0,
    defaultGradCam: [
      { x: 48, y: 38, radius: 18, intensity: 0.91, label: 'Concentric Target Ring Spot' },
      { x: 58, y: 66, radius: 15, intensity: 0.78, label: 'Chlorotic Halo Zone' },
    ],
    visualSignature: { chlorosisPct: 28, necrosisPct: 22, healthyGreenPct: 50 },
    specimenPalette: {
      baseGreen: '#357a41',
      lesionColor: '#4b2a17',
      haloColor: '#d9b526',
      spotPattern: 'rings',
    },
  },
  {
    id: 'rice-leaf-blast',
    cropType: 'Rice',
    diseaseName: 'Rice Leaf Blast (Magnaporthe oryzae)',
    pathogenType: 'Fungal',
    isHealthy: false,
    symptoms: 'Diamond/spindle-shaped lesions with grayish-white centers and reddish-brown borders.',
    favorableEnv: 'High humidity (>85%), high leaf wetness, excessive Nitrogen application.',
    recommendedTreatment: 'Tricyclazole 75 WP (0.6 g/L) or Isoprothiolane (1.5 mL/L) precision mist.',
    advisory: 'NPSS Advisory: Halt Urea/Nitrogen top-dressing until fungal spread stops. Maintain balanced flood moisture.',
    actionType: 'TARGETED_FUNGICIDE_SPRAY',
    pumpDutyPct: 80,
    pumpDurationMs: 4000,
    nozzleAngleDeg: 50,
    defaultConfidencePct: 94.1,
    defaultSeverityPct: 37.5,
    defaultAffectedAreaPct: 26.0,
    defaultGradCam: [
      { x: 44, y: 45, radius: 20, intensity: 0.93, label: 'Spindle Blast Lesion Core' },
      { x: 66, y: 34, radius: 14, intensity: 0.79, label: 'Secondary Diamond Spot' },
    ],
    visualSignature: { chlorosisPct: 19, necrosisPct: 26, healthyGreenPct: 55 },
    specimenPalette: {
      baseGreen: '#3b823f',
      lesionColor: '#7a6f68',
      haloColor: '#8c3d1e',
      spotPattern: 'blight',
    },
  },
  {
    id: 'wheat-yellow-rust',
    cropType: 'Wheat',
    diseaseName: 'Wheat Yellow / Stripe Rust (Puccinia striiformis)',
    pathogenType: 'Fungal',
    isHealthy: false,
    symptoms: 'Linear rows of bright yellow-orange pustule stripes parallel to leaf veins.',
    favorableEnv: 'Cool morning dew (12–22 °C, high LWI > 70%).',
    recommendedTreatment: 'Propiconazole 25 EC (1 mL/L) or Tebuconazole foliar spray.',
    advisory: 'NPSS Advisory: Early stripe rust detected. Execute targeted mist along affected rows to prevent airborne spore drift.',
    actionType: 'TARGETED_FUNGICIDE_SPRAY',
    pumpDutyPct: 80,
    pumpDurationMs: 4000,
    nozzleAngleDeg: 40,
    defaultConfidencePct: 96.2,
    defaultSeverityPct: 45.0,
    defaultAffectedAreaPct: 34.0,
    defaultGradCam: [
      { x: 50, y: 48, radius: 24, intensity: 0.95, label: 'Linear Pustule Stripe Band' },
    ],
    visualSignature: { chlorosisPct: 38, necrosisPct: 12, healthyGreenPct: 50 },
    specimenPalette: {
      baseGreen: '#438544',
      lesionColor: '#d47c15',
      haloColor: '#f5c72e',
      spotPattern: 'rust-stripes',
    },
  },
  {
    id: 'mango-anthracnose',
    cropType: 'Mango',
    diseaseName: 'Mango Anthracnose (Colletotrichum gloeosporioides)',
    pathogenType: 'Fungal',
    isHealthy: false,
    symptoms: 'Irregular dark-brown to black sunken lesions spreading along leaf tips and margins.',
    favorableEnv: 'High humidity (>80%) and warm temperatures (25–32 °C).',
    recommendedTreatment: 'Copper Oxychloride (3 g/L) or Carbendazim (1 g/L) targeted canopy mist.',
    advisory: 'NPSS Advisory: Prune overcrowded twigs after spray cycle to improve sunlight penetration (Lux) and reduce LWI.',
    actionType: 'TARGETED_FUNGICIDE_SPRAY',
    pumpDutyPct: 75,
    pumpDurationMs: 3800,
    nozzleAngleDeg: 65,
    defaultConfidencePct: 91.7,
    defaultSeverityPct: 31.0,
    defaultAffectedAreaPct: 24.5,
    defaultGradCam: [
      { x: 55, y: 52, radius: 21, intensity: 0.90, label: 'Sunken Anthracnose Necrosis' },
    ],
    visualSignature: { chlorosisPct: 16, necrosisPct: 28, healthyGreenPct: 56 },
    specimenPalette: {
      baseGreen: '#275c32',
      lesionColor: '#211512',
      haloColor: '#7a5a24',
      spotPattern: 'anthracnose',
    },
  },
  {
    id: 'citrus-canker',
    cropType: 'Citrus',
    diseaseName: 'Citrus Canker (Xanthomonas citri)',
    pathogenType: 'Bacterial',
    isHealthy: false,
    symptoms: 'Raised corky brown scabs with sunken centers and prominent bright yellow halos.',
    favorableEnv: 'Warm wet winds (26–34 °C, high humidity & surface wetness).',
    recommendedTreatment: 'Streptocycline + Copper Oxychloride bactericide mist.',
    advisory: 'NPSS Advisory: Disinfect rover chassis/tools after row pass to prevent mechanical bacterial spread.',
    actionType: 'TARGETED_FUNGICIDE_SPRAY',
    pumpDutyPct: 80,
    pumpDurationMs: 3600,
    nozzleAngleDeg: 50,
    defaultConfidencePct: 90.5,
    defaultSeverityPct: 29.0,
    defaultAffectedAreaPct: 19.0,
    defaultGradCam: [
      { x: 40, y: 40, radius: 16, intensity: 0.89, label: 'Corky Scab + Yellow Halo' },
      { x: 63, y: 60, radius: 14, intensity: 0.81, label: 'Secondary Canker Pustule' },
    ],
    visualSignature: { chlorosisPct: 25, necrosisPct: 18, healthyGreenPct: 57 },
    specimenPalette: {
      baseGreen: '#2e7538',
      lesionColor: '#5c3c22',
      haloColor: '#ebd234',
      spotPattern: 'rings',
    },
  },
  {
    id: 'healthy-leaf',
    cropType: 'Tomato',
    diseaseName: 'Healthy Foliage — No Pathogen Detected',
    pathogenType: 'Healthy',
    isHealthy: true,
    symptoms: 'Uniform vibrant chlorophyll green tissue, intact veins, zero necrotic or chlorotic lesions.',
    favorableEnv: 'Balanced micro-climate & adequate NPK availability.',
    recommendedTreatment: 'No chemical or fungicide intervention required.',
    advisory: 'Crop canopy is healthy. Continue routine automated Stage 1 environmental monitoring.',
    actionType: 'NO_ACTION_HEALTHY',
    pumpDutyPct: 0,
    pumpDurationMs: 0,
    nozzleAngleDeg: 45,
    defaultConfidencePct: 98.1,
    defaultSeverityPct: 0,
    defaultAffectedAreaPct: 0,
    defaultGradCam: [],
    visualSignature: { chlorosisPct: 2, necrosisPct: 0, healthyGreenPct: 98 },
    specimenPalette: {
      baseGreen: '#2b8a3e',
      lesionColor: '#2b8a3e',
      haloColor: '#37b24d',
      spotPattern: 'healthy',
    },
  },
];

export function findDiseaseProfile(idOrCrop?: string, preferDiseased = true): DiseaseProfile {
  if (idOrCrop) {
    const exact = DISEASE_KNOWLEDGE_BASE.find((d) => d.id === idOrCrop);
    if (exact) return exact;
    const byCrop = DISEASE_KNOWLEDGE_BASE.find(
      (d) => d.cropType.toLowerCase() === idOrCrop.toLowerCase() && (preferDiseased ? !d.isHealthy : true)
    );
    if (byCrop) return byCrop;
  }
  return DISEASE_KNOWLEDGE_BASE[0]!;
}
