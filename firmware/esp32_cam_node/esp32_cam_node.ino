/*
 * ============================================================================
 * Firmware: ESP32-CAM (OV2640) Vision Acquisition Node
 * Project: Design and Development of an AI-Based Electrical Support System
 *          for Crop Disease Identification and Mitigation (HBTU Kanpur)
 * ============================================================================
 * Features:
 *   - Initializes OV2640 camera at VGA/QVGA JPEG
 *   - Polls server command flag or listens on local HTTP /capture endpoint
 *   - Backs up JPEG frame to MicroSD card
 *   - Base64-encodes image & POSTs to Next.js /api/ai/analyze-image
 * ============================================================================
 */

#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <WebServer.h>
#include <SD_MMC.h>
#include <mbedtls/base64.h>

const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* ANALYZE_URL   = "http://192.168.1.100:3000/api/ai/analyze-image";
const char* DEVICE_KEY    = "hbtu-agroguard-2026";
const char* DEVICE_ID     = "esp32-cam-01";

// AI-Thinker ESP32-CAM Pin Map
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22
#define FLASH_LED_PIN      4

WebServer server(80);
bool sdAvailable = false;

bool initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_QVGA; // 320x240 fast upload for MobileNetV2 224x224
  config.jpeg_quality = 12;
  config.fb_count = 1;

  return esp_camera_init(&config) == ESP_OK;
}

void captureAndUpload(const String& cropType, const String& reason) {
  digitalWrite(FLASH_LED_PIN, HIGH);
  delay(120);
  camera_fb_t* fb = esp_camera_fb_get();
  digitalWrite(FLASH_LED_PIN, LOW);

  if (!fb) {
    Serial.println("Camera capture failed");
    return;
  }

  // Backup to SD Card
  if (sdAvailable) {
    String path = "/leaf_" + String(millis()) + ".jpg";
    File file = SD_MMC.open(path.c_str(), FILE_WRITE);
    if (file) {
      file.write(fb->buf, fb->len);
      file.close();
    }
  }

  // Base64 Encode
  size_t outLen = 0;
  mbedtls_base64_encode(NULL, 0, &outLen, fb->buf, fb->len);
  unsigned char* b64 = (unsigned char*)malloc(outLen + 1);
  if (b64) {
    mbedtls_base64_encode(b64, outLen + 1, &outLen, fb->buf, fb->len);
    b64[outLen] = '\0';

    HTTPClient http;
    http.begin(ANALYZE_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-device-key", DEVICE_KEY);

    String payload = "{\"deviceId\":\"" + String(DEVICE_ID) +
                     "\",\"cropType\":\"" + cropType +
                     "\",\"triggerReason\":\"" + reason +
                     "\",\"imageBase64\":\"data:image/jpeg;base64," + String((char*)b64) + "\"}";

    int code = http.POST(payload);
    Serial.printf("AI Server response: %d\n", code);
    http.end();
    free(b64);
  }

  esp_camera_fb_return(fb);
}

void setup() {
  Serial.begin(115200);
  pinMode(FLASH_LED_PIN, OUTPUT);
  digitalWrite(FLASH_LED_PIN, LOW);

  if (!initCamera()) {
    Serial.println("OV2640 Init Failed!");
  }
  sdAvailable = SD_MMC.begin("/sdcard", true);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
  }

  server.on("/capture", HTTP_GET, []() {
    String crop = server.hasArg("crop") ? server.arg("crop") : "Tomato";
    captureAndUpload(crop, "MANUAL_UI");
    server.send(200, "application/json", "{\"ok\":true,\"captured\":true}");
  });

  server.begin();
  Serial.println("ESP32-CAM Ready at: " + WiFi.localIP().toString());
}

void loop() {
  server.handleClient();
}
