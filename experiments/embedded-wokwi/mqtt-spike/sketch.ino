#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <time.h>
#include "mqtt_config.h"

WiFiClientSecure transport;
PubSubClient mqtt(transport);
unsigned long lastPublishMs = 0;
unsigned long lastRetryMs = 0;
unsigned long seq = 0;
String topic;

void setup() {
  Serial.begin(115200);
  WiFi.begin("Wokwi-GUEST", "", 6);
  Serial.print("Connecting Wokwi WiFi");
  unsigned long started = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - started < 15000) {
    delay(250);
    Serial.print(".");
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) Serial.println("WiFi connected");
  else Serial.println("WiFi unavailable - check Wokwi network");
  // Đồng bộ thời gian để xác minh hiệu lực chứng chỉ TLS.
  configTime(0, 0, "pool.ntp.org", "time.google.com");
  struct tm now;
  if (!getLocalTime(&now, 12000)) {
    Serial.println("WARNING: NTP time not ready; TLS CA verification may fail");
  }
  transport.setCACert(MQTT_ROOT_CA);
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setBufferSize(512);
  topic = String("uav-delivery/") + MQTT_NAMESPACE + "/dev/uav-01/telemetry";
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (!mqtt.connected()) {
    if (millis() - lastRetryMs < 5000) return;
    lastRetryMs = millis();
    String clientId = String("wokwi-uav01-") + String((uint32_t)ESP.getEfuseMac(), HEX);
    if (mqtt.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD)) {
      Serial.println("MQTT connected over TLS");
    } else {
      Serial.printf("MQTT connect failed, state=%d\n", mqtt.state());
    }
    return;
  }
  mqtt.loop();
  if (millis() - lastPublishMs >= 1000) {
    lastPublishMs = millis();
    seq++;
    char payload[320];
    snprintf(payload, sizeof(payload),
      "{\"schemaVersion\":1,\"source\":\"WOKWI_ESP32\",\"deviceId\":\"uav-01\","
      "\"seq\":%lu,\"uptimeMs\":%lu,\"batterySimPct\":78,"
      "\"imu\":{\"ax\":0.0,\"ay\":0.0,\"az\":9.81},"
      "\"motorPwm\":[0,0,0,0],\"cargoLock\":\"LOCKED\"}",
      seq, millis());
    bool sent = mqtt.publish(topic.c_str(), payload);
    Serial.printf("publish seq=%lu %s\n", seq, sent ? "OK" : "FAIL");
  }
}
