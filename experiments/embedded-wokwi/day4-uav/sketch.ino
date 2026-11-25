#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <ESP32Servo.h>
#include <Wire.h>
#include <time.h>
#include "mqtt_config.h"

// DAY 4: Firmware prototype. LED brightness represents ESC PWM demand,
// NOT the physical motor thrust/actual flight control.
// Device mode is TEST-ONLY; future Backend will authorize Mission commands.

constexpr int PIN_POT = 34; // ADC1: works while Wi-Fi is enabled
constexpr int PIN_SDA = 21;
constexpr int PIN_SCL = 22;
constexpr int PIN_SERVO = 18;
constexpr int PIN_BUZZER = 23;
constexpr int PIN_ALARM_LED = 5;
constexpr int PIN_ONLINE_LED = 19;
const int MOTOR_PINS[4] = {25, 26, 27, 14};

constexpr int LOW_BATTERY_THRESHOLD = 30;
constexpr unsigned long TELEMETRY_INTERVAL_MS = 1000;
constexpr unsigned long RETRY_INTERVAL_MS = 5000;

WiFiClientSecure transport;
PubSubClient mqtt(transport);
Adafruit_MPU6050 imuSensor;
Servo cargoServo;

bool imuReady = false;
bool motorEnabled = false;
bool cargoLocked = true;
const char *localMode = "IDLE";
int motorPwm[4] = {0, 0, 0, 0};
unsigned long telemetrySeq = 0;
unsigned long lastTelemetryMs = 0;
unsigned long lastMqttRetryMs = 0;
unsigned long lastAlarmMs = 0;
unsigned long lastWifiRetryMs = 0;
String commandTopic;
String ackTopic;
String telemetryTopic;
String lastCommandId;
String lastAckJson;

int readBatteryPct() {
  int raw = analogRead(PIN_POT);
  // Wokwi potentiometer is a SIMULATED battery % input (not voltage).
  return constrain((raw * 100L + 2047) / 4095, 0, 100);
}

void setMotorDemand(bool enabled) {
  motorEnabled = enabled;
  for (int i = 0; i < 4; i++) {
    motorPwm[i] = motorEnabled ? 145 : 0;
    analogWrite(MOTOR_PINS[i], motorPwm[i]);
  }
  Serial.printf("MOTOR PWM: %d,%d,%d,%d (LED proxy)\n",
                motorPwm[0], motorPwm[1], motorPwm[2], motorPwm[3]);
}

void setCargoLock(bool locked) {
  cargoLocked = locked;
  cargoServo.write(locked ? 0 : 90);
  Serial.println(locked ? "CARGO LOCKED" : "CARGO UNLOCKED");
}

// Publish ACK/NACK for commands using a distinct MQTT topic.
void sendAck(const String &commandId, bool ok, const char *reason) {
  JsonDocument doc;
  doc["schemaVersion"] = 1;
  doc["deviceId"] = "uav-01";
  doc["commandId"] = commandId;
  doc["status"] = ok ? "ACK" : "NACK";
  doc["reason"] = reason;
  doc["cargoLock"] = cargoLocked ? "LOCKED" : "UNLOCKED";
  doc["deviceMode"] = localMode;

  char buffer[384];
  size_t n = serializeJson(doc, buffer, sizeof(buffer));
  if (!n || n >= sizeof(buffer)) return;

  lastCommandId = commandId;
  lastAckJson = buffer;
  bool published = mqtt.publish(ackTopic.c_str(), buffer);
  Serial.printf("COMMAND %s: %s -> ACK published=%s\n", commandId.c_str(),
                ok ? "ACK" : "NACK", published ? "YES" : "NO");
}

void onMqttMessage(char *topic, byte *payload, unsigned int length) {
  if (String(topic) != commandTopic) return;

  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, payload, length);
  if (error) {
    Serial.printf("INVALID COMMAND JSON: %s\n", error.c_str());
    return; // no trustworthy commandId to acknowledge
  }

  const String commandId = String(doc["commandId"] | "");
  const String deviceId = String(doc["deviceId"] | "");
  const String type = String(doc["type"] | "");
  const String value = String(doc["value"] | "");
  int version = doc["schemaVersion"] | 0;

  if (commandId.length() == 0 || commandId.length() > 100) {
    Serial.println("REJECT: invalid commandId");
    return;
  }
  if (commandId == lastCommandId) {
    mqtt.publish(ackTopic.c_str(), lastAckJson.c_str());
    Serial.println("DUPLICATE COMMAND: repeated previous ACK, no actuation");
    return;
  }
  if (version != 1 || deviceId != "uav-01" || type != "SET_CARGO_LOCK") {
    sendAck(commandId, false, "INVALID_COMMAND");
    return;
  }
  if (value == "LOCK") {
    setCargoLock(true);
    sendAck(commandId, true, "LOCKED");
  } else if (value == "UNLOCK") {
    if (strcmp(localMode, "WAITING_FOR_HANDOVER") != 0) {
      sendAck(commandId, false, "NOT_AT_DELIVERY_POINT");
      return;
    }
    setCargoLock(false);
    sendAck(commandId, true, "UNLOCKED");
  } else {
    sendAck(commandId, false, "INVALID_VALUE");
  }
}

