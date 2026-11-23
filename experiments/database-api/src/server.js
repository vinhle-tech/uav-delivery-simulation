// Educational demonstration only. NO authentication; bind to localhost; do not deploy.
require('dotenv').config();
const express = require('express');
const http = require('node:http');
const { randomUUID } = require('node:crypto');
const { Server } = require('socket.io');
const { pool } = require('./db');

const app = express();
app.use(express.json({ limit: '100kb' }));
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: 'http://localhost:5173' } });
const PORT = Number(process.env.PORT || 3000);

const fail = (res, status, code, message) => res.status(status).json({ error: { code, message } });
const catchAsync = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.get('/health', catchAsync(async (req, res) => {
  const db = await pool.query('SELECT 1 AS ok');
  res.json({ ok: true, database: db.rows[0].ok === 1 });
}));

app.get('/api/drones', catchAsync(async (req, res) => {
  const result = await pool.query(`
    SELECT d.id, d.status, d.battery_pct, dm.max_payload_kg, dm.cruise_speed_mps
    FROM drones d JOIN drone_models dm ON dm.id = d.model_id ORDER BY d.id`);
  res.json(result.rows);
}));

app.get('/api/orders', catchAsync(async (req, res) => {
  const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100');
  res.json(result.rows);
}));

app.post('/api/orders', catchAsync(async (req, res) => {
  const { deliveryPointId, weightKg } = req.body || {};
  if (typeof deliveryPointId !== 'string' || typeof weightKg !== 'number' || !Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 9999) {
    return fail(res, 400, 'INVALID_INPUT', 'deliveryPointId (string) và weightKg (số > 0) là bắt buộc');
  }
  const point = await pool.query('SELECT 1 FROM delivery_points WHERE id=$1', [deliveryPointId]);
  if (!point.rowCount) return fail(res, 404, 'POINT_NOT_FOUND', 'Không tìm thấy điểm giao');
  const id = `ord-${randomUUID().slice(0, 8)}`;
  const result = await pool.query(
    `INSERT INTO orders (id,delivery_point_id,weight_kg,status) VALUES ($1,$2,$3,'PENDING') RETURNING *`,
    [id, deliveryPointId, weightKg]);
  res.status(201).json(result.rows[0]);
}));

app.get('/api/missions', catchAsync(async (req, res) => {
  const result = await pool.query('SELECT * FROM missions ORDER BY created_at DESC LIMIT 100');
  res.json(result.rows);
}));

app.get('/api/missions/:id', catchAsync(async (req, res) => {
  const result = await pool.query('SELECT * FROM missions WHERE id=$1', [req.params.id]);
  if (!result.rowCount) return fail(res, 404, 'MISSION_NOT_FOUND', 'Không tìm thấy Mission');
  res.json(result.rows[0]);
}));

app.post('/api/missions', catchAsync(async (req, res) => {
  const { orderId, droneId } = req.body || {};
  if (typeof orderId !== 'string' || typeof droneId !== 'string') return fail(res, 400, 'INVALID_INPUT', 'Thiếu orderId hoặc droneId');
  const client = await pool.connect();
  let mission;
  try {
    await client.query('BEGIN');
    // Lock order before drone consistently to reduce the chance of deadlocks.
    const or = await client.query('SELECT * FROM orders WHERE id=$1 FOR UPDATE', [orderId]);
    if (!or.rowCount) { await client.query('ROLLBACK'); return fail(res, 404, 'ORDER_NOT_FOUND', 'Không thấy đơn'); }
    if (or.rows[0].status !== 'PENDING') { await client.query('ROLLBACK'); return fail(res, 409, 'ORDER_BUSY', 'Đơn đã được phân công'); }
    const dr = await client.query(`SELECT d.*, dm.max_payload_kg FROM drones d
      JOIN drone_models dm ON dm.id=d.model_id WHERE d.id=$1 FOR UPDATE OF d`, [droneId]);
    if (!dr.rowCount) { await client.query('ROLLBACK'); return fail(res, 404, 'DRONE_NOT_FOUND', 'Không thấy UAV'); }
    const drone = dr.rows[0], order = or.rows[0];
    if (drone.status !== 'AVAILABLE') { await client.query('ROLLBACK'); return fail(res, 409, 'DRONE_BUSY', 'UAV không sẵn sàng'); }
    if (Number(order.weight_kg) > Number(drone.max_payload_kg)) { await client.query('ROLLBACK'); return fail(res, 422, 'OVERWEIGHT', 'Hàng vượt tải trọng UAV'); }
    // LEARNING ASSUMPTION ONLY: battery >= 55% for the demo route.
    // Not flight feasibility. Real implementation must estimate route energy and safety margin.
    if (Number(drone.battery_pct) < 55) { await client.query('ROLLBACK'); return fail(res, 422, 'INSUFFICIENT_BATTERY', 'Mẫu thử yêu cầu pin >= 55%'); }
    const id = `mis-${randomUUID().slice(0, 8)}`;
    const ins = await client.query(`INSERT INTO missions (id,order_id,drone_id,station_id)
      VALUES ($1,$2,$3,$4) RETURNING *`, [id, orderId, droneId, drone.station_id]);
    await client.query(`UPDATE drones SET status='RESERVED',updated_at=now() WHERE id=$1`, [droneId]);
    await client.query(`UPDATE orders SET status='ASSIGNED' WHERE id=$1`, [orderId]);
    await client.query('COMMIT');
    mission = ins.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') return fail(res, 409, 'ACTIVE_MISSION_EXISTS', 'UAV/đơn có Mission đang hoạt động');
    throw error;
  } finally { client.release(); }
  io.emit('mission:updated', mission);
  res.status(201).json(mission);
}));

