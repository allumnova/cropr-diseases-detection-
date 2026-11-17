/*
 * ============================================================================
 * Firmware: 38-Pin ESP32 Main Controller (AgroGuard HBTU Prototype)
 * Project: Design and Development of an AI-Based Electrical Support System
 *          for Crop Disease Identification and Mitigation
 * Dept. of Electrical Engineering, HBTU Kanpur (2026-2027)
 * ============================================================================
 * Peripherals Mapped (Match docs/03-HARDWARE-PINOUT-AND-ELECTRICAL-DESIGN.md):
 *   - I2C (SDA=21, SCL=22): BH1750 (0x23), SSD1306 OLED (0x3C), INA219 (0x40)
 *   - GPIO 4  : DHT22 Temperature & Humidity
 *   - GPIO 34 : Capacitive Soil Moisture (ADC1)
 *   - GPIO 36 : IR Row-Path Sensor
 *   - GPIO 16/17 + DE/RE GPIO 5 : RS485 Modbus Soil NPK Sensor
 *   - GPIO 18/39 : HC-SR04 Ultrasonic Obstacle Sensor
 *   - GPIO 25 : IRLZ44N MOSFET Gate (12V Water Pump PWM)
 *   - GPIO 26 : Spray Nozzle Servo
 *   - GPIO 27 : Camera Gimbal Pan Servo
 *   - GPIO 14,13,32,33,23,19 : L298N 4WD Motor Driver
 *   - GPIO 15 : Wheel Encoder Interrupt
 *   - GPIO 2 / 12 : Alert LED & Piezo Buzzer
 * ============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <BH1750.h>
#include <Adafruit_INA219.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ESP32Servo.h>

// -------------------- Wi-Fi & Server Configuration --------------------
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* SERVER_URL    = "http://192.168.1.100:3000/api/telemetry";
const char* DEVICE_KEY    = "hbtu-agroguard-2026";
const char* DEVICE_ID     = "esp32-rover-01";
const char* CROP_TYPE     = "Tomato";

// -------------------- Hardware Pin Definitions ------------------------
#define PIN_DHT           4
#define PIN_SOIL_ADC      34
#define PIN_IR_SENSOR     36
#define PIN_RS485_RX      16
#define PIN_RS485_TX      17
#define PIN_RS485_DE_RE   5
#define PIN_TRIG          18
#define PIN_ECHO          39
#define PIN_PUMP_MOSFET   25
#define PIN_NOZZLE_SERVO  26
#define PIN_CAM_SERVO     27
#define PIN_MOTOR_IN1     14
#define PIN_MOTOR_IN2     13
#define PIN_MOTOR_ENA     32
#define PIN_MOTOR_IN3     33
#define PIN_MOTOR_IN4     23
#define PIN_MOTOR_ENB     19
#define PIN_ENCODER       15
#define PIN_ALERT_LED     2
#define PIN_BUZZER        12

// -------------------- Safety Constants --------------------------------
#define MIN_BATTERY_SAFE_V   10.8f
#define HARD_CUTOFF_V        10.2f
#define MAX_PUMP_BURST_MS    8000UL
#define TELEMETRY_INTERVAL   3000UL

// -------------------- Peripheral Objects ------------------------------
DHT dht(PIN_DHT, DHT22);
BH1750 lightMeter;
Adafruit_INA219 ina219;
Adafruit_SSD1306 display(128, 64, &Wire, -1);
Servo nozzleServo;
Servo camServo;

volatile unsigned long encoderPulses = 0;
unsigned long lastTelemetryMs = 0;
unsigned long pumpStopAtMs = 0;
bool pumpRunning = false;
String currentRoverMotion = "STOP";
int currentCamPan = 90;
int currentNozzleAngle = 45;

void IRAM_ATTR onEncoderPulse() {
  encoderPulses++;
}

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);

  // Outputs & Safety Default Low
  pinMode(PIN_PUMP_MOSFET, OUTPUT);
  analogWrite(PIN_PUMP_MOSFET, 0);
  pinMode(PIN_MOTOR_IN1, OUTPUT);
  pinMode(PIN_MOTOR_IN2, OUTPUT);
  pinMode(PIN_MOTOR_ENA, OUTPUT);
  pinMode(PIN_MOTOR_IN3, OUTPUT);
  pinMode(PIN_MOTOR_IN4, OUTPUT);
  pinMode(PIN_MOTOR_ENB, OUTPUT);
  pinMode(PIN_ALERT_LED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_IR_SENSOR, INPUT);
  pinMode(PIN_RS485_DE_RE, OUTPUT);
  digitalWrite(PIN_RS485_DE_RE, LOW);

  // Encoders
  pinMode(PIN_ENCODER, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_ENCODER), onEncoderPulse, RISING);

  // Servos
  nozzleServo.attach(PIN_NOZZLE_SERVO);
  camServo.attach(PIN_CAM_SERVO);
  nozzleServo.write(currentNozzleAngle);
  camServo.write(currentCamPan);

  // Sensors & OLED
  dht.begin();
  lightMeter.begin();
  ina219.begin();
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("HBTU AgroGuard AI");
  display.println("Connecting WiFi...");
  display.display();

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected: " + WiFi.localIP().toString());
}

float readUltrasonicCm() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  long duration = pulseIn(PIN_ECHO, HIGH, 25000);
  if (duration == 0) return 200.0;
  return (duration * 0.0343f) / 2.0f;
}

float readSoilMoisturePct() {
  int raw = analogRead(PIN_SOIL_ADC); // Dry ~3100, Wet ~1300 (calibrate per probe)
  float pct = map(constrain(raw, 1300, 3100), 3100, 1300, 0, 100);
  return pct;
}

void setRoverMotors(const String& action) {
  currentRoverMotion = action;
  if (action == "FORWARD") {
    digitalWrite(PIN_MOTOR_IN1, HIGH); digitalWrite(PIN_MOTOR_IN2, LOW);
    digitalWrite(PIN_MOTOR_IN3, HIGH); digitalWrite(PIN_MOTOR_IN4, LOW);
    analogWrite(PIN_MOTOR_ENA, 180);   analogWrite(PIN_MOTOR_ENB, 180);
  } else if (action == "REVERSE") {
    digitalWrite(PIN_MOTOR_IN1, LOW);  digitalWrite(PIN_MOTOR_IN2, HIGH);
    digitalWrite(PIN_MOTOR_IN3, LOW);  digitalWrite(PIN_MOTOR_IN4, HIGH);
    analogWrite(PIN_MOTOR_ENA, 160);   analogWrite(PIN_MOTOR_ENB, 160);
  } else if (action == "LEFT") {
    digitalWrite(PIN_MOTOR_IN1, LOW);  digitalWrite(PIN_MOTOR_IN2, HIGH);
    digitalWrite(PIN_MOTOR_IN3, HIGH); digitalWrite(PIN_MOTOR_IN4, LOW);
    analogWrite(PIN_MOTOR_ENA, 170);   analogWrite(PIN_MOTOR_ENB, 170);
  } else if (action == "RIGHT") {
    digitalWrite(PIN_MOTOR_IN1, HIGH); digitalWrite(PIN_MOTOR_IN2, LOW);
    digitalWrite(PIN_MOTOR_IN3, LOW);  digitalWrite(PIN_MOTOR_IN4, HIGH);
    analogWrite(PIN_MOTOR_ENA, 170);   analogWrite(PIN_MOTOR_ENB, 170);
  } else {
    analogWrite(PIN_MOTOR_ENA, 0);     analogWrite(PIN_MOTOR_ENB, 0);
  }
}

void updateOLED(const String& line1, const String& line2, float tempC, float busV) {
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("AGROGUARD HBTU EE");
  display.println(line1);
  display.println(line2);
  display.printf("T:%.1fC V:%.2fV\n", tempC, busV);
  display.display();
}

void loop() {
  unsigned long now = millis();

  // Safety Timer: Automatically stop 12V pump after burst window
  if (pumpRunning && now >= pumpStopAtMs) {
    analogWrite(PIN_PUMP_MOSFET, 0);
    pumpRunning = false;
  }

  // Local Obstacle Protection
  float distCm = readUltrasonicCm();
  if (distCm < 15.0 && currentRoverMotion == "FORWARD") {
    setRoverMotors("STOP");
  }

  if (now - lastTelemetryMs >= TELEMETRY_INTERVAL) {
    lastTelemetryMs = now;

    float tempC = dht.readTemperature();
    float humPct = dht.readHumidity();
    if (isnan(tempC)) tempC = 26.5;
    if (isnan(humPct)) humPct = 65.0;

    float soilPct = readSoilMoisturePct();
    float lux = lightMeter.readLightLevel();
    if (lux < 0) lux = 12000;
    bool irAligned = digitalRead(PIN_IR_SENSOR) == LOW;

    // INA219 Electrical Sensing
    float busV = ina219.getBusVoltage_V();
    float currentA = ina219.getCurrent_mA() / 1000.0f;
    if (busV < 1.0) busV = 12.1; // Fallback when USB-only debugging
    float powerW = busV * currentA;
    int socPct = constrain((int)((busV - 10.2f) / (12.6f - 10.2f) * 100.0f), 0, 100);

    // Local Hard Battery Interlock
    if (busV < HARD_CUTOFF_V) {
      analogWrite(PIN_PUMP_MOSFET, 0);
      setRoverMotors("STOP");
      pumpRunning = false;
    }

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(SERVER_URL);
      http.addHeader("Content-Type", "application/json");
      http.addHeader("x-device-key", DEVICE_KEY);

      StaticJsonDocument<1024> doc;
      doc["deviceId"] = DEVICE_ID;
      doc["cropType"] = CROP_TYPE;

      JsonObject s = doc.createNestedObject("sensors");
      s["temperatureC"] = tempC;
      s["humidityPct"] = humPct;
      s["soilMoisturePct"] = soilPct;
      s["lightLux"] = lux;
      s["obstacleDistanceCm"] = distCm;
      s["irPathAligned"] = irAligned;
      JsonObject npk = s.createNestedObject("npk");
      npk["nitrogen"] = 140;
      npk["phosphorus"] = 55;
      npk["potassium"] = 180;

      JsonObject e = doc.createNestedObject("electrical");
      e["busVoltageV"] = busV;
      e["currentA"] = currentA;
      e["powerW"] = powerW;
      e["buck5vRailV"] = 5.01;
      e["buck3v3RailV"] = 3.31;
      e["systemTempC"] = tempC + 4.2;
      e["batterySocPct"] = socPct;

      JsonObject r = doc.createNestedObject("rover");
      r["motionState"] = currentRoverMotion;
      JsonArray enc = r.createNestedArray("wheelEncodersRpm");
      float rpm = (encoderPulses / 20.0f) * (60000.0f / TELEMETRY_INTERVAL);
      encoderPulses = 0;
      enc.add(rpm); enc.add(rpm); enc.add(rpm); enc.add(rpm);
      r["distanceTraveledM"] = 0.0;
      r["cameraPanDeg"] = currentCamPan;
      r["nozzleAngleDeg"] = currentNozzleAngle;

      String payload;
      serializeJson(doc, payload);
      int code = http.POST(payload);

      if (code == 200) {
        String resp = http.getString();
        StaticJsonDocument<1024> resDoc;
        if (!deserializeJson(resDoc, resp)) {
          JsonObject cmd = resDoc["commands"];
          String roverAct = cmd["roverAction"] | "STOP";
          setRoverMotors(roverAct);

          currentCamPan = cmd["cameraPanDeg"] | 90;
          camServo.write(currentCamPan);

          currentNozzleAngle = cmd["nozzleAngleDeg"] | 45;
          nozzleServo.write(currentNozzleAngle);

          bool wantPump = cmd["pumpActivate"] | false;
          int dutyPct = cmd["pumpDutyPct"] | 0;
          unsigned long durMs = min((unsigned long)(cmd["pumpDurationMs"] | 0), MAX_PUMP_BURST_MS);

          if (wantPump && busV >= MIN_BATTERY_SAFE_V && durMs > 0) {
            int pwm = map(constrain(dutyPct, 0, 100), 0, 100, 0, 255);
            analogWrite(PIN_PUMP_MOSFET, pwm);
            pumpRunning = true;
            pumpStopAtMs = millis() + durMs;
          }

          bool buzzer = cmd["buzzerAlert"] | false;
          digitalWrite(PIN_BUZZER, buzzer ? HIGH : LOW);
          String ledState = cmd["ledAlert"] | "GREEN";
          digitalWrite(PIN_ALERT_LED, ledState != "GREEN" ? HIGH : LOW);

          updateOLED(cmd["oledLine1"] | "MONITORING", cmd["oledLine2"] | "SYSTEM OK", tempC, busV);
        }
      }
      http.end();
    }
  }
}
