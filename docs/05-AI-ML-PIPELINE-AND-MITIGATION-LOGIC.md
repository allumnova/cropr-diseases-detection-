# 05 — AI/ML Pipeline & Mitigation Decision Logic

This document details the mathematical models and decision trees implemented across `/lib/ai-engine.ts` and `/ai-models/crop_disease_ai_pipeline.py`.

---

## 1. Stage 1 — Environmental Disease-Risk Assessment Model

Inspired by Patle *et al.* (2022) [1], Akhter & Sofi (2024) [2], Babu *et al.* (2024) [12], and Reddy *et al.* (2025) [13], Stage 1 evaluates micro-climatic stress without waiting for visible necrosis.

### 1.1 Computed Leaf Wetness Index ($\text{LWI}$)
Because physical leaf wetness resistive grids degrade in soil/spray mist, the prototype fuses ambient temperature $T$, relative humidity $RH$, and solar illuminance $L$ to derive the Dew-Point Spread ($\Delta T_{\text{dew}}$) and $\text{LWI} \in [0, 100]$:

$$T_{\text{dew}} \approx T - \frac{100 - RH}{5}$$

$$\text{LWI} = \text{clamp}\left(100 - 12 \cdot (T - T_{\text{dew}}) + 0.15 \cdot \max(0, RH - 70) - 0.0008 \cdot L,\ 0,\ 100\right)$$

### 1.2 Pathogen Conduciveness Sub-Scores
1. **Fungal Blight Risk ($R_{\text{blight}}$)**: Peaks when $RH \ge 80\%$, $18^\circ\text{C} \le T \le 28^\circ\text{C}$, and $\text{LWI} \ge 65$.
2. **Powdery Mildew Risk ($R_{\text{mildew}}$)**: Peaks in warm, moderately humid conditions ($22^\circ\text{C} \le T \le 32^\circ\text{C}$, $50\% \le RH \le 78\%$) with shaded light ($L < 20,000\text{ Lux}$).
3. **Bacterial Wilt / Spot Risk ($R_{\text{bacterial}}$)**: Peaks in hot, wet conditions ($T > 27^\circ\text{C}$, $RH > 75\%$, Soil Moisture $> 70\%$).
4. **Root Rot / Nutrient Stress Risk ($R_{\text{root}}$)**: Peaks with waterlogging (Soil Moisture $> 82\%$) or severe NPK depletion ($N < 80$ or $K < 90\text{ mg/kg}$).

### 1.3 Composite Risk Score & Escalation Thresholds
$$\text{RiskScore} = 0.35\,R_{\text{blight}} + 0.20\,R_{\text{mildew}} + 0.25\,R_{\text{bacterial}} + 0.20\,R_{\text{root}} + \text{AnomalyBoost}$$

| Risk Score | Level | System Action |
| :---: | :--- | :--- |
| `0 – 34` | `LOW` | Green LED; normal interval polling (5s) |
| `35 – 59` | `MODERATE` | Watch state; alert logged on dashboard |
| `60 – 79` | `ELEVATED` | **Auto-trigger ESP32-CAM image capture** + Amber LED |
| `80 – 100` | `CRITICAL` | **Auto-trigger ESP32-CAM capture + Rover Halt + Buzzer Warning** |

---

## 2. Stage 2 — Image-Based Disease Identification & Grad-CAM XAI

Consistent with Section 3 (Scope of Work) of `UPCST report-4.pdf` and Refs [4, 7, 9]:
- **Backbone Architecture**: **MobileNetV2** (lightweight edge/server inference, `224×224×3` RGB input) with optional **EfficientNetB0** high-accuracy profile.
- **Image Preprocessing Pipeline**:
  1. Resize to `224 × 224` pixels
  2. Bilateral/Gaussian noise reduction
  3. Channel normalization ($[0, 1]$ or ImageNet mean/std)
  4. Color-space segmentation (HSV hue extraction to separate healthy chlorophyll green from yellow chlorotic halos and brown/black necrotic lesions)
- **Explainable AI (Grad-CAM)**:
  - Computes spatial gradient activation maps on the final convolutional block (`Conv_1`) to localize lesion regions (`gradCamZones: {x, y, radius, intensity}`) and calculate `affectedAreaPct`.
  - When analyzing uploaded user images directly on the server without an external GPU inference microservice, `/lib/ai-engine.ts` performs deterministic RGB/HSV lesion-morphology analysis (and optionally calls Gemini Vision if `GEMINI_API_KEY` is configured) so real leaf uploads produce real spatial hotspot diagnostics!

---

## 3. Stage 3 — Mitigation Decision Logic & Safety Interlocks

From Section 4.3 of `UPCST report-4.pdf` (*"Configure the system to initiate the selected mitigation action only when predefined conditions are satisfied. Use crop-specific and disease-specific treatment rules, with manual override and safety interlocks."*):

### 3.1 The 5 Mandatory Hardware Safety Interlocks

| Interlock | Condition Required to Allow Pump | Failure Behavior |
| :--- | :--- | :--- |
| **1. Confidence Gate** | `confidencePct >= config.minConfidencePct` (default `75%`) | Blocks automatic spray; logs "Low AI Confidence — Human Review Needed" |
| **2. Battery Voltage Gate** | `electrical.busVoltageV >= 10.8` | Blocks high-draw pump/motors to prevent BMS cutoff & brownout |
| **3. Tank Level Gate** | `mitigation.tankLevelPct >= 10` | Blocks 12V pump activation to prevent dry-run impeller damage |
| **4. Pump Cooldown Gate** | `(now - lastSprayTime) >= config.cooldownSec` (default `30s`) | Prevents chemical/water over-application on the same plant |
| **5. Mode / E-Stop Gate** | `systemMode === 'AUTO'` (not `MANUAL` or `EMERGENCY_STOP`) | Respects operator override and physical/UI emergency stop |

### 3.2 Crop & Disease Treatment Matrix (NPSS Aligned)

| Crop | Disease | Visual Signature | Mitigation Action | Pump Duty / Duration | Recommended Field Advisory |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Tomato** | Late Blight | Dark water-soaked lesions, white mold rim | Targeted Fungicide Mist | `85%` PWM / `4.5s` | Metalaxyl + Mancozeb 2.5 g/L; remove heavily blighted lower leaves |
| **Tomato** | Early Blight | Concentric target-board brown rings | Targeted Fungicide Mist | `75%` PWM / `3.5s` | Chlorothalonil / Azoxystrobin spray; boost Potassium |
| **Rice** | Leaf Blast | Spindle/diamond lesions with gray center | Targeted Fungicide Mist | `80%` PWM / `4.0s` | Tricyclazole 75 WP (0.6 g/L); avoid excess Nitrogen top-dressing |
| **Wheat** | Yellow/Stripe Rust | Linear yellow-orange pustule stripes | Targeted Fungicide Mist | `80%` PWM / `4.0s` | Propiconazole 25 EC (1 mL/L) foliar mist |
| **Mango** | Anthracnose | Irregular dark-brown sunken spots | Targeted Fungicide Mist | `75%` PWM / `3.5s` | Carbendazim / Copper Oxychloride; prune dense canopy |
| **Any** | Moisture Stress / Healthy | Wilting or low soil moisture (< 30%) | Irrigation Pulse Only | `65%` PWM / `5.0s` | Clean water irrigation pulse; no pesticide dispensed |
| **Any** | Healthy | Uniform chlorophyll green | **No Spray (Standby)** | `0%` / `0s` | Green LED steady; log healthy scan |
