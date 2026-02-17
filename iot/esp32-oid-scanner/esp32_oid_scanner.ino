/*
 * BrainSAIT ESP32 OID QR Code Scanner
 * 
 * This firmware enables ESP32 devices to:
 * - Scan QR codes containing OID information
 * - Validate OIDs against the BrainSAIT registry
 * - Report scan results to the cloud
 * - Support asset management workflows
 * 
 * Hardware Requirements:
 * - ESP32 DevKit
 * - Camera module (ESP32-CAM or compatible)
 * - Optional: LCD display for status
 * 
 * Libraries Required:
 * - WiFi.h (built-in)
 * - HTTPClient.h (built-in)
 * - ArduinoJson.h
 * - ESP32QRCodeReader.h
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi Configuration
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// BrainSAIT API Configuration
const char* API_BASE_URL = "http://your-server.com";
const char* OID_SERVICE_URL = "http://your-server.com:3001";
const char* HEALTHCARE_API_URL = "http://your-server.com:3003";

// Device Configuration
const char* DEVICE_OID = "1.3.6.1.4.1.61026.4.3.1.DEVICE_ID"; // Assigned OID for this scanner
const char* DEVICE_NAME = "ESP32-Scanner-01";
const char* LOCATION = "Riyadh Operations Center";

// Pins (adjust based on your hardware)
#define LED_PIN 2
#define BUZZER_PIN 4

// Scanner state
bool wifiConnected = false;
unsigned long lastScanTime = 0;
const unsigned long SCAN_COOLDOWN = 2000; // 2 seconds between scans

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("BrainSAIT ESP32 OID Scanner");
  Serial.println("Version 1.0.0");
  Serial.println("=============================");
  
  // Initialize pins
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Connect to WiFi
  connectWiFi();
  
  // Register device with cloud
  registerDevice();
  
  // Initialize QR code reader
  initQRReader();
  
  Serial.println("Scanner ready!");
  blinkLED(3, 200);
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    wifiConnected = false;
    Serial.println("WiFi disconnected. Reconnecting...");
    connectWiFi();
    return;
  }
  
  // Scan for QR codes
  String qrData = scanQRCode();
  
  if (qrData.length() > 0 && (millis() - lastScanTime > SCAN_COOLDOWN)) {
    lastScanTime = millis();
    Serial.println("QR Code detected:");
    Serial.println(qrData);
    
    // Parse and validate OID
    processQRCode(qrData);
  }
  
  delay(100);
}

void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\nWiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    blinkLED(2, 100);
  } else {
    Serial.println("\nWiFi connection failed!");
    blinkLED(5, 50);
  }
}

void registerDevice() {
  if (!wifiConnected) return;
  
  Serial.println("Registering device with cloud...");
  
  HTTPClient http;
  String url = String(OID_SERVICE_URL) + "/api/oid/register-asset";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<512> doc;
  doc["assetName"] = DEVICE_NAME;
  doc["assetType"] = "scanner";
  doc["location"] = LOCATION;
  doc["manufacturer"] = "Espressif";
  doc["model"] = "ESP32-DevKit";
  doc["serialNumber"] = getDeviceSerialNumber();
  
  String requestBody;
  serializeJson(doc, requestBody);
  
  int httpResponseCode = http.POST(requestBody);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Device registration response:");
    Serial.println(response);
    
    // Parse response to get assigned OID
    StaticJsonDocument<1024> responseDoc;
    deserializeJson(responseDoc, response);
    
    if (responseDoc["success"]) {
      const char* assignedOid = responseDoc["oid"];
      Serial.print("Device OID assigned: ");
      Serial.println(assignedOid);
      blinkLED(3, 100);
    }
  } else {
    Serial.print("Device registration failed. Error: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}

void initQRReader() {
  // Initialize camera and QR reader
  // This is hardware-specific and would need actual camera library
  Serial.println("QR reader initialized");
}

String scanQRCode() {
  // Simulated QR scanning - replace with actual camera QR reader code
  // For real implementation, use ESP32QRCodeReader library
  
  // This would return empty string normally, but for demo:
  // return "";
  
  // In production, this would interface with camera module
  return "";
}

void processQRCode(String qrData) {
  Serial.println("Processing QR code...");
  
  // Parse QR data (expected JSON format)
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, qrData);
  
  if (error) {
    Serial.print("JSON parsing failed: ");
    Serial.println(error.c_str());
    signalError();
    return;
  }
  
  const char* oid = doc["oid"];
  const char* assetName = doc["asset"];
  const char* assetType = doc["type"];
  
  if (!oid) {
    Serial.println("No OID found in QR code");
    signalError();
    return;
  }
  
  Serial.print("OID: ");
  Serial.println(oid);
  Serial.print("Asset: ");
  Serial.println(assetName);
  
  // Validate OID
  bool isValid = validateOID(oid);
  
  // Report scan to cloud
  reportScan(oid, assetName, assetType, isValid);
  
  if (isValid) {
    signalSuccess();
  } else {
    signalError();
  }
}

bool validateOID(const char* oid) {
  if (!wifiConnected) {
    Serial.println("Cannot validate - no WiFi connection");
    return false;
  }
  
  Serial.println("Validating OID with cloud...");
  
  HTTPClient http;
  String url = String(OID_SERVICE_URL) + "/api/oid/validate";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<256> doc;
  doc["oid"] = oid;
  
  String requestBody;
  serializeJson(doc, requestBody);
  
  int httpResponseCode = http.POST(requestBody);
  bool isValid = false;
  
  if (httpResponseCode == 200) {
    String response = http.getString();
    Serial.println("Validation response:");
    Serial.println(response);
    
    StaticJsonDocument<512> responseDoc;
    deserializeJson(responseDoc, response);
    
    if (responseDoc["success"]) {
      isValid = responseDoc["validation"]["isValidFormat"] && 
                responseDoc["validation"]["existsInRegistry"];
    }
  } else {
    Serial.print("Validation request failed. Error: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
  return isValid;
}

void reportScan(const char* oid, const char* assetName, const char* assetType, bool isValid) {
  if (!wifiConnected) return;
  
  Serial.println("Reporting scan to cloud...");
  
  HTTPClient http;
  String url = String(HEALTHCARE_API_URL) + "/api/device-scans/report";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<512> doc;
  doc["oidScanned"] = oid;
  doc["scanResult"] = isValid ? "valid" : "invalid";
  doc["scannerOid"] = DEVICE_OID;
  doc["location"] = LOCATION;
  doc["scannedBy"] = DEVICE_NAME;
  doc["scanMetadata"]["assetName"] = assetName;
  doc["scanMetadata"]["assetType"] = assetType;
  doc["scanMetadata"]["timestamp"] = millis();
  
  String requestBody;
  serializeJson(doc, requestBody);
  
  int httpResponseCode = http.POST(requestBody);
  
  if (httpResponseCode > 0) {
    Serial.print("Scan reported successfully. Code: ");
    Serial.println(httpResponseCode);
  } else {
    Serial.print("Scan report failed. Error: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}

String getDeviceSerialNumber() {
  // Get ESP32 MAC address as serial number
  uint8_t mac[6];
  WiFi.macAddress(mac);
  char serialNumber[18];
  sprintf(serialNumber, "%02X:%02X:%02X:%02X:%02X:%02X", 
          mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  return String(serialNumber);
}

void blinkLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(delayMs);
    digitalWrite(LED_PIN, LOW);
    delay(delayMs);
  }
}

void signalSuccess() {
  // Green LED pattern (or single LED rapid blink)
  blinkLED(2, 100);
  
  // Short beep
  tone(BUZZER_PIN, 1000, 100);
  delay(150);
  tone(BUZZER_PIN, 1500, 100);
  
  Serial.println("✓ Success!");
}

void signalError() {
  // Red LED pattern (or single LED slow blink)
  blinkLED(5, 200);
  
  // Error beep
  tone(BUZZER_PIN, 500, 300);
  
  Serial.println("✗ Error!");
}
