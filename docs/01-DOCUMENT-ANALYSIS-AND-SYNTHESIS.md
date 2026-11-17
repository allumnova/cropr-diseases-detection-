# 01 — Complete Document Analysis & Engineering Synthesis

This document synthesizes the complete technical, academic, and operational specifications extracted from both foundational project documents:
1. **`UPCST report-4.pdf`**: *"An Expert System Prototype Development using Artificial Intelligence for Crop Management"* (UPCST Engineering Student Project Grant Scheme 2026–2027)
2. **`crop-disease-detection-final-print(2).pdf`**: *"Design and Development of an AI-Based Electrical Support System for Crop Disease Identification and Mitigation"* (First Project Progress Report, October 2026)

---

## 1. Academic & Administrative Profile

| Attribute | Details |
| :--- | :--- |
| **Institution** | Harcourt Butler Technical University (HBTU), Kanpur – 208002 |
| **Department** | Department of Electrical Engineering, School of Engineering |
| **Programme** | B.Tech Final Year — Electrical Engineering (2026–2027) |
| **Project Guide** | Dr. Shailendra Kumar Bhasker (Assistant Professor, Dept. of EE) |
| **Project In-Charge** | Dr. Sanjiv Kumar (Professor, Dept. of EE) |
| **Team Members** | Ayush Agrawal (`230105019`), Trisha Singh (`230105056`), Vipranshu Sachan (`230105061`), Yashraj Dhwaj Singh (`230105064`) |
| **Grant Scheme** | UPCST : Engineering Student Project Grant Scheme 2026–2027 |
| **Sanctioned Budget** | Rs. 20,000/- |
| **Duration** | 6 Months |

---

## 2. Problem Motivation & Agricultural Impact (India Context)

- **Economic & Yield Loss**: Government and UN Food and Agriculture Organization (FAO) estimates cited in the UPCST proposal show **30% to 40% of crops in India are lost annually** due to excessive pesticide usage, plant diseases, and weeds. Insect pests alone account for an annual loss exceeding **₹86,388 crores**.
- **National Alignment**: India's **National Pest Surveillance System (NPSS)** supports **66 crops** and over **432 pest types**, providing real-time advisories to **10,000+ extension workers** (PIB Feb 2026; NITI Aayog Frontier Tech Sept 2026 across 80 Indian districts).
- **Limitations of Conventional Monitoring**:
  - Periodic manual inspection is labor-intensive and slow across large fields.
  - Environmental transitions (micro-climate humidity, leaf wetness, soil drying) between visits go unnoticed.
  - Purely image-based models fail in isolation due to lighting, background clutter, camera orientation, and lack of micro-climatic context.
  - Purely sensor-based IoT systems indicate *favorable conditions* (risk) but cannot confirm *visible symptoms* or classify the exact pathogen.

### The Integrated Solution (Two-Stage + Mitigation Paradigm)
Both reports converge on a unified architecture:
1. **Continuous Environmental Sensing & ML Disease-Risk Assessment (Stage 1)** acts as an early-warning filter (`Environmental Sensors -> Data Acquisition -> Disease-Risk Assessment`).
2. **Triggered Image Acquisition & Deep Learning Identification (Stage 2)** activates when Risk is elevated or an obstacle/plant is detected (`Image Acquisition -> Preprocessing -> CNN Identification + XAI`).
3. **Automated Electrical Mitigation & Farmer Advisory (Stage 3)** applies crop-specific and disease-specific treatments via a 12V pump/nozzle/4WD rover with strict safety interlocks and manual overrides, while logging electrical efficiency (`Power, Current, Response Time, Thermal`).

---

## 3. Literature Survey Synthesis (15 Peer-Reviewed Studies)

From Chapter 2 of the First Project Progress Report (`crop-disease-detection-final-print(2).pdf`):

