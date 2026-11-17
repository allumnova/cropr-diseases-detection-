# 07 — Wheat, Tomato & Rice Disease Identification: Research, Dataset, Image Processing & Model Plan

This document defines the focused 3-crop AI/ML, image-processing, dataset, and research-paper blueprint for **Wheat**, **Tomato**, and **Rice**, directly mapped to the literature survey in `crop-disease-detection-final-print(2).pdf`.

---

## 1. Research Paper Mapping (Direct References from Your Report)

| Crop | Paper Reference | Method / Model | Sensors / Dataset Used | Reported Benchmark | How We Use It |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Tomato** | **Maurya *et al.* (2025)** — *RAI-Net*, IEEE Access [4] | ResNet18 + Channel Attention + Inception + **Grad-CAM** | 4,595 test images, 10 tomato classes | **97.88%** | Grad-CAM lesion localization overlay on leaf viewport |
| **Tomato** | **Babu *et al.* (2024)** — *South India Station*, Sensors [12] | Hybrid ML (**Bayesian-KNN**) | Temp, RH, pH, **N, P, K** | **95.0%** | Stage 1 Tomato environmental + NPK risk scoring |
| **Rice** | **Akhter & Sofi (2024)** — *Precision Ag*, IEEE DASA [2] | **XGBoost** on IoT time-series | Temp, RH, Rainfall, Soil Moisture | **92.5%** | Stage 1 Rice Blast / Blight early-warning model |
| **Rice** | **Hassan & Maji (2022)** — *Novel CNN*, IEEE Access [7] | Inception + Residual + **Depthwise Separable CNN** | PlantVillage + Rice Disease Dataset | **99.66%** (Rice) | Lightweight separable convs (MobileNetV2 family) |
| **Wheat & Rice** | **Joseph *et al.* (2024)** — *Real-Time Dataset*, IEEE Access [8] | **MRW-CNN** (Maize, Rice, Wheat) | Real-world field leaf images | **98.08%** (Wheat), **97.06%** (Rice) | Outdoor lighting augmentation & multi-crop head |
| **Wheat** | **Abdelli *et al.* (2025)** — *Wheat Plot IoT*, IEEE Access [15] | ESP32 + ESP-NOW / LoRa | Field wheat plot telemetry | **>95% PDR** | Field power & wireless telemetry validation |
| **Multi-Crop** | **Nigar *et al.* (2024)** — *XAI Classification*, IEEE Access [9] | **EfficientNetB0 + LIME** | 87,000 images, 38 diseases | **99.69%** | Combining XAI explanations with IoT sensors |

---

## 2. Target Classes & Environmental Triggers (3 Crops = 11 Classes)

### A. Wheat (`Triticum aestivum`)
1. `Wheat___Healthy`
2. `Wheat___Yellow_Stripe_Rust` (*Puccinia striiformis*) — Cool morning dew (`12–22 °C`, high Leaf Wetness Index `> 70%`)
3. `Wheat___Brown_Leaf_Rust` (*Puccinia triticina*) — Moderate-warm (`18–26 °C`, `RH > 75%`)
4. `Wheat___Septoria_Leaf_Blotch` — Cool wet canopy (`15–22 °C`, `RH > 80%`)

### B. Tomato (`Solanum lycopersicum`)
5. `Tomato___Healthy`
6. `Tomato___Late_Blight` (*Phytophthora infestans*) — Cool-humid (`18–26 °C`, `RH > 82%`, high LWI)
7. `Tomato___Early_Blight` (*Alternaria solani*) — Warm humid (`24–30 °C`, `RH > 75%`, low Potassium)
8. `Tomato___Bacterial_Spot` (*Xanthomonas*) — Hot wet canopy (`26–34 °C`, `RH > 80%`, high soil moisture)

### C. Rice (`Oryza sativa`)
9. `Rice___Healthy`
10. `Rice___Leaf_Blast` (*Magnaporthe oryzae*) — High humidity (`> 85%`), prolonged dew, **excess Nitrogen**
11. `Rice___Brown_Spot` (*Bipolaris oryzae*) — Nutrient-deficient soil (**low N/K**), warm humidity (`25–32 °C`)
*(Optional 12th class: `Rice___Bacterial_Leaf_Blight`)*

---

## 3. Where to Get the Exact Datasets (Open-Source)

1. **Tomato**:
   - **PlantVillage Dataset (Kaggle)** — Filter the 10 `Tomato___*` folders (~18,160 images).
   - **PlantDoc (GitHub / Roboflow)** — Add real-field background Tomato images to prevent lab-only overfitting.