void readAndPublishTelemetry() {
  if (!mqtt.connected()) return;

  sensors_event_t a, g, temp;
  float ax = 0, ay = 0, az = 9.81;
  if (imuReady) {
    imuSensor.getEvent(&a, &g, &temp);
    ax = a.acceleration.x;
    ay = a.acceleration.y;
    az = a.acceleration.z;
  }

  // Strictly match Day-1 contracts/device-telemetry.schema.json.
  JsonDocument doc;
  doc["schemaVersion"] = 1;
  doc["source"] = "WOKWI_ESP32";
  doc["deviceId"] = "uav-01";
  doc["seq"] = ++telemetrySeq;
  doc["uptimeMs"] = millis();
  doc["batterySimPct"] = readBatteryPct();
  JsonObject imu = doc["imu"].to<JsonObject>();
  imu["ax"] = ax;
  imu["ay"] = ay;
  imu["az"] = az;
  JsonArray motors = doc["motorPwm"].to<JsonArray>();
  for (int value : motorPwm) motors.add(value);
  doc["cargoLock"] = cargoLocked ? "LOCKED" : "UNLOCKED";

  char buffer[512];
  size_t n = serializeJson(doc, buffer, sizeof(buffer));
  if (!n || n >= sizeof(buffer)) {
    Serial.println("TELEMETRY OVERFLOW");
    return;
  }
  bool ok = mqtt.publish(telemetryTopic.c_str(), buffer);
  Serial.printf("TELEMETRY seq=%lu battery=%d%% imu=(%.2f,%.2f,%.2f) lock=%s %s\n",
                telemetrySeq, readBatteryPct(), ax, ay, az,
                cargoLocked ? "LOCKED" : "UNLOCKED", ok ? "OK" : "FAILED");
}

void handleSerial() {
  if (!Serial.available()) return;
  String cmd = Serial.readStringUntil('\n');
  cmd.trim();
  cmd.toUpperCase();

  if (cmd == "START") {
    if (readBatteryPct() <= LOW_BATTERY_THRESHOLD) {
      Serial.println("START REJECTED: simulated battery <= 30%");
      return;
    }
    setCargoLock(true);
    localMode = "EN_ROUTE";
    setMotorDemand(true);
    Serial.println("LOCAL DEMO: EN_ROUTE");
  } else if (cmd == "ARRIVED") {
    localMode = "WAITING_FOR_HANDOVER";
    setMotorDemand(false);
    Serial.println("LOCAL DEMO: WAITING_FOR_HANDOVER");
  } else if (cmd == "HOME") {
    localMode = "IDLE";
    setMotorDemand(false);
    setCargoLock(true);
    Serial.println("LOCAL DEMO: IDLE");
  } else if (cmd == "LOCK") {
    setCargoLock(true);
  } else if (cmd == "UNLOCK") {
    if (strcmp(localMode, "WAITING_FOR_HANDOVER") == 0) setCargoLock(false);
    else Serial.println("UNLOCK REJECTED: not at destination");
  } else if (cmd == "STATUS") {
    Serial.printf("MODE=%s battery=%d%% lock=%s mqtt=%s\n", localMode,
                  readBatteryPct(), cargoLocked ? "LOCKED" : "UNLOCKED",
                  mqtt.connected() ? "CONNECTED" : "OFFLINE");
  } else if (cmd.length()) {
    Serial.println("Commands: START, ARRIVED, HOME, LOCK, UNLOCK, STATUS");
  }
}

void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin("Wokwi-GUEST", "", 6);
  Serial.print("Connecting WiFi");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 30000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WIFI CONNECTED ip=");
    Serial.println(WiFi.localIP());
  } else Serial.println("WIFI FAILED; Wokwi Gateway might be unavailable");
}

