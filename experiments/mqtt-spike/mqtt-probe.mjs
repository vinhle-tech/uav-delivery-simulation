import { randomUUID } from 'node:crypto';
import { getConfig, openClient } from './mqtt-client.mjs';

const cfg = getConfig();
const client = openClient(cfg, 'probe');
const id = randomUUID().slice(0, 8);
const topic = `uav-delivery/${cfg.namespace}/probe/${id}`;
const data = JSON.stringify({ schemaVersion: 1, probe: id, sentAt: new Date().toISOString() });
let finished = false;
const timer = setTimeout(() => finish(false, 'Timeout: không nhận được bản tin MQTT trong 18s'), 18000);

function finish(ok, message) {
  if (finished) return;
  finished = true;
  clearTimeout(timer);
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${message}`);
  client.end(true, () => process.exit(ok ? 0 : 1));
}
client.on('error', err => finish(false, `MQTT ${err.message}`));
client.on('connect', () => {
  console.log(`CONNECTED: mqtts://${cfg.host}:${cfg.port}`);
  client.subscribe(topic, {qos: 1}, err => {
    if (err) return finish(false, `Subscribe: ${err.message}`);
    client.publish(topic, data, {qos: 1}, err2 => {
      if (err2) finish(false, `Publish: ${err2.message}`);
    });
  });
});
client.on('message', (receivedTopic, payload) => {
  if (receivedTopic !== topic) return;
  try {
    const received = JSON.parse(payload.toString());
    finish(received.probe === id, received.probe === id ? 'Node.js publish/subscribe qua MQTT/TLS thành công' : 'Sai probe id');
  } catch (e) { finish(false, `JSON: ${e.message}`); }
});