2. **Rice**:
   - **Mendeley Rice Leaf Disease Dataset** (~5,932 images covering Leaf Blast, Brown Spot, Bacterial Blight, Tungro).
   - **Kaggle Rice Leaf Diseases Dataset** (Bacterial Leaf Blight, Brown Spot, Leaf Smut).
3. **Wheat**:
   - **Kaggle Wheat Leaf Disease Dataset** (Healthy, Septoria, Stripe/Yellow Rust, Brown Rust).
   - **LWDCD2020** (Large Wheat Disease Classification Dataset) for field robustness.
4. **Field Fine-Tuning Set (Your Own Prototype)**:
   - Capture **50–100 images per class** using your own **ESP32-CAM (OV2640)** under HBTU test-plot lighting and mix 20% of them into training/validation so the model adapts to OV2640 sensor color characteristics.

### Required Folder Structure for Training
```text
dataset/
├── train/
│   ├── Wheat___Healthy/
│   ├── Wheat___Yellow_Stripe_Rust/
│   ├── Wheat___Brown_Leaf_Rust/
│   ├── Tomato___Healthy/
│   ├── Tomato___Late_Blight/
│   ├── Tomato___Early_Blight/
│   ├── Tomato___Bacterial_Spot/
│   ├── Rice___Healthy/
│   ├── Rice___Leaf_Blast/
│   └── Rice___Brown_Spot/
└── val/
    └── (same 10–11 class folders, 20% split)
```

---

## 4. Image Processing Pipeline (Before Model Inference)

Following Section 1.6 & 2.8.6 of your Progress Report and Joseph *et al.* [8]:

1. **Resize & Pad**: Convert variable ESP32-CAM (`320×240` QVGA / `640×480` VGA) frames to `224 × 224 × 3` RGB.
2. **Denoising**: Apply `3×3` Gaussian or Bilateral filter to suppress OV2640 JPEG compression artifacts.
3. **Illumination Normalization (CLAHE)**: Convert RGB → LAB, apply CLAHE on the `L` (lightness) channel, convert back to RGB so harsh sunlight or canopy shadows do not skew predictions.
4. **HSV Color-Space Pre-Analysis**: Extract Green chlorophyll mask vs. Yellow chlorosis vs. Brown/Black necrosis % (used for severity estimation & sanity check).
5. **Training Augmentation Only**: Random horizontal/vertical flip, ±20° rotation, ±15% brightness/contrast jitter, random zoom `0.85–1.15`.

---

## 5. Model Architecture & Training Plan

### Step A — Stage 1 Sensor Model (`XGBoost / GradientBoosting`)
- **Input Features (7)**: `[Crop_ID, Temp_C, Humidity_Pct, Soil_Moisture_Pct, Light_Lux, LWI, N, P, K]`
- **Output**: `LOW (0)` | `MODERATE (1)` | `ELEVATED_CRITICAL (2)`
- **Role**: Acts as the early-warning gate that triggers ESP32-CAM only when conditions favor disease.

### Step B — Stage 2 Image Classifier (`MobileNetV2` Transfer Learning + `Grad-CAM`)
- **Why MobileNetV2**: Only ~2.4M–3.5M parameters, `< 150 ms` CPU inference, and exports cleanly to `.tflite` (~9 MB).
- **Phase 1 (Frozen Backbone, 10 Epochs)**: `MobileNetV2(weights='imagenet', include_top=False)` → `GlobalAveragePooling2D` → `Dropout(0.3)` → `Dense(128, relu)` → `Dense(11, softmax)` (`lr = 1e-3`).
- **Phase 2 (Fine-Tuning, 10–15 Epochs)**: Unfreeze top 30 layers of MobileNetV2, train with `Adam(lr=1e-5)` + `EarlyStopping` + class weights (to handle imbalanced classes).
- **Explainability**: Extract `Conv_1` feature gradients (`Grad-CAM`) to highlight infected leaf lesions.

### Step C — Stage 3 Fusion (Rule-Based + Optional LLM Reasoning + 5 Safety Interlocks)
- Fuse **Stage 1 Sensor Risk** + **Stage 2 CNN Class & Confidence** + **Crop-Specific Rules** (e.g., if `Rice___Leaf_Blast` and `Nitrogen > 160 mg/kg`, warn to stop Urea; if `Soil Moisture < 30%` and `Healthy`, trigger irrigation pulse instead of fungicide).
- Validate all **5 Hardware Safety Interlocks** before activating the 12V pump MOSFET.
