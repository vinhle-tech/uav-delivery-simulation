// Socket.IO smoke test lab. Mặc định không ghi DB.
// node tests/socket-smoke.js
// node tests/socket-smoke.js --emit-test  (TẠO một dòng telemetry trong DB)
const { io } = require('socket.io-client');
const assert = require('node:assert/strict');
const BASE = process.env.UAV_API_URL || 'http://127.0.0.1:3000';
const emitTest = process.argv.includes('--emit-test');
let done = false;
const socket = io(BASE, { reconnection: false, timeout: 4000 });
function finish(code, message) {
  if (done) return;
  done = true;
  clearTimeout(timer);
  if (message) console.log(message);
  socket.disconnect();
  process.exitCode = code;
}
const timer = setTimeout(() => finish(1, 'FAIL: Timeout nhận sự kiện Socket.IO'), 9000);
socket.on('connect_error', err => finish(1, 'FAIL: ' + err.message));
socket.on('drone:telemetry', data => {
  if (!emitTest) return;
  try {
    assert.equal(data.drone_id, 'uav-01');
    assert.equal(data.demoOnly, true);
    finish(0, 'PASS: drone:telemetry -> ' + data.drone_id + ' demoOnly=true');
  } catch (error) { finish(1, 'FAIL: ' + error.message); }
});
socket.on('server:hello', async data => {
  try {
    assert.equal(data.demoOnly, true);
    console.log('PASS: server:hello', data.message);
    if (!emitTest) return finish(0, 'TC-RT-01 PASS');
    const res = await fetch(BASE + '/api/demo/telemetry', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({droneId:'uav-01',batteryPct:84.5,x:25,y:0,z:30,simTimeSec:9}),
      signal: AbortSignal.timeout(4000),
    });
    assert.equal(res.status, 201, 'POST telemetry cần 201');
    console.log('POST telemetry 201 — đang kiểm tra sự kiện nhận được');
  } catch (e) { finish(1, 'FAIL: ' + e.message); }
});
