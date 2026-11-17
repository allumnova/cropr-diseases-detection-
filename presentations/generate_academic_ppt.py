"""
Generates a clean, minimalist, zero-fluff academic PowerPoint (.pptx) strictly
following the exact chapter indexing and content of:
  crop-disease-detection-final-print(2).pdf
"""

from pathlib import Path
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.util import Inches, Pt

NAVY = RGBColor(0x1F, 0x49, 0x7D)
BLACK = RGBColor(0x11, 0x18, 0x27)
GRAY = RGBColor(0x4B, 0x55, 0x63)
LIGHT_GRAY = RGBColor(0xF3, 0xF4, 0xF6)
BORDER = RGBColor(0xD1, 0xD5, 0xDB)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)

FONT = "Calibri"


def add_slide_header(slide, index_label: str, title: str, slide_num: int):
    # Clean academic title + thin rule (no decorative boxes/gradients)
    tb = slide.shapes.add_textbox(Inches(0.9), Inches(0.45), Inches(18.2), Inches(1.05))
    tf = tb.text_frame
    tf.word_wrap = True

    p0 = tf.paragraphs[0]
    p0.text = index_label.upper()
    p0.font.name = FONT
    p0.font.size = Pt(14)
    p0.font.bold = True
    p0.font.color.rgb = GRAY

    p1 = tf.add_paragraph()
    p1.text = title
    p1.font.name = FONT
    p1.font.size = Pt(30)
    p1.font.bold = True
    p1.font.color.rgb = NAVY

    rule = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.9), Inches(1.55), Inches(18.2), Inches(0.025))
    rule.fill.solid()
    rule.fill.fore_color.rgb = NAVY
    rule.line.fill.background()

    # Plain academic footer
    ft = slide.shapes.add_textbox(Inches(0.9), Inches(10.55), Inches(16.5), Inches(0.4))
    fp = ft.text_frame.paragraphs[0]
    fp.text = "Department of Electrical Engineering, HBTU Kanpur"
    fp.font.name = FONT
    fp.font.size = Pt(12)
    fp.font.color.rgb = GRAY

    sn = slide.shapes.add_textbox(Inches(17.6), Inches(10.55), Inches(1.5), Inches(0.4))
    sp = sn.text_frame.paragraphs[0]
    sp.alignment = PP_ALIGN.RIGHT
    sp.text = f"Slide {slide_num}"
    sp.font.name = FONT
    sp.font.size = Pt(12)
    sp.font.color.rgb = GRAY


def add_bullets(slide, left: float, top: float, width: float, height: float, items: list[tuple[str, str]], size_pt: int = 19):
    tb = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = tb.text_frame
    tf.word_wrap = True

    for idx, (heading, body) in enumerate(items):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.space_after = Pt(12)
        if heading:
            r1 = p.add_run()
            r1.text = f"•  {heading}: "
            r1.font.name = FONT
            r1.font.size = Pt(size_pt)
            r1.font.bold = True
            r1.font.color.rgb = BLACK

            r2 = p.add_run()
            r2.text = body
            r2.font.name = FONT
            r2.font.size = Pt(size_pt)
            r2.font.color.rgb = BLACK
        else:
            r1 = p.add_run()
            r1.text = f"•  {body}"
            r1.font.name = FONT
            r1.font.size = Pt(size_pt)
            r1.font.color.rgb = BLACK