void syncClock() {
  configTime(0, 0, "pool.ntp.org", "time.google.com");
  unsigned long start = millis();
  while (time(nullptr) < 1700000000 && millis() - start < 30000) delay(500);
  Serial.println(time(nullptr) >= 1700000000 ? "NTP SYNCED" : "NTP FAILED");
}

void connectMqtt() {
  if (mqtt.connected() || WiFi.status() != WL_CONNECTED) return;
  if (time(nullptr) < 1700000000) {
    Serial.println("MQTT NOT STARTED: NTP not synced");
    return;
  }
  Serial.print("Connecting MQTT/TLS broker=");
  Serial.println(MQTT_HOST);
  // Retain Day-1 working handshake approach: establish TLS using hostname.
  transport.stop();
  if (!transport.connect(MQTT_HOST, MQTT_PORT)) {
    Serial.println("TLS HANDSHAKE FAILED");
    return;
  }

  String clientId = "wokwi-day4-uav01-" + String((uint32_t)ESP.getEfuseMac(), HEX);
  if (!mqtt.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD)) {
    Serial.printf("MQTT REJECTED state=%d\n", mqtt.state());
    transport.stop();
    return;
  }

  if (!mqtt.subscribe(commandTopic.c_str(), 0)) {
    Serial.println("COMMAND SUBSCRIBE FAILED");
  } else {
    Serial.println("MQTT CONNECTED; COMMAND SUBSCRIBED");
  }
}

void updateAlarm() {
  bool low = readBatteryPct() <= LOW_BATTERY_THRESHOLD;
  digitalWrite(PIN_ALARM_LED, low ? HIGH : LOW);
  digitalWrite(PIN_ONLINE_LED, mqtt.connected() ? HIGH : LOW);
  if (low && millis() - lastAlarmMs >= 4000) {
    lastAlarmMs = millis();
    tone(PIN_BUZZER, 1000, 180);
    Serial.println("LOW BATTERY ALERT (DEMO)");
  }
}

void setup() {
  Serial.begin(115200);
  Serial.setTimeout(50);
  delay(700);
  Serial.println("=== UAV DAY 4 / ESP32 EMBEDDED PROTOTYPE ===");

  analogReadResolution(12);
  pinMode(PIN_POT, INPUT);
  pinMode(PIN_ALARM_LED, OUTPUT);
  pinMode(PIN_ONLINE_LED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  for (int pin : MOTOR_PINS) pinMode(pin, OUTPUT);
  setMotorDemand(false);

  cargoServo.setPeriodHertz(50);
  cargoServo.attach(PIN_SERVO, 500, 2400);
  setCargoLock(true);

  Wire.begin(PIN_SDA, PIN_SCL);
  imuReady = imuSensor.begin();
  Serial.println(imuReady ? "MPU6050 READY" : "MPU6050 NOT DETECTED");
  if (imuReady) {
    imuSensor.setAccelerometerRange(MPU6050_RANGE_2_G);
    imuSensor.setGyroRange(MPU6050_RANGE_250_DEG);
    imuSensor.setFilterBandwidth(MPU6050_BAND_21_HZ);
  }

  const String prefix = String("uav-delivery/") + MQTT_NAMESPACE + "/dev/uav-01/";
  telemetryTopic = prefix + "telemetry";
  commandTopic = prefix + "command";
  ackTopic = prefix + "ack";

  connectWifi();
  if (WiFi.status() == WL_CONNECTED) syncClock();
  transport.setCACert(MQTT_ROOT_CA);
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setBufferSize(768);
  mqtt.setKeepAlive(60);
  mqtt.setSocketTimeout(15);
  mqtt.setCallback(onMqttMessage);
  connectMqtt();
  Serial.println("Serial commands: START / ARRIVED / HOME / LOCK / UNLOCK / STATUS");
}

void loop() {
  handleSerial();
  updateAlarm();
  if (WiFi.status() != WL_CONNECTED) {
    if (millis() - lastWifiRetryMs >= 10000) {
      lastWifiRetryMs = millis();
      connectWifi();
      if (WiFi.status() == WL_CONNECTED) syncClock();
    }
    delay(20);
    return;
  }

  if (!mqtt.connected() && millis() - lastMqttRetryMs >= RETRY_INTERVAL_MS) {
    lastMqttRetryMs = millis();
    connectMqtt();
  }
  if (mqtt.connected()) {
    mqtt.loop();
    if (millis() - lastTelemetryMs >= TELEMETRY_INTERVAL_MS) {
      lastTelemetryMs = millis();
      readAndPublishTelemetry();
    }
  }
  delay(10);
}
