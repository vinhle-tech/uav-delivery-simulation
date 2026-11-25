// Run from experiments/mqtt-spike: node day4-command.mjs UNLOCK
// Uses the Day-1 mqtt-client.mjs and .env; no new dependencies.
import { randomUUID } from 'node:crypto';
import { getConfig, openClient } from './mqtt-client.mjs';

const action = (process.argv[2] || '').toUpperCase();
if (!['LOCK', 'UNLOCK'].includes(action)) {
  console.error('Usage: node day4-command.mjs LOCK|UNLOCK');
  process.exit(2);
}

const cfg = getConfig();
const prefix = `uav-delivery/${cfg.namespace}/dev/uav-01`;
const commandTopic = `${prefix}/command`;
const ackTopic = `${prefix}/ack`;
const commandId = `day4-${randomUUID()}`;
const client = openClient(cfg, 'day4-cmd');
let settled = false;
const timeout = setTimeout(() => finish(1, 'TIMEOUT: no ACK/NACK after 15 seconds'), 15000);

function finish(code, message) {
  if (settled) return;
  settled = true;
  clearTimeout(timeout);
  if (message) console.log(message);
  client.end(true, {}, () => process.exit(code));
  setTimeout(() => process.exit(code), 500).unref();
}

client.on('connect', () => {
  console.log('CONNECTED to broker');
  client.subscribe(ackTopic, { qos: 0 }, (err, granted) => {
    if (err || !granted?.length || granted[0].qos === 128) {
      finish(1, `SUBSCRIBE FAILED: ${err?.message || 'not authorized'}`);
      return;
    }
    const command = {
      schemaVersion: 1,
      commandId,
      deviceId: 'uav-01',
      type: 'SET_CARGO_LOCK',
      value: action,
    };
    client.publish(commandTopic, JSON.stringify(command), { qos: 0, retain: false }, err2 => {
      if (err2) finish(1, `PUBLISH FAILED: ${err2.message}`);
      else console.log(`COMMAND SENT: ${action} (${commandId})`);
    });
  });
});

client.on('message', (topic, payload) => {
  if (topic !== ackTopic) return;
  let message;
  try { message = JSON.parse(payload.toString()); }
  catch { return; }
  if (message.commandId !== commandId) return;
  console.log('RESPONSE:', JSON.stringify(message, null, 2));
  finish(message.status === 'ACK' ? 0 : 1, message.status === 'ACK' ? 'PASS: device acknowledged command' : 'NACK: command was rejected');
});
client.on('error', err => finish(1, `MQTT ERROR: ${err.message}`));
process.on('SIGINT', () => finish(130, 'Cancelled'));