| Ref | Authors & Year | Focus / Crop | Methodology / Model | Reported Performance / Key Takeaway |
| :--- | :--- | :--- | :--- | :--- |
| **[1]** | Patle *et al.* (2022) | Mango (powdery mildew, anthracnose, root rot) | IoT Smart Sensor + **LSTM** (soil moisture, soil/ambient temp, RH, leaf wetness) | **96.0% accuracy** in field evaluation; proves temporal sensor value |
| **[2]** | Akhter & Sofi (2024) | Rice diseases | IoT (temp, humidity, rainfall, soil moisture) + **XGBoost** | **92.5% accuracy** for early decision support |
| **[3]** | Hnatiuc *et al.* (2025) | Grapevine monitoring | Cloud AIoT sensor pipeline | Real-time feasibility; highlights sensor reliability, battery life, & retraining challenges |
| **[4]** | Maurya *et al.* (2025) | Tomato leaf (10 classes, 4,595 test imgs) | **RAI-Net** (ResNet18 + Channel Attention + Inception) + **Grad-CAM** | **97.88% accuracy**; Grad-CAM improves clinical explainability |
| **[5]** | Zhang & Liu (2025) | PlantDoc & PlantVillage | **Swin-Axial Transformer** | **79.52%** (PlantDoc), **99.79%** (PlantVillage), **95.69%** (custom); lower compute |
| **[6]** | Xiao *et al.* (2025) | Citrus leaf (6 classes, 5,763 imgs) | Class-Agnostic Contrastive Learning + SOM | **97.1% accuracy** under complex field lighting/backgrounds |
| **[7]** | Hassan & Maji (2022) | PlantVillage, Rice, Cassava | Inception + Residual + Depthwise Separable CNN | **99.39%** (PlantVillage), **99.66%** (Rice), **76.59%** (Cassava); low parameter count |
| **[8]** | Joseph *et al.* (2024) | Maize, Rice, Wheat real-world | **MRW-CNN** | **97.04%** (Maize), **97.06%** (Rice), **98.08%** (Wheat) |
| **[9]** | Nigar *et al.* (2024) | 38 plant diseases (~87k imgs) | **EfficientNetB0** + **LIME XAI** | **99.69% accuracy**; notes need for IoT sensor fusion |
| **[10]** | Mishra *et al.* (2023) | Millet (blast & rust) | IoT sensors -> Cloud/RPi + Customized CNN | **98.8% accuracy**, 98.2% precision, 97.4% recall, 97.7% F1 |
| **[11]** | Hu *et al.* (2020) | Multi-crop fine-grained disease | **MDFC-ResNet** (species + coarse + fine compensation) | Automated IoT diagnosis & farmer transmission |
| **[12]** | Babu *et al.* (2024) | Tomato (South India) | IoT soil (Temp, RH, pH, **N, P, K**) + **Bayesian-KNN** | **95% accuracy**, 95% precision, 95% recall, 94% F1 |
| **[13]** | Reddy *et al.* (2025) | Multi-crop health | Environmental + soil + leaf wetness + **Random Forest & CNN** | **94.7% accuracy** for early stress & disease detection |
| **[14]** | Nawaz *et al.* (2020) | Early IoT sensing | Temp, humidity, leaf-color IoT processing | Foundational binary healthy/infected IoT classifier |
| **[15]** | Abdelli *et al.* (2025) | Wheat plot telemetry | Solar ESP8266 + ESP32 + **ESP-NOW / LoRa** | **>95% PDR up to 2 km**, <3% overnight discharge; blueprint for field power & comms |

### Identified Research Gap
Most prior systems implement *either* continuous environmental telemetry *or* offline CNN image classification—rarely integrating both into a **low-cost (< Rs. 20,000), power-monitored, electrically actuated mobile prototype** with closed-loop mitigation safety interlocks and explainable Grad-CAM diagnostics.

---

## 4. Complete Hardware Bill of Materials (BOM) & UPCST Budget

From Section 5 & Section 7 (Table 2) of `UPCST report-4.pdf`:

