"""
Generates the Second-Turn Project Progress Presentation (.pptx) matching the exact
20.0 x 11.25 in (16:9) academic bright/clean format of PROJECT PRESENTATION-2-1.pptx.
"""

from pathlib import Path
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.util import Inches, Pt

NAVY = RGBColor(0x1F, 0x49, 0x7D)
GREEN = RGBColor(0x2E, 0x6F, 0x40)
BLUE = RGBColor(0x4F, 0x81, 0xBD)
AMBER = RGBColor(0xC0, 0x50, 0x4D)
DARK = RGBColor(0x1E, 0x29, 0x3B)
MUTED = RGBColor(0x47, 0x55, 0x69)
LIGHT_BG = RGBColor(0xF8, 0xFA, 0xFC)
LIGHT_GREEN = RGBColor(0xF0, 0xFD, 0xF4)
LIGHT_BLUE = RGBColor(0xEF, 0xF6, 0xFF)
LIGHT_AMBER = RGBColor(0xFF, 0xFB, 0xEB)
BORDER = RGBColor(0xCB, 0xD5, 0xE1)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)

FONT_NAME = "Calibri"


def new_prs() -> Presentation:
    prs = Presentation()
    prs.slide_width = Inches(20.0)
    prs.slide_height = Inches(11.25)
    return prs


def add_blank_slide(prs: Presentation):
    return prs.slides.add_slide(prs.slide_layouts[6])


def add_header(slide, title: str, subtitle: str = "", slide_num: int = 0):
    # Top accent bar
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(20.0), Inches(0.16))
    bar.fill.solid()
    bar.fill.fore_color.rgb = NAVY
    bar.line.fill.background()

    # Left green accent strip next to title
    strip = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(0.55), Inches(0.14), Inches(0.75))
    strip.fill.solid()
    strip.fill.fore_color.rgb = GREEN
    strip.line.fill.background()

    tb = slide.shapes.add_textbox(Inches(1.1), Inches(0.45), Inches(17.5), Inches(0.95))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = title
    p.font.name = FONT_NAME
    p.font.size = Pt(34)
    p.font.bold = True
    p.font.color.rgb = NAVY

    if subtitle:
        p2 = tf.add_paragraph()
        p2.text = subtitle
        p2.font.name = FONT_NAME
        p2.font.size = Pt(18)
        p2.font.color.rgb = MUTED

    # Divider line
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.55), Inches(18.4), Inches(0.03))
    line.fill.solid()
    line.fill.fore_color.rgb = BORDER
    line.line.fill.background()

    # Footer
    ft = slide.shapes.add_textbox(Inches(0.8), Inches(10.55), Inches(18.4), Inches(0.45))
    ftf = ft.text_frame
    fp = ftf.paragraphs[0]
    fp.text = f"Dept. of Electrical Engineering, HBTU Kanpur  |  AI-Based Electrical Support System for Crop Disease Identification & Mitigation"
    fp.font.name = FONT_NAME
    fp.font.size = Pt(13)
    fp.font.color.rgb = MUTED

    if slide_num > 0:
        sn = slide.shapes.add_textbox(Inches(18.2), Inches(10.55), Inches(1.0), Inches(0.45))
        sp = sn.text_frame.paragraphs[0]
        sp.alignment = PP_ALIGN.RIGHT
        sp.text = str(slide_num)
        sp.font.name = FONT_NAME
        sp.font.size = Pt(14)
        sp.font.bold = True
        sp.font.color.rgb = NAVY


