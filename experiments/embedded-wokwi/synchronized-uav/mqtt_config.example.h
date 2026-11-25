#pragma once
// Sao chep thanh mqtt_config.h, dung broker MQTT da PASS o Ngay 1.
// KHONG commit / share cong khai file mqtt_config.h co mat khau.
#define MQTT_HOST "YOUR_SERVERLESS_HOST.example.com"
#define MQTT_PORT 8883
#define MQTT_USERNAME "YOUR_MQTT_USERNAME"
#define MQTT_PASSWORD "YOUR_MQTT_PASSWORD"
#define MQTT_NAMESPACE "uav-solo-lab"

// PEM root CA dung voi broker EMQX cua ban.
static const char MQTT_ROOT_CA[] = R"CA(
-----BEGIN CERTIFICATE-----
PASTE_REAL_CA_CERTIFICATE_HERE
-----END CERTIFICATE-----
)CA";
