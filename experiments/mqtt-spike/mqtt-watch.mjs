import { getConfig, openClient } from './mqtt-client.mjs';

const cfg = getConfig();
const topic = `uav-delivery/${cfg.namespace}/dev/uav-01/telemetry`;
const client = openClient(cfg, 'watch');
client.on('connect', () => {
  console.log(`CONNECTED mqtts://${cfg.host}:${cfg.port}`);
  client.subscribe(topic, {qos: 0}, err => {
    if (err) console.error('SUBSCRIBE FAILED:', err.message);
    else console.log('LISTENING:', topic, '— chạy Wokwi để xem telemetry thật');
  });
});
client.on('message', (t, message) => console.log('RECEIVED', t, message.toString()));
client.on('error', err => console.error('MQTT ERROR:', err.message));
process.on('SIGINT', () => client.end());
