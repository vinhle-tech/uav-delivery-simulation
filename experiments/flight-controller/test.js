const assert = require("node:assert/strict");
const { VirtualFlightController, C } = require("./flight-controller");
function until(uav, predicate, maxTicks = 4500) {
  for (let i = 0; i < maxTicks; i++) {
    if (predicate()) return;
    uav.tick();
  }
  throw new Error(`Timeout in test, state=${uav.state}`);
}
function startToEnroute(uav) {
  assert.equal(uav.command("START").ok, true);
  until(uav, () => uav.state === "EN_ROUTE");
}
function test(name, fn) {
  try {
    fn();
    console.log("PASS:", name);
  } catch (err) {
    console.error("FAIL:", name);
    throw err;
  }
}

test("1. Chuyến bay bình thường và Order/Mission độc lập", () => {
  const u = new VirtualFlightController();
  startToEnroute(u);
  until(u, () => u.state === "WAITING_FOR_HANDOVER");
  assert.equal(u.order, "ASSIGNED");
  assert.equal(u.command("CONFIRM_HANDOVER", { success: true }).ok, true);
  assert.equal(u.order, "DELIVERED");
  assert.equal(u.mission, "RETURNING");
  until(u, () => u.state === "COMPLETED");
  assert.equal(u.mission, "COMPLETED");
  assert.equal(u.drone, "AVAILABLE");
});

test("2. Không thể RESUME khi chưa PAUSE", () => {
  const u = new VirtualFlightController();
  assert.equal(u.command("RESUME").ok, false);
});

test("3. Quá tải bị từ chối ở Pre-flight", () => {
  const u = new VirtualFlightController({ payloadKg: 1.8 });
  assert.equal(u.command("START").ok, true);
  u.tick();
  assert.equal(u.state, "FAILED");
  assert.equal(u.position.z, 0);
});

test("4. Không đủ pin bị từ chối trước cất cánh", () => {
  const u = new VirtualFlightController({ battery: 35 });
  assert.equal(u.command("START").ok, true);
  u.tick();
  assert.equal(u.state, "FAILED");
});

test("5. PAUSE giữ vị trí nhưng pin tiếp tục giảm", () => {
  const u = new VirtualFlightController();
  startToEnroute(u);
  until(u, () => u.position.x >= 20);
  assert.equal(u.command("PAUSE").ok, true);
  const x = u.position.x,
    z = u.position.z,
    b = u.battery;
  for (let i = 0; i < 20; i++) u.tick();
  assert.equal(u.position.x, x);
  assert.equal(u.position.z, z);
  assert(u.battery < b);
  assert.equal(u.command("RESUME").ok, true);
  assert.equal(u.state, "EN_ROUTE");
});

test("6. Hết 60s chờ => DELIVERY_FAILED nhưng Mission vẫn RETURNING", () => {
  const u = new VirtualFlightController();
  startToEnroute(u);
  until(u, () => u.state === "WAITING_FOR_HANDOVER");
  until(u, () => u.state === "RETURNING", 1000);
  assert.equal(u.order, "DELIVERY_FAILED");
  until(u, () => u.state === "COMPLETED");
  assert.equal(u.mission, "COMPLETED");
});

test("7. Pin nguy cấp nhưng đủ về trạm => RETURNING", () => {
  const u = new VirtualFlightController();
  startToEnroute(u);
  until(u, () => u.position.x >= 70);
  u.battery = 9;
  u.tick();
  assert.equal(u.state, "RETURNING");
  assert.equal(u.order, "DELIVERY_FAILED");
});

test("8. Không đủ về trạm, đủ đến điểm dự phòng => emergency landing", () => {
  const u = new VirtualFlightController();
  startToEnroute(u);
  until(u, () => u.position.x >= 75);
  u.battery = 2.6;
  u.tick();
  assert.equal(u.state, "EMERGENCY_LANDING");
  until(u, () => u.state === "FAILED");
  assert.equal(u.drone, "MAINTENANCE");
});

test("9. Ngắt Client không ảnh hưởng bộ mô phỏng độc lập", () => {
  const u = new VirtualFlightController();
  startToEnroute(u);
  const oldX = u.position.x;
  for (let i = 0; i < 30; i++) u.tick();
  assert(u.position.x > oldX);
});

console.log("TẤT CẢ TEST ĐÃ HOÀN THÀNH");
