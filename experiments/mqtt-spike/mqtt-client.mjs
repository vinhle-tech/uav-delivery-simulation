import 'dotenv/config';
import mqtt from 'mqtt';
import { randomUUID } from 'node:crypto';

export function getConfig() {
  const env = process.env;
  const host = env.MQTT_HOST?.trim();
  const username = env.MQTT_USERNAME?.trim();
  const password = env.MQTT_PASSWORD?.trim();
  const namespace = env.MQTT_NAMESPACE?.trim() || 'uav-solo-lab';
  const port = Number(env.MQTT_PORT || 8883);
  if (!host || host.includes('YOUR_') || !username || username.includes('YOUR_') || !password || password.includes('YOUR_')) {
    throw new Error('Thiếu cấu hình MQTT_HOST, MQTT_USERNAME hoặc MQTT_PASSWORD trong .env');
  }
  if (!/^[a-z0-9_-]{3,40}$/.test(namespace)) throw new Error('MQTT_NAMESPACE phải gồm a-z, 0-9, _ hoặc -');
  if (!Number.isInteger(port) || port <= 0) throw new Error('MQTT_PORT không hợp lệ');
  return { host, port, username, password, namespace };
}

export function openClient(cfg, prefix) {
  return mqtt.connect(`mqtts://${cfg.host}:${cfg.port}`, {
    clientId: `${prefix}-${randomUUID().slice(0, 8)}`,
    username: cfg.username,
    password: cfg.password,
    reconnectPeriod: 0,
    connectTimeout: 15000,
    rejectUnauthorized: true,
    clean: true,
    protocolVersion: 4
  });
}