| S.No | Subsystem | Component | Qty | Unit Cost (Rs.) | Total Cost (Rs.) | Role / Remarks |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 1 | Control | **ESP32 (38-Pin) Dev Board** | 1 | 450 | 450 | Main MCU: sensor polling, motor/pump PWM, Wi-Fi/MQTT |
| 2 | Image Detection | **ESP32-CAM + OV2640** | 1 | 675 | 675 | Leaf image capture, flash LED, SD backup |
| 3 | Env Sensors | **DHT22 Sensor** | 1 | 175 | 175 | Primary ambient temperature & relative humidity |
| 4 | Env Sensors | **Temp & Humidity Redundant Probe** | 1 | 200 | 200 | Can be configured as soil/canopy temp-humidity check |
| 5 | Soil Sensors | **Capacitive Soil Moisture Sensor** | 1 | 200 | 200 | Corrosion-resistant analog moisture % measurement |
| 6 | Env Sensors | **BH1750 Light Sensor** | 1 | 150 | 150 | I2C digital ambient illuminance (Lux) |
| 7 | Navigation | **HC-SR04 Ultrasonic Sensor** | 1 | 139 | 139 | Obstacle & plant-target distance trigger |
| 8 | Navigation | **IR Sensor** | 1 | 149 | 149 | Crop row / path line tracking |
| 9 | Display & Storage | **OLED Display + SD Card** | 1 | 300 | 300 | SSD1306 0.96" I2C local telemetry & alert readout + SD storage |
| 10 | Mobility | **4WD Metal Chassis + Geared Motors + Wheels** | 1 | 2,500 | 2,500 | Rugged field rover base platform |
| 11 | Mobility | **Motor Drive Module (L298N / Dual H-Bridge)** | 1 | 500 | 500 | Bi-directional PWM drive for 4WD motors |
| 12 | Mobility | **Wheel Encoders (4-wheel set)** | 1 | 580 | 580 | Odometry, RPM feedback, & distance traversed |
| 13 | Actuation & Cam | **Servo Motors (SG90/MG995)** | 5 | 200 | 1,000 | Camera pan/tilt gimbal (2) + spray nozzle articulation (2) + valve/arm (1) |
| 14 | Power | **Rechargeable Battery Pack with BMS** | 1 | 1,350 | 1,350 | 12V Li-ion/LiFePO4 pack with Battery Management System |
| 15 | Power | **DC-DC Buck Converter (LM2596 / XL4015)** | 1 | 500 | 500 | Efficient step-down regulation to 5V & 3.3V logic rails |
| 16 | Electrical Sense | **Voltage & Current Sensing Module (INA219)** | 1 | 250 | 250 | Real-time electrical power, current demand & efficiency testing |
| 17 | Mitigation | **12V Mini Water Pump** | 1 | 250 | 250 | Pressurized targeted liquid/fungicide dispensing |
| 18 | Mitigation | **MOSFET Driver (IRLZ44N / Module)** | 1 | 150 | 150 | Logic-level PWM switching for 12V pump with flyback diode |
| 19 | Mitigation | **Small Tank, Spray Nozzle & Solenoid/Check Valve** | 1 | 350 | 350 | Storage reservoir & targeted misting nozzle |
| 20 | Protection | **Main Switch & Fuse Assembly** | 1 | 300 | 300 | Master cutoff, overcurrent protection & power insulation |
| 21 | Misc & Alarm | **LED, Buzzer, Wires, Connectors, Fasteners, Standoffs** | 1 | 800 | 800 | Local audio/visual health status alarm + mechanical integration |
| — | *Additional (Table 1)* | **NPK Sensor (RS485 Soil N-P-K) & Battery Charger** | — | — | *Allocated within Rs. 20,000 grant ceiling* | Soil macronutrient sensing (Table 1) & charger (`Table 2 sum = Rs. 11,098`, leaving ~Rs. 8,902 headroom within Rs. 20,000 UPCST grant for NPK sensor, spare Li-ion cells, enclosures, and field-trial consumables)* |

---

## 5. Software & Evaluation Matrix (Derived from Both Reports)

1. **Software Stack**:
   - **Embedded Firmware**: Arduino IDE (C++ for ESP32 & ESP32-CAM) + Keil/C control routines for actuator timing.
   - **AI/ML Training**: Python 3 + TensorFlow/Keras (MobileNetV2, EfficientNetB0) + Scikit-Learn/XGBoost + Grad-CAM explainability.
   - **Application & Command Center**: Next.js (App Router, TypeScript Strict), TailwindCSS + Framer Motion + Recharts, Node.js MQTT Worker, PostgreSQL/TimescaleDB.
2. **4-Part Prototype Evaluation Protocol (Section 4.4 of UPCST Report)**:
   - **Hardware Functional Testing**: Individual and integrated validation of sensors, camera, relays/MOSFET, OLED, and Wi-Fi links.
   - **AI Performance Testing**: Accuracy, false-positive rate (FPR), inference latency (ms), and cross-lighting/cross-crop generalization.
   - **Electrical Performance Testing**: Power consumption (W), peak current demand (A), actuator response time (ms), and system operating temperature (°C).
   - **Mitigation Effectiveness Testing**: Controlled comparison trials (treated vs. untreated control plants).