const allowed = {
  start: { from: ['READY'], to: 'IN_PROGRESS', droneStatus: 'BUSY' },
  pause: { from: ['IN_PROGRESS'], to: 'PAUSED' },
  resume: { from: ['PAUSED'], to: 'IN_PROGRESS' },
  'return-home': { from: ['IN_PROGRESS','PAUSED'], to: 'RETURNING' },
  complete: { from: ['RETURNING'], to: 'COMPLETED', droneStatus: 'AVAILABLE' }
};

app.post('/api/missions/:id/:action', catchAsync(async (req, res) => {
  const config = allowed[req.params.action];
  if (!config) return fail(res, 404, 'UNKNOWN_ACTION', 'Không có thao tác');
  const expectedVersion = req.body?.expectedVersion;
  if (!Number.isInteger(expectedVersion) || expectedVersion < 0) return fail(res, 400, 'INVALID_VERSION', 'Cần expectedVersion là số nguyên >= 0');
  const client = await pool.connect();
  let result;
  try {
    await client.query('BEGIN');
    const row = await client.query('SELECT * FROM missions WHERE id=$1 FOR UPDATE', [req.params.id]);
    if (!row.rowCount) { await client.query('ROLLBACK'); return fail(res, 404, 'MISSION_NOT_FOUND', 'Không thấy Mission'); }
    const current = row.rows[0];
    if (current.version !== expectedVersion) { await client.query('ROLLBACK'); return fail(res, 409, 'VERSION_CONFLICT', `Version hiện tại: ${current.version}`); }
    if (!config.from.includes(current.status)) { await client.query('ROLLBACK'); return fail(res, 409, 'INVALID_STATE', `Không thể ${req.params.action} khi ${current.status}`); }
    const change = await client.query(`UPDATE missions SET status=$2, version=version+1,
      started_at=CASE WHEN $2='IN_PROGRESS' AND started_at IS NULL THEN now() ELSE started_at END,
      finished_at=CASE WHEN $2='COMPLETED' THEN now() ELSE finished_at END
      WHERE id=$1 RETURNING *`, [current.id, config.to]);
    if (config.droneStatus) await client.query('UPDATE drones SET status=$2,updated_at=now() WHERE id=$1', [current.drone_id, config.droneStatus]);
    await client.query('COMMIT');
    result = change.rows[0];
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
  io.emit('mission:updated', result);
  res.json(result);
}));

// Learning-only telemetry injection, NOT a real sensor or Virtual Flight Controller feed.
app.post('/api/demo/telemetry', catchAsync(async (req, res) => {
  const { droneId, missionId = null, simTimeSec = 0, x = 0, y = 0, z = 0, batteryPct } = req.body || {};
  if (typeof droneId !== 'string' || ![simTimeSec,x,y,z,batteryPct].every(n => typeof n === 'number' && Number.isFinite(n)) || simTimeSec < 0 || batteryPct < 0 || batteryPct > 100) {
    return fail(res, 400, 'INVALID_TELEMETRY', 'Thiếu/sai trường telemetry mẫu');
  }
  const result = await pool.query(`INSERT INTO telemetry(drone_id,mission_id,sim_time_s,x_m,y_m,z_m,battery_pct)
    VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [droneId,missionId,simTimeSec,x,y,z,batteryPct]);
  const sample = { ...result.rows[0], demoOnly: true };
  io.emit('drone:telemetry', sample);
  res.status(201).json(sample);
}));

io.on('connection', socket => {
  console.log('Socket connected:', socket.id);
  socket.emit('server:hello', { message: 'Connected to UAV API demo', demoOnly: true });
});

app.use((err, req, res, next) => {
  console.error('Request failed:', err);
  if (err.code === '23503') return fail(res, 422, 'FOREIGN_KEY_ERROR', 'ID tham chiếu không tồn tại');
  if (err.code === '23505') return fail(res, 409, 'DUPLICATE', 'Dữ liệu trùng');
  if (err.code === '23514') return fail(res, 422, 'CHECK_FAILED', 'Dữ liệu không thỏa ràng buộc');
  return fail(res, 500, 'SERVER_ERROR', 'Lỗi nội bộ');
});

async function start() {
  try {
    await pool.query('SELECT 1');
    server.listen(PORT, '127.0.0.1', () => console.log(`UAV demo API: http://127.0.0.1:${PORT}`));
  } catch (err) {
    console.error('Không kết nối được PostgreSQL:', err.message);
    process.exitCode = 1;
    await pool.end();
  }
}
start();
