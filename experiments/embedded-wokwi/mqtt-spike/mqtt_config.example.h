#pragma once
// ĐỔI TÊN FILE THÀNH mqtt_config.h và điền thông tin Broker.
// Không đẩy mqtt_config.h lên GitHub hoặc chia sẻ Wokwi project public khi có mật khẩu.
#define MQTT_HOST "YOUR_SERVERLESS_HOST.example.com"
#define MQTT_PORT 8883
#define MQTT_USERNAME "YOUR_MQTT_USERNAME"
#define MQTT_PASSWORD "YOUR_MQTT_PASSWORD"
#define MQTT_NAMESPACE "uav-solo-lab"
// Tải root CA certificate đúng của broker từ EMQX Cloud Overview.
// Không dùng setInsecure() vì như vậy bỏ qua kiểm tra chứng chỉ.
static const char MQTT_ROOT_CA[] = R"CA(
-----BEGIN CERTIFICATE-----
PASTE_REAL_CA_CERTIFICATE_HERE
-----END CERTIFICATE-----
)CA";
