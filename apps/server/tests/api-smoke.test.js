// Ngày 9 — kiểm thử đọc / negative API không thay đổi database.
// Chạy từ experiments/database-api: node --test tests/api-smoke.test.js
// Node.js >= 18, khuyến nghị >= 20. API phải bật trước.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const BASE = process.env.UAV_API_URL || 'http://127.0.0.1:3000';

async function request(method, path, body) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(5000),
  });
  let data;
  try { data = await response.json(); }
  catch (e) { throw new Error(`Response ${method} ${path} không phải JSON, status=${response.status}`); }
  return { status: response.status, data };
}

// Tất cả POST dưới đây cố ý gửi dữ liệu lỗi — không tạo Order/Mission/Telemetry.
test('TC-API-01 /health trả 200 và DB connected', async () => {
  const r = await request('GET', '/health');
  assert.equal(r.status, 200);
  assert.equal(r.data.ok, true);
  assert.equal(r.data.database, true);
});

test('TC-API-02 /api/drones là mảng có các trường cần thiết', async () => {
  const r = await request('GET', '/api/drones');
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.data));
  assert.ok(r.data.length >= 1, 'Cần có drone trong DB; chạy seed.sql');
  for (const key of ['id', 'status', 'battery_pct', 'max_payload_kg', 'cruise_speed_mps']) {
    assert.ok(Object.hasOwn(r.data[0], key), `Thiếu trường ${key}`);
  }
});

test('TC-API-03 /api/orders là mảng', async () => {
  const r = await request('GET', '/api/orders');
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.data));
});

test('TC-API-04 weightKg âm -> 400 INVALID_INPUT', async () => {
  const r = await request('POST', '/api/orders', { deliveryPointId: 'point-a', weightKg: -1 });
  assert.equal(r.status, 400); assert.equal(r.data.error.code, 'INVALID_INPUT');
});

test('TC-API-05 điểm giao không tồn tại -> 404', async () => {
  const r = await request('POST', '/api/orders', { deliveryPointId: 'point-not-exists', weightKg: 0.8 });
  assert.equal(r.status, 404); assert.equal(r.data.error.code, 'POINT_NOT_FOUND');
});

test('TC-API-06 thiếu thông tin Mission -> 400', async () => {
  const r = await request('POST', '/api/missions', {});
  assert.equal(r.status, 400); assert.equal(r.data.error.code, 'INVALID_INPUT');
});

test('TC-API-07 Order không tồn tại -> 404', async () => {
  const r = await request('POST', '/api/missions', { orderId: 'ord-not-exists', droneId: 'uav-01' });
  assert.equal(r.status, 404); assert.equal(r.data.error.code, 'ORDER_NOT_FOUND');
});

test('TC-API-08 Mission không tồn tại -> 404', async () => {
  const r = await request('GET', '/api/missions/mis-not-exists');
  assert.equal(r.status, 404); assert.equal(r.data.error.code, 'MISSION_NOT_FOUND');
});

test('TC-API-09 expectedVersion âm -> 400', async () => {
  const r = await request('POST', '/api/missions/mis-not-exists/start', { expectedVersion: -1 });
  assert.equal(r.status, 400); assert.equal(r.data.error.code, 'INVALID_VERSION');
});

test('Kiểm tra unknown action -> 404', async () => {
  const r = await request('POST', '/api/missions/mis-not-exists/warp', { expectedVersion: 0 });
  assert.equal(r.status, 404); assert.equal(r.data.error.code, 'UNKNOWN_ACTION');
});

test('Kiểm tra telemetry pin > 100 -> 400', async () => {
  const r = await request('POST', '/api/demo/telemetry', { droneId: 'uav-01', batteryPct: 110, simTimeSec: 1, x: 0, y: 0, z: 0 });
  assert.equal(r.status, 400); assert.equal(r.data.error.code, 'INVALID_TELEMETRY');
});

test('Kiểm tra mission GET list', async () => {
  const r = await request('GET', '/api/missions');
  assert.equal(r.status, 200); assert.ok(Array.isArray(r.data));
});