def add_card(slide, left, top, width, height, title: str, bullets: list[str], fill=LIGHT_BG, border=BORDER, title_color=NAVY):
    box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
    box.adjustments[0] = 0.03
    box.fill.solid()
    box.fill.fore_color.rgb = fill
    box.line.color.rgb = border
    box.line.width = Pt(1.5)

    tb = slide.shapes.add_textbox(Inches(left + 0.28), Inches(top + 0.2), Inches(width - 0.56), Inches(height - 0.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = title
    p.font.name = FONT_NAME
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.color.rgb = title_color
    p.space_after = Pt(10)

    for b in bullets:
        bp = tf.add_paragraph()
        bp.text = f"•  {b}"
        bp.font.name = FONT_NAME
        bp.font.size = Pt(17)
        bp.font.color.rgb = DARK
        bp.space_after = Pt(7)


def add_table(slide, left, top, width, height, headers: list[str], rows: list[list[str]], col_widths: list[float], font_pt: int = 15):
    tbl_shape = slide.shapes.add_table(len(rows) + 1, len(headers), Inches(left), Inches(top), Inches(width), Inches(height))
    table = tbl_shape.table
    for i, w in enumerate(col_widths):
        table.columns[i].width = Inches(w)

    for c_idx, h in enumerate(headers):
        cell = table.cell(0, c_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = NAVY
        cell.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.name = FONT_NAME
        p.font.size = Pt(font_pt)
        p.font.bold = True
        p.font.color.rgb = WHITE

    for r_idx, row in enumerate(rows):
        bg = WHITE if r_idx % 2 == 0 else LIGHT_BG
        for c_idx, val in enumerate(row):
            cell = table.cell(r_idx + 1, c_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = bg
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.name = FONT_NAME
            p.font.size = Pt(font_pt)
            p.font.color.rgb = DARK


def build_presentation(out_path: Path):
    prs = new_prs()

    # 1. Title Slide
    s1 = add_blank_slide(prs)
    top_band = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(20.0), Inches(0.35))
    top_band.fill.solid()
    top_band.fill.fore_color.rgb = NAVY
    top_band.line.fill.background()

    bot_band = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(10.9), Inches(20.0), Inches(0.35))
    bot_band.fill.solid()
    bot_band.fill.fore_color.rgb = GREEN
    bot_band.line.fill.background()

    tb = s1.shapes.add_textbox(Inches(1.4), Inches(1.1), Inches(17.2), Inches(4.5))
    tf = tb.text_frame
    tf.word_wrap = True
    p0 = tf.paragraphs[0]
    p0.alignment = PP_ALIGN.CENTER
    p0.text = "SECOND PROJECT PROGRESS PRESENTATION"
    p0.font.name = FONT_NAME
    p0.font.size = Pt(22)
    p0.font.bold = True
    p0.font.color.rgb = GREEN
    p0.space_after = Pt(14)

    p1 = tf.add_paragraph()
    p1.alignment = PP_ALIGN.CENTER
    p1.text = "Design and Development of an AI-Based Electrical Support System\nfor Crop Disease Identification and Mitigation"
    p1.font.name = FONT_NAME
    p1.font.size = Pt(38)
    p1.font.bold = True
    p1.font.color.rgb = NAVY
    p1.space_after = Pt(14)

    p2 = tf.add_paragraph()
    p2.alignment = PP_ALIGN.CENTER
    p2.text = "Software & Firmware Readiness  |  Decided Crops & Open-Source Code  |  Multi-Crop Variations  |  Budget Scaling"
    p2.font.name = FONT_NAME
    p2.font.size = Pt(20)
    p2.font.color.rgb = MUTED

    add_card(
        s1, 1.4, 5.9, 8.2, 3.8,
        "Presented By (B.Tech Final Year EE)",
        [
            "Ayush Agrawal (230105019)",
            "Trisha Singh (230105056)",
            "Vipranshu Sachan (230105061)",
            "Yashraj Dhwaj Singh (230105064)",
        ],
        fill=LIGHT_BG,
    )
    add_card(
        s1, 10.4, 5.9, 8.2, 3.8,
        "Supervision & Institution",
        [
            "Project Guide: Dr. Shailendra Kumar Bhasker (Asst. Prof., EE)",
            "Project In-Charge: Dr. Sanjiv Kumar (Professor, EE)",
            "Department of Electrical Engineering, HBTU Kanpur",
            "UPCST Engineering Student Project Grant (Rs. 20,000/-)",
        ],
        fill=LIGHT_BLUE,
    )

    # 2. Table of Contents
    s2 = add_blank_slide(prs)
    add_header(s2, "Table of Contents", "Second-Turn Progress & Hardware Implementation Roadmap", 2)
    add_card(
        s2, 1.0, 2.0, 8.7, 7.8,
        "Part A — Technical & Software Progress",
        [
            "1. Progress Achieved Since Turn 1 Presentation",
            "2. 4-Stage AIoT & Electrical Support Architecture",
            "3. Decided Crops & Open-Source AI Code Implementation",
            "4. Four Control Variations (Pest, Dryness, NPK, Humidity)",
            "5. Electrical Power Design, Pinouts & 5 Safety Interlocks",
            "6. Ready-to-Connect Software & Firmware Control Plane",
        ],
        fill=LIGHT_GREEN, title_color=GREEN,
    )
    add_card(
        s2, 10.3, 2.0, 8.7, 7.8,
        "Part B — Estimation, Scaling & Action Plan",
        [
            "7. Hardware Components & Cost Estimate (With Price Slots)",
            "8. 3-Tier Budget-Wise Scaling Roadmap (Rs. 11k → 80k+)",
            "9. Literature Survey Benchmarks (IEEE / Elsevier)",
            "10. Course of Action & Branch-Wise Work Split",
            "11. Conclusions & Hardware Integration Readiness",
        ],
        fill=LIGHT_BLUE, title_color=NAVY,
    )

    # 3. Progress Since Turn 1
    s3 = add_blank_slide(prs)
    add_header(s3, "Progress Since First-Turn Presentation", "Transition from Conceptual Proposal to Implementation-Ready System", 3)
    add_table(
        s3, 0.9, 2.0, 18.2, 7.8,
        ["Project Module", "First Turn Status (Oct 2026)", "Second Turn Status (Current — Ready for Hardware)"],
        [
            ["System Architecture", "Conceptual block diagram & problem definition", "Complete 4-stage pipeline, GPIO pinouts & state machine documented"],
            ["AI & Crop Code", "Literature review of CNN & sensor ML papers", "Working MobileNetV2 + Grad-CAM + GradientBoosting code for 6 crops"],
            ["Embedded Firmware", "Proposed Arduino IDE development", "Complete ESP32 (38-pin) & ESP32-CAM .ino sketches ready to flash"],
            ["Control Software", "Planned monitoring dashboard", "Full Next.js Command Center + REST/MQTT APIs + 5 Safety Interlocks"],
            ["Electrical Design", "Component list only", "12V BMS -> LM2596 Buck -> IRLZ44N MOSFET + Flyback + INA219 metrics"],
            ["Budget & Scaling", "Initial Rs. 20,000 table", "Verified Rs. 11,098 Core BOM + 3-Tier Scaling & Marketplace Estimate"],
        ],
        [3.6, 6.8, 7.8],
        font_pt=16,
    )

    # 4. 4-Stage System Architecture
    s4 = add_blank_slide(prs)
    add_header(s4, "4-Stage Integrated System Architecture", "Combining Continuous IoT Risk Assessment with Triggered Vision & Electrical Control", 4)
    stages = [
        ("STAGE 1: SENSING", ["38-Pin ESP32", "DHT22 (Temp/RH)", "Soil Moisture & NPK", "BH1750 Lux & HC-SR04", "Computes LWI & Risk %"], LIGHT_GREEN, GREEN),
        ("STAGE 2: AI VISION", ["Triggered ESP32-CAM", "Captures when Risk >= 60%", "or Plant < 32 cm", "MobileNetV2 CNN (224x224)", "Grad-CAM Lesion Map"], LIGHT_BLUE, NAVY),
        ("STAGE 3: MITIGATION", ["5 Safety Interlocks", "IRLZ44N MOSFET PWM", "12V Mini Water Pump", "Nozzle Servo + L298N 4WD", "OLED + LED + Buzzer"], LIGHT_AMBER, AMBER),
        ("STAGE 4: EE EVAL", ["INA219 Shunt Sensor", "12V BMS Bus Voltage (V)", "Current (A) & Power (W)", "Actuator Latency (ms)", "Enclosure Temp (°C)"], LIGHT_BG, DARK),
    ]
    for idx, (st_title, st_bullets, fill_c, title_c) in enumerate(stages):
        x = 0.8 + idx * 4.7
        add_card(s4, x, 2.1, 4.3, 5.2, st_title, st_bullets, fill=fill_c, title_color=title_c)
        if idx < 3:
            arr = s4.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(x + 4.35), Inches(4.4), Inches(0.3), Inches(0.5))
            arr.fill.solid()
            arr.fill.fore_color.rgb = NAVY
            arr.line.fill.background()

    add_card(
        s4, 0.8, 7.7, 18.4, 2.3,
        "Why Two-Stage Triggered Operation Matters for Electrical Engineering",
        [
            "Continuous camera streaming & pump idling waste battery; Stage 1 keeps high-draw subsystems asleep until environmental risk or HC-SR04 plant detection triggers Stage 2.",
            "Every automated pump actuation is gated by hardware voltage, tank level, cooldown, AI confidence, and emergency-stop interlocks.",
        ],
        fill=LIGHT_BG,
    )

    # 5. Decided Crops & Open-Source Code
    s5 = add_blank_slide(prs)
    add_header(s5, "Decided Crops & Open-Source Code Implementation", "Real, Hardware-Attachable Python, TypeScript & C++ Code (Not a Toy Simulation)", 5)
    add_card(
        s5, 0.9, 2.0, 8.8, 7.8,
        "Decided Crops & Target Pathologies",
        [
            "Tomato: Late Blight (Phytophthora infestans) & Early Blight (Alternaria solani)",
            "Rice: Leaf Blast (Magnaporthe oryzae) & Bacterial Leaf Blight",
            "Wheat: Yellow / Stripe Rust (Puccinia striiformis)",
            "Potato: Late Blight & Early Blight",
            "Mango & Citrus: Anthracnose & Citrus Canker",
            "Aligned with India's National Pest Surveillance System (NPSS) advisories",
        ],
        fill=LIGHT_GREEN, title_color=GREEN,
    )
    add_card(
        s5, 10.3, 2.0, 8.8, 7.8,
        "Open-Source AI & Software Codebase Ready",
        [
            "Stage 1 Risk ML: Python Scikit-Learn GradientBoosting / XGBoost (99.5% test accuracy on agronomic window)",
            "Stage 2 Vision CNN: TensorFlow/Keras MobileNetV2 & EfficientNetB0 + Grad-CAM XAI heatmap",
            "Embedded C++: esp32_main_controller.ino & esp32_cam_node.ino",
            "Control Plane: Next.js (App Router, TypeScript) with REST APIs & MQTT Worker",
            "Supports live leaf photo upload (224x224 tissue segmentation) + physical ESP32 ingestion",
        ],
        fill=LIGHT_BLUE, title_color=NAVY,
    )

    # 6. 4 Functional Variations
    s6 = add_blank_slide(prs)
    add_header(s6, "Four Functional Variations & Control Scope", "Multi-Purpose Agricultural Support Beyond Basic Disease Detection", 6)
    add_card(
        s6, 0.9, 2.0, 8.8, 3.7,
        "1. Pest & Fungal Disease Control",
        [
            "Monitors temp/humidity/leaf wetness for fungal spore germination.",
            "Triggers ESP32-CAM + CNN to confirm visible spots/blight.",
            "Actuates targeted fungicide mist at 75–85% MOSFET PWM duty.",
        ],
        fill=LIGHT_AMBER, title_color=AMBER,
    )
    add_card(
        s6, 10.3, 2.0, 8.8, 3.7,
        "2. Dryness & Soil Moisture Control",
        [
            "Capacitive Soil Moisture sensor tracks root-zone dryness (< 30%).",
            "Distinguishes drought stress from fungal infection.",
            "Triggers clean water irrigation pulse without wasting pesticide.",
        ],
        fill=LIGHT_BLUE, title_color=NAVY,
    )
    add_card(
        s6, 0.9, 6.1, 8.8, 3.7,
        "3. Fertilizer (NPK) Nutrient Control",
        [
            "RS485 Soil NPK sensor measures Nitrogen, Phosphorus & Potassium.",
            "Recommends foliar potash/nitrogen correction on deficiency.",
            "Blocks excess Urea/Nitrogen if Rice Blast is detected.",
        ],
        fill=LIGHT_GREEN, title_color=GREEN,
    )
    add_card(
        s6, 10.3, 6.1, 8.8, 3.7,
        "4. Humidity & Leaf-Wetness Control",
        [
            "Computes Dew-Point Spread & Leaf Wetness Index (LWI 0–100%).",
            "Alerts farmer when prolonged canopy condensation occurs.",
            "Advises stopping overhead irrigation & pruning dense canopy.",
        ],
        fill=LIGHT_BG, title_color=DARK,
    )

    # 7. Electrical Core
    s7 = add_blank_slide(prs)
    add_header(s7, "Electrical Engineering Design & Power Architecture", "Power Regulation, Inductive Protection & INA219 Instrumentation", 7)
    add_card(
        s7, 0.9, 2.0, 9.0, 7.8,
        "Power Distribution & Circuit Protection",
        [
            "Primary Source: 12V Rechargeable Li-ion/LiFePO4 Pack with BMS + Main Switch + 5A Fuse.",
            "Step-Down Regulation: LM2596 DC-DC Buck Converter (12V -> 5.0V, 3A) for ESP32, Servos & HC-SR04.",
            "Inductive Load Drive: IRLZ44N Logic-Level MOSFET switches 12V Pump with 1N4007 Flyback Diode.",
            "4WD Mobility Drive: L298N Dual H-Bridge + 4 Optical Wheel Encoders.",
            "Logic Protection: 1k/2k Voltage Divider on HC-SR04 Echo (5V -> 3.3V) + 470uF cap on ESP32-CAM.",
        ],
        fill=LIGHT_BLUE, title_color=NAVY,
    )
    add_card(
        s7, 10.4, 2.0, 8.7, 7.8,
        "Electrical Performance Metrics (INA219)",
        [
            "Idle Monitoring Profile: ~3.6 W (ESP32 + sensors active)",
            "ESP32-CAM Wi-Fi TX Burst: ~5.4 W (brief capture window)",
            "4WD Rover Mobility: ~8.5 – 14.0 W (terrain dependent)",
            "12V Pump Actuation: ~6.0 – 10.5 W peak",
            "Metrics Logged: Bus Voltage (V), Load Current (A), Energy (Wh), Actuator Response Time (ms), Temp (°C).",
        ],
        fill=LIGHT_GREEN, title_color=GREEN,
    )

    # 8. GPIO Pinout Table
    s8 = add_blank_slide(prs)
    add_header(s8, "38-Pin ESP32 & ESP32-CAM Hardware Pinout", "Conflict-Free GPIO Allocation (ADC1 Only for Wi-Fi Compatibility)", 8)
    add_table(
        s8, 0.9, 1.9, 18.2, 8.1,
        ["ESP32 GPIO", "Connected Peripheral", "Interface / Protocol", "Engineering Note"],
        [
            ["GPIO 21 / 22", "BH1750, SSD1306 OLED, INA219", "Shared I2C Bus", "Addresses 0x23, 0x3C, 0x40 with 4.7k pull-ups"],
            ["GPIO 4", "DHT22 Temp & Humidity", "1-Wire Digital", "10k pull-up resistor to 3.3V"],
            ["GPIO 34 / 36", "Soil Moisture & IR Line Sensor", "ADC1 Analog / Digital", "ADC1 pins remain active while Wi-Fi is ON"],
            ["GPIO 16 / 17 / 5", "RS485 Soil NPK Sensor (MAX485)", "UART2 Modbus RTU", "GPIO 5 controls DE/RE TX/RX direction"],
            ["GPIO 18 / 39", "HC-SR04 Ultrasonic Sensor", "Trig Out / Echo In", "5V Echo stepped down to 3.3V via divider"],
            ["GPIO 25", "12V Mini Water Pump (IRLZ44N)", "LEDC PWM Output", "220 ohm gate resistor + 10k pull-down"],
            ["GPIO 26 / 27", "Spray Nozzle & Cam Pan Servos", "50 Hz Servo PWM", "Powered from 5V Buck rail (not ESP32 3.3V)"],
            ["GPIO 14,13,32,33,23,19,15", "L298N 4WD Motors + Encoders", "H-Bridge + Interrupt", "Bi-directional PWM drive & RPM feedback"],
        ],
        [3.4, 4.8, 3.6, 6.4],
        font_pt=15,
    )

    # 9. Mitigation Logic & 5 Interlocks
    s9 = add_blank_slide(prs)
    add_header(s9, "Stage 3 Mitigation Logic & 5 Safety Interlocks", "Preventing False Spraying, Dry-Running & Battery Deep Discharge", 9)
    add_card(
        s9, 0.9, 2.0, 9.5, 7.8,
        "5 Mandatory Hardware & AI Safety Interlocks",
        [
            "1. AI Confidence Gate: Prediction confidence >= 75% (blocks uncertain sprays).",
            "2. Battery Voltage Gate: 12V BMS bus >= 10.8V (protects battery & prevents brownout).",
            "3. Tank Level Gate: Reservoir >= 10% (prevents dry-running 12V mini pump).",
            "4. Cooldown Gate: >= 30s between sprays (prevents chemical over-application).",
            "5. Mode & E-Stop Gate: Must be in AUTO mode (respects Manual Override & E-Stop).",
        ],
        fill=LIGHT_AMBER, title_color=AMBER,
    )
    add_card(
        s9, 10.9, 2.0, 8.2, 7.8,
        "Hardware Response & Local Alarms",
        [
            "All 5 Pass -> IRLZ44N MOSFET drives 12V Pump at crop-specific PWM (75–85% for 3.5–4.5s).",
            "Any Interlock Fails -> Pump stays OFF; Red/Amber LED + Buzzer + OLED alert operator.",
            "Healthy Leaf Detected -> Green LED steady, rover resumes patrol.",
            "Obstacle < 15 cm -> Rover immediately halts L298N motors locally.",
        ],
        fill=LIGHT_BG, title_color=NAVY,
    )

    # 10. Software Platform Ready
    s10 = add_blank_slide(prs)
    add_header(s10, "Software Platform Ready for Hardware Attachment", "Plug-and-Play HTTP REST + MQTT Ingestion with Built-In Virtual Twin", 10)
    add_card(
        s10, 0.9, 2.0, 9.0, 7.8,
        "5-Tab Command Center Dashboard (Next.js)",
        [
            "Tab 1 — Live Command Center: Real-time Temp, RH, Soil, Lux, LWI, NPK & Risk Score charts.",
            "Tab 2 — AI Vision & ESP32-CAM: Specimen bench + Real leaf photo upload + Grad-CAM overlay.",
            "Tab 3 — Mitigation & 4WD Rover: Pump PWM, 5 Interlocks, D-Pad, Encoders & OLED mirror.",
            "Tab 4 — Electrical Analytics: INA219 Voltage/Current/Power, Buck rails & Thermal.",
            "Tab 5 — Hardware & Docs Hub: Live HTTP cURL tester, GPIO table & BOM.",
        ],
        fill=LIGHT_BLUE, title_color=NAVY,
    )
    add_card(
        s10, 10.4, 2.0, 8.7, 7.8,
        "Zero-Code-Change Hardware Attachment",
        [
            "ESP32 Main Controller posts telemetry to POST /api/telemetry every 3s.",
            "Server evaluates Stage 1 Risk & returns piggybacked commands (cameraTrigger, pumpActivate, roverAction) in the same HTTP response.",
            "ESP32-CAM uploads JPEG to POST /api/ai/analyze-image.",
            "Optional MQTT Worker (npm run mqtt:worker) bridges agroguard/# topics.",
        ],
        fill=LIGHT_GREEN, title_color=GREEN,
    )

    # 11. Hardware BOM Part 1
    s11 = add_blank_slide(prs)
    add_header(s11, "Hardware Cost Estimate (Part 1: Control, Sensing & Vision)", "Insert Amazon / Flipkart Component Screenshots on Left/Right During Final Print", 11)
    add_table(
        s11, 0.9, 1.9, 18.2, 8.1,
        ["S.No", "Component", "Qty", "Unit (Rs.)", "Total (Rs.)", "Marketplace / Role"],
        [
            ["1", "ESP32 (38-Pin) Development Board", "1", "450", "450", "Main MCU (Amazon / Robu)"],
            ["2", "ESP32-CAM + OV2640 Camera Module", "1", "675", "675", "Leaf Image Capture"],
            ["3", "DHT22 Temp & Humidity Sensor", "1", "175", "175", "Ambient Micro-Climate"],
            ["4", "Secondary Temp & Humidity Probe", "1", "200", "200", "Canopy Redundancy"],
            ["5", "Capacitive Soil Moisture Sensor", "1", "200", "200", "Root-Zone Dryness"],
            ["6", "BH1750 Light Intensity Sensor", "1", "150", "150", "I2C Lux Measurement"],
            ["7", "HC-SR04 Ultrasonic Sensor", "1", "139", "139", "Obstacle & Plant Trigger"],
            ["8", "IR Row-Path Sensor", "1", "149", "149", "Crop Row Tracking"],
            ["9", "0.96\" OLED Display + SD Card", "1", "300", "300", "Local Readout & Backup"],
        ],
        [1.1, 6.2, 1.1, 1.8, 1.8, 6.2],
        font_pt=15,
    )

    # 12. Hardware BOM Part 2
    s12 = add_blank_slide(prs)
    add_header(s12, "Hardware Cost Estimate (Part 2: Mobility, Power & Mitigation)", "Core BOM Subtotal = Rs. 11,098/- (Well Within Rs. 20,000/- UPCST Grant)", 12)
    add_table(
        s12, 0.9, 1.9, 18.2, 8.1,
        ["S.No", "Component", "Qty", "Unit (Rs.)", "Total (Rs.)", "Marketplace / Role"],
        [
            ["10", "4WD Metal Chassis + Geared Motors + Wheels", "1", "2,500", "2,500", "Mobile Field Rover Base"],
            ["11", "Motor Drive Module (L298N)", "1", "500", "500", "4WD Motor Control"],
            ["12", "Wheel Encoders (4-Wheel Set)", "1", "580", "580", "RPM & Odometry"],
            ["13", "Servo Motors (SG90 / MG995)", "5", "200", "1,000", "Cam Gimbal + Spray Nozzle"],
            ["14", "12V Rechargeable Battery Pack with BMS", "1", "1,350", "1,350", "Main Power Supply"],
            ["15", "DC-DC Buck Converter (LM2596)", "1", "500", "500", "5V / 3.3V Regulation"],
            ["16", "INA219 Voltage & Current Sensor", "1", "250", "250", "Power & Efficiency Testing"],
            ["17–21", "12V Pump, MOSFET, Tank/Nozzle, Fuse, Wires/LED/Buzzer", "Set", "—", "1,850", "Mitigation & Protection"],
            ["TOTAL", "Core 21-Item BOM (Remaining Rs. 8,902 for NPK Sensor, Charger & Enclosure)", "—", "—", "Rs. 11,098", "Target Grant: Rs. 20,000/-"],
        ],
        [1.1, 6.8, 1.1, 1.6, 2.0, 5.6],
        font_pt=15,
    )

    # 13. Budget-Wise Scaling
    s13 = add_blank_slide(prs)
    add_header(s13, "Budget-Wise Scaling Roadmap (3 Deployment Tiers)", "Demonstrating Practical Scope from Lab Prototype to Commercial Farm", 13)
    add_table(
        s13, 0.9, 2.0, 18.2, 7.6,
        ["Deployment Tier", "Budget", "Hardware Configuration", "Achievable Scope & Capability"],
        [
            ["Tier 1: Lab Bench Prototype\n(Current Core BOM)", "~Rs. 11,100", "ESP32, ESP32-CAM, DHT22, Soil, BH1750, HC-SR04, 4WD Rover, 12V Pump, MOSFET, INA219", "Indoor potted & plot trials, CNN + Grad-CAM validation, electrical power & latency profiling"],
            ["Tier 2: UPCST Grant Field Unit\n(Sanctioned Target)", "Rs. 20,000", "Tier 1 + RS485 Soil NPK Sensor, Smart BMS Charger, IP65 Enclosure, Field Consumables", "Multi-crop HBTU plot trials (Tomato, Rice, Wheat) with full NPK + micro-climate + vision fusion"],
            ["Tier 3: Commercial Farm Scale\n(Future Expansion)", "Rs. 45,000 – 80,000+", "Solar MPPT Panel, LoRa / ESP-NOW (2 km), BLDC Rover Motors, Multi-Nozzle Boom, Edge TPU", "Autonomous multi-acre farm patrol, zero-grid solar autonomy, fleet cloud analytics"],
        ],
        [3.8, 2.6, 5.9, 5.9],
        font_pt=16,
    )

    # 14. Literature Survey Benchmarks
    s14 = add_blank_slide(prs)
    add_header(s14, "Literature Survey Benchmarks & Research Gap", "15 Peer-Reviewed IEEE / Elsevier / MDPI Studies Supporting Our Integrated Design", 14)
    add_table(
        s14, 0.9, 1.9, 18.2, 8.1,
        ["Reference", "Crop / Focus", "Model / Technology", "Reported Accuracy & Relevance"],
        [
            ["Patle et al. (2022) IEEE Sensors", "Mango (Mildew, Anthracnose)", "IoT Sensors + LSTM", "96.0% — Validates leaf wetness & temporal risk"],
            ["Akhter & Sofi (2024) IEEE DASA", "Rice Diseases", "IoT + XGBoost", "92.5% — Early sensor decision support"],
            ["Maurya et al. (2025) IEEE Access", "Tomato Leaf (10 classes)", "RAI-Net + Grad-CAM", "97.88% — Explainable lesion heatmaps"],
            ["Nigar et al. (2024) IEEE Access", "38 Plant Diseases (87k imgs)", "EfficientNetB0 + LIME", "99.69% — Highlights need for IoT sensor fusion"],
            ["Babu et al. (2024) Sensors", "Tomato (South India)", "Soil NPK + Bayesian-KNN", "95.0% — Validates Soil N, P, K integration"],
            ["Abdelli et al. (2025) IEEE Access", "Wheat Plot Telemetry", "ESP32 + ESP-NOW / LoRa", ">95% PDR up to 2 km (<3% battery drain)"],
        ],
        [4.5, 3.8, 4.2, 5.7],
        font_pt=15,
    )

    # 15. Course of Action & Work Split
    s15 = add_blank_slide(prs)
    add_header(s15, "Course of Action & Branch-Wise Responsibility Split", "Clear Hardware Execution Plan Backed by Open-Source Software", 15)
    add_card(
        s15, 0.9, 2.0, 9.0, 7.8,
        "4-Phase Execution Course of Action",
        [
            "Phase 1 (Completed): Literature Survey, UPCST Proposal & System Architecture.",
            "Phase 2 (Completed): Full-Stack Software, AI Engine & ESP32 Firmware Ready.",
            "Phase 3 (Next): Component Procurement (Amazon/Flipkart/Local), Chassis & PCB Assembly.",
            "Phase 4 (Final): Integrated Lab & Field Trials (AI Accuracy, INA219 Power, Mitigation).",
        ],
        fill=LIGHT_GREEN, title_color=GREEN,
    )
    add_card(
        s15, 10.4, 2.0, 8.7, 7.8,
        "EE Core vs. Open-Source Software Split",
        [
            "Electrical Engineering Core (Our Team): 12V BMS power bus, LM2596 buck regulation, IRLZ44N MOSFET + flyback circuit, L298N motor drive, INA219 power/latency evaluation & safety interlocks.",
            "Software & AI Layer: Built using open-source TensorFlow/PlantVillage, Next.js & peer CS/IT guidance so hardware attaches immediately with zero delay.",
        ],
        fill=LIGHT_BLUE, title_color=NAVY,
    )

    # 16. Conclusion
    s16 = add_blank_slide(prs)
    add_header(s16, "Conclusions & Next Hardware Integration Steps", "Ready to Transition from Software Validation to Physical Prototype Assembly", 16)
    add_card(
        s16, 1.2, 2.2, 17.6, 7.2,
        "Key Takeaways",
        [
            "1. Integrated 4-Stage Pipeline: Combines IoT environmental risk prediction with triggered ESP32-CAM CNN + Grad-CAM diagnosis.",
            "2. Multi-Variation Versatility: Supports Pest/Disease control, Soil Dryness irrigation, NPK fertilizer advisory, and Humidity/LWI alerts.",
            "3. Electrical Safety First: Enforces 5 mandatory hardware/AI interlocks and logs real-time power efficiency via INA219.",
            "4. Implementation-Ready Software: Dashboard, APIs, Python AI pipeline, and ESP32 firmware are already tested and ready.",
            "5. Cost-Effective & Scalable: Core BOM at Rs. 11,098 within the Rs. 20,000 UPCST grant, with clear Tier 3 solar/LoRa scaling.",
        ],
        fill=LIGHT_BG, title_color=NAVY,
    )

    prs.save(str(out_path))
    print(f"Saved Second-Turn Presentation to: {out_path}")


if __name__ == "__main__":
    out = Path(__file__).resolve().parent / "02-Second-Turn-Progress-Presentation.pptx"
    build_presentation(out)