def add_plain_table(slide, left: float, top: float, width: float, height: float, headers: list[str], rows: list[list[str]], col_widths: list[float], font_pt: int = 15):
    shape = slide.shapes.add_table(len(rows) + 1, len(headers), Inches(left), Inches(top), Inches(width), Inches(height))
    table = shape.table
    for i, w in enumerate(col_widths):
        table.columns[i].width = Inches(w)

    for c_idx, h in enumerate(headers):
        cell = table.cell(0, c_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = NAVY
        cell.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.name = FONT
        p.font.size = Pt(font_pt)
        p.font.bold = True
        p.font.color.rgb = WHITE

    for r_idx, row in enumerate(rows):
        bg = WHITE if r_idx % 2 == 0 else LIGHT_GRAY
        for c_idx, val in enumerate(row):
            cell = table.cell(r_idx + 1, c_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = bg
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.name = FONT
            p.font.size = Pt(font_pt)
            p.font.color.rgb = BLACK


def build_academic_ppt(out_path: Path):
    prs = Presentation()
    prs.slide_width = Inches(20.0)
    prs.slide_height = Inches(11.25)
    blank = prs.slide_layouts[6]

    # Slide 1: Cover Page (Matching Report Title Page)
    s1 = prs.slides.add_slide(blank)
    tb = s1.shapes.add_textbox(Inches(1.5), Inches(1.2), Inches(17.0), Inches(4.6))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.text = "PROJECT PROGRESS PRESENTATION"
    p.font.name = FONT
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = GRAY
    p.space_after = Pt(18)

    p2 = tf.add_paragraph()
    p2.alignment = PP_ALIGN.CENTER
    p2.text = "Design and Development of an AI-Based Electrical Support System\nfor Crop Disease Identification and Mitigation"
    p2.font.name = FONT
    p2.font.size = Pt(38)
    p2.font.bold = True
    p2.font.color.rgb = NAVY
    p2.space_after = Pt(18)

    p3 = tf.add_paragraph()
    p3.alignment = PP_ALIGN.CENTER
    p3.text = "Bachelor of Technology in Electrical Engineering\nDepartment of Electrical Engineering, Harcourt Butler Technical University, Kanpur"
    p3.font.name = FONT
    p3.font.size = Pt(20)
    p3.font.color.rgb = BLACK

    add_plain_table(
        s1, 2.2, 6.2, 15.6, 3.6,
        ["Submitted By (Final Year EE)", "Supervision"],
        [
            ["Ayush Agrawal (230105019)", "Project Guide: Dr. Shailendra Kumar Bhasker (Asst. Prof., Dept. of EE)"],
            ["Trisha Singh (230105056)", "Project In-Charge: Dr. Sanjiv Kumar (Professor, Dept. of EE)"],
            ["Vipranshu Sachan (230105061)", "Target Crops: Wheat, Tomato & Rice"],
            ["Yashraj Dhwaj Singh (230105064)", "Grant Reference: UPCST Student Project Grant (Rs. 20,000/-)"],
        ],
        [7.4, 8.2],
        font_pt=16,
    )

    # Slide 2: Proper Indexing (Table of Contents matching report)
    s2 = prs.slides.add_slide(blank)
    add_slide_header(s2, "Index", "Table of Contents", 2)
    add_plain_table(
        s2, 1.2, 2.0, 17.6, 8.0,
        ["Section", "Topic", "Slide(s)"],
        [
            ["Chapter 1", "Introduction: Background, Monitoring Need & Integrated IoT-ML Approach", "3 – 5"],
            ["Chapter 2 (2.1–2.2)", "Literature Survey: Selected Research Papers (Wheat, Tomato & Rice)", "6 – 7"],
            ["Chapter 2 (2.3–2.5)", "Research Gap, Problem Definition & Project Objectives", "8"],
            ["Chapter 2 (2.6)", "Proposed System Architecture (2-Stage Sensing + Vision + Mitigation)", "9"],
            ["Chapter 2 (2.7)", "System Requirements: Hardware BOM (Table 2.1) & Software Stack (Table 2.2)", "10 – 11"],
            ["Chapter 2 (2.8)", "Proposed Methodology: Preprocessing, CNN Model & Mitigation Rules", "12"],
            ["Chapter 3", "Conclusion, Current Implementation Status & Bibliography", "13 – 14"],
        ],
        [3.2, 12.2, 2.2],
        font_pt=17,
    )

    # Slide 3: Chapter 1 (1.1 - 1.2)
    s3 = prs.slides.add_slide(blank)
    add_slide_header(s3, "Chapter 1 : Introduction", "1.1 Background, Motivation & Crop Disease Monitoring", 3)
    add_bullets(
        s3, 1.0, 2.0, 18.0, 8.0,
        [
            ("Agricultural Impact", "Crop diseases reduce yield and quality across major Indian crops such as Wheat, Tomato, and Rice."),
            ("Limitation of Manual Inspection", "Periodic visual field visits are time-consuming, depend on human expertise, and miss environmental changes between inspections."),
            ("Role of Environmental Parameters", "Factors such as temperature, relative humidity, soil moisture, and leaf wetness directly influence pathogen germination."),
            ("Risk Prediction vs. Identification", "Sensor readings indicate favourable disease-risk conditions; leaf images are required to confirm visible disease symptoms."),
            ("Goal of the Project", "Integrate continuous IoT sensing with triggered image-based deep learning and safe electrical mitigation."),
        ],
        size_pt=20,
    )

    # Slide 4: Chapter 1 (Table 1.1)
    s4 = prs.slides.add_slide(blank)
    add_slide_header(s4, "Chapter 1 : Introduction (1.3)", "Table 1.1 — Conventional vs. Automated Crop Disease Monitoring", 4)
    add_plain_table(
        s4, 1.0, 2.0, 18.0, 7.9,
        ["Parameter", "Conventional Monitoring", "Automated Monitoring (Proposed)"],
        [
            ["Monitoring Method", "Manual field inspection", "Sensor- and technology-assisted monitoring"],
            ["Data Collection", "Mainly visual observation", "Sensors, leaf images, and digital logs"],
            ["Monitoring Frequency", "Periodic field visits", "Continuous or at predefined intervals"],
            ["Human Involvement", "Relatively high", "Reduced for routine monitoring"],
            ["Disease-Risk Indication", "Observation and experience", "Supported by data analysis and ML"],
            ["Visual Identification", "Performed by farmer/expert", "Assisted by CNN image processing & XAI"],
            ["Historical Data", "Limited manual records", "Stored systematically for model refinement"],
        ],
        [4.2, 6.2, 7.6],
        font_pt=16,
    )

    # Slide 5: Chapter 1 (1.4 - 1.7)
    s5 = prs.slides.add_slide(blank)
    add_slide_header(s5, "Chapter 1 : Introduction (1.4 – 1.7)", "Integrated Approach: IoT, Machine Learning & Image Processing", 5)
    add_bullets(
        s5, 1.0, 2.0, 18.0, 4.2,
        [
            ("IoT Sensing Layer", "Microcontroller collects temperature, humidity, soil moisture, light intensity, and soil NPK at regular intervals."),
            ("Stage 1 — Disease-Risk Assessment", "ML classifier analyses environmental data to estimate disease risk before visible necrosis spreads."),
            ("Stage 2 — Triggered Image Identification", "When elevated risk is indicated, ESP32-CAM captures leaf images for CNN classification."),
            ("Why Combine Both", "Image-only models suffer from outdoor lighting and background noise; combining sensors + vision improves reliability and saves power."),
        ],
        size_pt=19,
    )

    # Simple plain linear flow diagram at bottom (Figure 1.1 / 1.7)
    flow_steps = [
        "Environmental\nSensors",
        "Data Acquisition\n(ESP32)",
        "Disease-Risk\nAssessment (ML)",
        "Triggered Image\nAcquisition",
        "CNN Disease\nIdentification",
        "Mitigation &\nAlert",
    ]
    for i, label in enumerate(flow_steps):
        x = 0.9 + i * 3.1
        box = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(6.9), Inches(2.65), Inches(1.5))
        box.fill.solid()
        box.fill.fore_color.rgb = LIGHT_GRAY
        box.line.color.rgb = NAVY
        box.line.width = Pt(1.5)
        p = box.text_frame.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        p.text = label
        p.font.name = FONT
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = BLACK
        if i < len(flow_steps) - 1:
            arr = s5.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(x + 2.7), Inches(7.45), Inches(0.35), Inches(0.4))
            arr.fill.solid()
            arr.fill.fore_color.rgb = NAVY
            arr.line.fill.background()

    # Slide 6: Chapter 2 (2.2 Literature Survey Part 1)
    s6 = prs.slides.add_slide(blank)
    add_slide_header(s6, "Chapter 2 : Literature Survey (2.1 – 2.2)", "Review of Selected Research Papers — Sensor & IoT Models", 6)
    add_plain_table(
        s6, 0.9, 2.0, 18.2, 7.8,
        ["Ref", "Authors & Year", "Crop / Parameters", "Model Used", "Key Finding"],
        [
            ["[1]", "Patle et al. (2022)", "Mango (Soil/Air Temp, RH, Leaf Wetness)", "LSTM Network", "96.0% accuracy in field evaluation"],
            ["[2]", "Akhter & Sofi (2024)", "Rice (Temp, RH, Rainfall, Soil Moisture)", "XGBoost", "92.5% accuracy for early decision support"],
            ["[3]", "Hnatiuc et al. (2025)", "Grapevine (Cloud AIoT sensors)", "ML Classifiers", "Highlights battery, reliability & retraining issues"],
            ["[12]", "Babu et al. (2024)", "Tomato (Temp, RH, pH, N, P, K)", "Bayesian-KNN", "95.0% accuracy; validates NPK integration"],
            ["[13]", "Reddy et al. (2025)", "Multi-crop (Env + Soil + Leaf Wetness)", "Random Forest + CNN", "94.7% accuracy for early stress detection"],
            ["[15]", "Abdelli et al. (2025)", "Wheat Plot (Solar ESP32 + LoRa)", "ESP-NOW / LoRa", ">95% PDR up to 2 km (<3% overnight drain)"],
        ],
        [1.0, 3.2, 5.2, 3.4, 5.4],
        font_pt=15,
    )

    # Slide 7: Chapter 2 (2.2 Literature Survey Part 2 — Vision Models)
    s7 = prs.slides.add_slide(blank)
    add_slide_header(s7, "Chapter 2 : Literature Survey (2.2 Continued)", "Review of Selected Research Papers — Image-Based Deep Learning", 7)
    add_plain_table(
        s7, 0.9, 2.0, 18.2, 7.8,
        ["Ref", "Authors & Year", "Crop / Dataset", "Model Used", "Key Finding"],
        [
            ["[4]", "Maurya et al. (2025)", "Tomato (10 classes, 4,595 test imgs)", "RAI-Net + Grad-CAM", "97.88% accuracy; Grad-CAM improves explainability"],
            ["[5]", "Zhang & Liu (2025)", "PlantDoc & PlantVillage", "Swin-Axial Transformer", "99.79% (PlantVillage), 79.52% (PlantDoc)"],
            ["[7]", "Hassan & Maji (2022)", "PlantVillage, Rice, Cassava", "Depthwise Separable CNN", "99.66% on Rice with reduced parameters"],
            ["[8]", "Joseph et al. (2024)", "Maize, Rice, Wheat (Real-world)", "MRW-CNN", "98.08% (Wheat), 97.06% (Rice), 97.04% (Maize)"],
            ["[9]", "Nigar et al. (2024)", "38 Plant Diseases (~87k images)", "EfficientNetB0 + LIME", "99.69% accuracy; recommends IoT fusion"],
            ["[10]", "Mishra et al. (2023)", "Millet (Blast & Rust)", "IoT + Customized CNN", "98.8% accuracy, 97.7% F1-score"],
        ],
        [1.0, 3.2, 4.8, 3.6, 5.6],
        font_pt=15,
    )

    # Slide 8: Chapter 2 (2.3 - 2.5)
    s8 = prs.slides.add_slide(blank)
    add_slide_header(s8, "Chapter 2 : Research Gap & Objectives (2.3 – 2.5)", "Problem Definition & Project Objectives", 8)
    add_bullets(
        s8, 1.0, 2.0, 18.0, 8.2,
        [
            ("Research Gap (2.3)", "Existing studies focus either on sensor-only risk or offline image classification, with limited low-cost embedded prototypes combining both under power and safety constraints."),
            ("Problem Definition (2.4)", "Develop an integrated framework using IoT sensors for continuous disease-risk assessment and triggered image analysis for visible symptom identification."),
            ("Obj 2.5.1 – 2.5.2 (Sensing & Acquisition)", "Monitor temperature, humidity, soil moisture, light intensity, and NPK via ESP32 at regular intervals."),
            ("Obj 2.5.3 – 2.5.4 (Risk & Identification)", "Use ML on sensor streams for early warning and CNN + Grad-CAM on leaf images for Wheat, Tomato, and Rice diagnosis."),
            ("Obj 2.5.5 – 2.5.7 (Integration, Power & Feasibility)", "Integrate sensing, identification, electrical mitigation (12V pump + MOSFET), and power monitoring (INA219) into a feasible field prototype."),
        ],
        size_pt=18,
    )

    # Slide 9: Chapter 2 (2.6 Proposed System Architecture)
    s9 = prs.slides.add_slide(blank)
    add_slide_header(s9, "Chapter 2 : Proposed System Architecture (2.6)", "Figure 2.1 — Conceptual Architecture for Crop Disease Monitoring & Mitigation", 9)
    add_bullets(
        s9, 1.0, 2.0, 18.0, 4.4,
        [
            ("Stage 1 — Environmental Sensing & Risk Gate", "ESP32 reads DHT22, Soil Moisture, BH1750, NPK & HC-SR04 -> ML model computes Risk Score (0–100%)."),
            ("Conditional Trigger", "If Risk >= Threshold (60%) or Plant Target Detected -> ESP32-CAM captures leaf image; otherwise remains in low-power monitoring."),
            ("Stage 2 — Image-Based Identification", "Image is resized (224x224), denoised, CLAHE-normalized, and classified by MobileNetV2 CNN + Grad-CAM."),
            ("Stage 3 — Mitigation & Safety Interlocks", "12V pump actuates via IRLZ44N MOSFET only when AI confidence, battery voltage (>= 10.8V), tank level (>= 10%), and cooldown pass."),
        ],
        size_pt=18,
    )
    pwr = s9.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.0), Inches(7.3), Inches(18.0), Inches(1.3))
    pwr.fill.solid()
    pwr.fill.fore_color.rgb = LIGHT_GRAY
    pwr.line.color.rgb = NAVY
    pwr.line.width = Pt(1.5)
    pp = pwr.text_frame.paragraphs[0]
    pp.alignment = PP_ALIGN.CENTER
    pp.text = "Power Supply & Evaluation Subsystem: 12V BMS Battery -> Main Switch & Fuse -> LM2596 Buck (5V / 3.3V) + INA219 Voltage/Current Sensor"
    pp.font.name = FONT
    pp.font.size = Pt(17)
    pp.font.bold = True
    pp.font.color.rgb = NAVY

    # Slide 10: Chapter 2 (2.7.1 Hardware Requirements - Table 2.1)
    s10 = prs.slides.add_slide(blank)
    add_slide_header(s10, "Chapter 2 : System Requirements (2.7.1)", "Table 2.1 — Hardware Requirements & Estimated Cost (Rs. 20,000 Grant)", 10)
    add_plain_table(
        s10, 0.9, 1.9, 18.2, 8.2,
        ["Subsystem", "Hardware Components", "Purpose", "Est. Cost (Rs.)"],
        [
            ["Control & Display", "ESP32 (38-Pin), SSD1306 OLED + SD Card", "Main MCU, sensor polling, local readout", "750"],
            ["Image Detection", "ESP32-CAM (OV2640), Pan/Tilt Servo Bracket", "Triggered leaf image capture & SD backup", "1,075"],
            ["Env & Soil Sensors", "DHT22, Temp/RH Probe, Soil Moisture, BH1750, NPK", "Measure canopy & soil parameters", "725 (+ NPK)"],
            ["Navigation", "HC-SR04 Ultrasonic, IR Sensor, 4 Wheel Encoders", "Plant/obstacle detection & row tracking", "868"],
            ["Mobility", "4WD Metal Chassis + Geared Motors + L298N Driver", "Field movement across crop rows", "3,000"],
            ["Power & Sensing", "12V BMS Battery, LM2596 Buck, INA219, Fuse/Switch", "Regulated supply & power evaluation", "2,400"],
            ["Mitigation & Misc", "12V Water Pump, IRLZ44N MOSFET, Nozzle, Tank, LED/Buzzer", "Targeted spraying & local status alarm", "2,280"],
        ],
        [3.2, 6.8, 5.8, 2.4],
        font_pt=15,
    )

    # Slide 11: Chapter 2 (2.7.2 Software Requirements - Table 2.2)
    s11 = prs.slides.add_slide(blank)
    add_slide_header(s11, "Chapter 2 : System Requirements (2.7.2)", "Table 2.2 — Software Requirements & Implementation Tools", 11)
    add_plain_table(
        s11, 1.0, 2.0, 18.0, 7.6,
        ["Software Category", "Tools / Frameworks Selected", "Purpose in System"],
        [
            ["Embedded Programming", "Arduino IDE (C++ for ESP32 & ESP32-CAM)", "Sensor acquisition, motor PWM, MOSFET pump & Wi-Fi sync"],
            ["Data & Risk Processing", "Python (Scikit-Learn / XGBoost) & TypeScript", "Preprocessing, Leaf Wetness Index & Stage 1 risk scoring"],
            ["Machine Learning & Vision", "TensorFlow / Keras (MobileNetV2 + Grad-CAM), OpenCV", "224x224 CLAHE preprocessing & Wheat/Tomato/Rice CNN"],
            ["Storage & Messaging", "PostgreSQL / TimescaleDB + Mosquitto MQTT Broker", "Time-series sensor/electrical logs & device pub/sub"],
            ["Monitoring & Control UI", "Next.js Dashboard (REST APIs + Live Telemetry)", "Real-time visualization, Grad-CAM inspection & rover control"],
        ],
        [4.2, 6.2, 7.6],
        font_pt=16,
    )

    # Slide 12: Chapter 2 (2.8 Proposed Methodology)
    s12 = prs.slides.add_slide(blank)
    add_slide_header(s12, "Chapter 2 : Proposed Methodology (2.8)", "Step-by-Step Execution Stages (2.8.1 – 2.8.8)", 12)
    add_plain_table(
        s12, 1.0, 2.0, 18.0, 8.0,
        ["Stage", "Methodology Step", "Implementation Details"],
        [
            ["2.8.1 – 2.8.2", "Environmental Acquisition & Transmission", "ESP32 polls sensors every 3s and transmits via HTTP POST / MQTT"],
            ["2.8.3 – 2.8.4", "Sensor Preprocessing & Risk Assessment", "Clean missing values, compute LWI, evaluate Wheat/Tomato/Rice risk score"],
            ["2.8.5 – 2.8.6", "Triggered Image Acquisition & Preprocessing", "ESP32-CAM captures JPEG -> 224x224 resize, Gaussian denoise, LAB CLAHE"],
            ["2.8.7", "Image-Based Disease Identification", "MobileNetV2 CNN classifies disease + Grad-CAM highlights infected region"],
            ["2.8.8", "Monitoring, Alert & Electrical Mitigation", "OLED/LED/Buzzer alert + 5 safety interlocks gate 12V MOSFET pump actuation"],
        ],
        [2.4, 5.8, 9.8],
        font_pt=16,
    )

    # Slide 13: Chapter 3 (3.1 Conclusions & Current Status)
    s13 = prs.slides.add_slide(blank)
    add_slide_header(s13, "Chapter 3 : Conclusions (3.1)", "Conclusion & Current Project Progress", 13)
    add_bullets(
        s13, 1.0, 2.0, 18.0, 8.0,
        [
            ("Summary of Findings", "Combining continuous IoT environmental monitoring with triggered CNN image identification overcomes the limitations of manual inspection and image-only models."),
            ("Target Crops Finalized", "System designed for Wheat (Yellow/Brown Rust, Septoria), Tomato (Early/Late Blight, Bacterial Spot), and Rice (Leaf Blast, Brown Spot)."),
            ("Software & Firmware Readiness", "Dockerized Next.js dashboard, Python FastAPI/MobileNetV2 pipeline, TimescaleDB schema, and ESP32/ESP32-CAM sketches are completed."),
            ("Electrical Safety & Testing Plan", "Protects hardware via 1N4007 flyback diode, 5A fuse, and 5 safety interlocks; evaluates power, latency, and accuracy using INA219."),
            ("Next Phase", "Hardware component procurement, 4WD chassis wiring, dataset fine-tuning, and controlled plot trials."),
        ],
        size_pt=19,
    )

    # Slide 14: Bibliography (Selected Key References)
    s14 = prs.slides.add_slide(blank)
    add_slide_header(s14, "Bibliography", "Selected References from Project Progress Report", 14)
    add_bullets(
        s14, 1.0, 1.9, 18.0, 8.2,
        [
            ("[1]", "K. S. Patle et al., \"Field Evaluation of Smart Sensor System for Plant Disease Prediction Using LSTM Network,\" IEEE Sensors Journal, vol. 22, no. 4, pp. 3715–3725, 2022."),
            ("[2]", "R. Akhter and S. A. Sofi, \"Decision Making in Precision Agriculture Using IoT and Machine Learning: A Focus on Rice Diseases,\" IEEE DASA, 2024."),
            ("[4]", "R. Maurya, L. Rajput, and S. Mahapatra, \"RAI-Net: Tomato Plant Disease Classification Using Residual-Attention-Inception Network,\" IEEE Access, vol. 13, 2025."),
            ("[7]", "S. K. M. Hassan and A. K. Maji, \"Plant Disease Identification Using a Novel Convolutional Neural Network,\" IEEE Access, vol. 10, pp. 5390–5401, 2022."),
            ("[8]", "D. S. Joseph, P. M. Pawar, and K. Chakradeo, \"Real-Time Plant Disease Dataset Development and Detection Using Deep Learning,\" IEEE Access, vol. 12, 2024."),
            ("[12]", "G. R. Babu et al., \"Integrating IoT for Soil Monitoring and Hybrid ML in Predicting Tomato Crop Disease,\" Sensors, vol. 24, no. 19, p. 6177, 2024."),
            ("[15]", "A. Abdelli et al., \"Field Validated Hybrid ESP-NOW and Long Range IoT Monitoring System,\" IEEE Access, vol. 13, 2025."),
        ],
        size_pt=16,
    )

    prs.save(str(out_path))
    print(f"Saved Academic Presentation to: {out_path}")


if __name__ == "__main__":
    out = Path(__file__).resolve().parent / "03-Academic-Report-Aligned-Presentation.pptx"
    build_academic_ppt(out)
