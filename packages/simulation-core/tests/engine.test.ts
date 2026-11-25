import test from "node:test";
import assert from "node:assert/strict";
import { SimulationEngine } from "../src/engine.js";
import { distanceM, moveToward } from "../src/navigation.js";
import { demoMission } from "../src/demo-data.js";
import { estimateMissionEnergyPct } from "../src/battery.js";
import { DEFAULT_PARAMS } from "../src/params.js";
import type { FlightState, MissionConfig } from "../src/types.js";

const make = (patch: Partial<MissionConfig> = {}) =>
  new SimulationEngine({ ...demoMission, ...patch });
function goUntil(
  engine: SimulationEngine,
  state: FlightState,
  limit = 10000,
): void {
  for (let n = 0; n < limit; n++) {
    if (engine.snapshot().flightState === state) return;
    const result = engine.tick(0.5);
    if (result.flightState === "FAILED")
      assert.fail(`Mission FAILED: ${result.lastError}`);
  }
  assert.fail(
    `Timeout while waiting for ${state}, currently ${engine.snapshot().flightState}`,
  );
}

test("TC-01: cấu hình seed giữ đúng tọa độ từ Ngày 1", () => {
  assert.equal(demoMission.home.lon, 105.8542);
  assert.equal(demoMission.waypoints.length, 3);
  assert.equal(demoMission.delivery.lat, 21.0346);
});

test("TC-02: Haversine cho cùng một điểm là 0; khoảng cách hữu hạn", () => {
  assert.equal(distanceM(demoMission.home, demoMission.home), 0);
  const d = distanceM(demoMission.home, demoMission.delivery);
  assert.ok(d > 500 && d < 2000);
});

test("TC-03: moveToward không vượt quá speed * dt và không vượt đích", () => {
  const a = demoMission.home;
  const b = demoMission.delivery;
  const next = moveToward(a, b, 6, 0.1);
  assert.ok(next.movedM <= 0.600001);
  assert.equal(next.arrived, false);
  assert.ok(distanceM(next.position, b) < distanceM(a, b));
  const last = moveToward(a, b, 6, 9999);
  assert.equal(last.arrived, true);
  assert.deepEqual(last.position, b);
});

test("TC-04: tick(0) không di chuyển và không thay pin", () => {
  const e = make();
  e.command("START");
  assert.deepEqual(e.tick(0), e.snapshot());
  assert.equal(e.snapshot().simTimeSec, 0);
});

test("TC-05: dt âm, NaN, Infinity và quá giới hạn bị từ chối", () => {
  const e = make();
  for (const dt of [-1, NaN, Infinity, 3601])
    assert.throws(() => e.tick(dt), RangeError);
});

test("TC-06: không thể RESUME khi chưa PAUSE", () => {
  assert.equal(make().command("RESUME").ok, false);
});

test("TC-07: START bị từ chối khi tải > 1.5kg hoặc khối lượng âm", () => {
  for (const weight of [1.6, -1, 0]) {
    const e = make({ payloadKg: weight });
    assert.equal(e.command("START").ok, false);
    assert.equal(e.snapshot().flightState, "IDLE");
  }
});

test("TC-08: START bị từ chối nếu pin không đủ dự phòng 30%", () => {
  const required =
    estimateMissionEnergyPct(demoMission, DEFAULT_PARAMS) +
    DEFAULT_PARAMS.batteryReservePct;
  const e = make({ batteryPct: required - 0.01 });
  assert.equal(e.command("START").ok, false);
  assert.equal(e.snapshot().orderStatus, "PENDING");
});

test("TC-09: tuyến rỗng, waypoint NaN hoặc vượt bán kính 2km bị từ chối", () => {
  const e1 = make({ waypoints: [] });
  assert.equal(e1.command("START").ok, false);
  const e2 = make({
    waypoints: [{ id: "bad", position: { lon: NaN, lat: 21, altitudeM: 45 } }],
  });
  assert.equal(e2.command("START").ok, false);
  const e3 = make({ delivery: { lon: 106.1, lat: 21.0285, altitudeM: 12 } });
  assert.equal(e3.command("START").ok, false);
});

test("TC-10: UAV OFFLINE không được START", () => {
  assert.equal(make({ droneStatus: "OFFLINE" }).command("START").ok, false);
});

test("TC-11: START -> TAKEOFF -> EN_ROUTE theo mô hình", () => {
  const e = make();
  assert.equal(e.command("START").ok, true);
  assert.equal(e.snapshot().flightState, "PRE_FLIGHT_CHECK");
  assert.equal(e.snapshot().orderStatus, "ASSIGNED");
  goUntil(e, "EN_ROUTE");
  assert.ok(
    Math.abs(e.snapshot().position.altitudeM - DEFAULT_PARAMS.cruiseAltitudeM) <
      1e-6,
  );
  assert.equal(e.snapshot().missionStatus, "IN_PROGRESS");
});

test("TC-12: bay ngang đạt waypoint và giới hạn vận tốc", () => {
  const e = make();
  e.command("START");
  goUntil(e, "EN_ROUTE");
  let sawWaypoint = false;
  for (let i = 0; i < 6000; i++) {
    const s = e.tick(0.1);
    assert.ok(
      s.speedMps <= DEFAULT_PARAMS.speedMps + 0.01,
      `speed ${s.speedMps}`,
    );
    assert.ok(
      Number.isFinite(s.position.lat) && Number.isFinite(s.position.lon),
    );
    if (s.waypointIndex > 0) {
      sawWaypoint = true;
      break;
    }
  }
  assert.equal(sawWaypoint, true);
});

test("TC-13: PAUSE giữ nguyên vị trí nhưng vẫn giảm pin; RESUME không reset", () => {
  const e = make();
  e.command("START");
  goUntil(e, "EN_ROUTE");
  e.tick(6);
  const before = e.snapshot();
  assert.equal(e.command("PAUSE").ok, true);
  const paused = e.tick(3);
  assert.deepEqual(paused.position, before.position);
  assert.equal(paused.speedMps, 0);
  assert.ok(paused.batteryPct < before.batteryPct);
  assert.equal(e.command("RESUME").ok, true);
  assert.deepEqual(e.snapshot().position, before.position);
  assert.equal(e.snapshot().flightState, "EN_ROUTE");
  const next = e.tick(1);
  assert.ok(next.distanceTravelledM > before.distanceTravelledM);
});

test("TC-14: không thể xác nhận bàn giao khi chưa đến nơi", () => {
  const e = make();
  e.command("START");
  assert.equal(e.command("CONFIRM_HANDOVER", { success: true }).ok, false);
});

test("TC-15: tới điểm nhận phải WAITING_FOR_HANDOVER, Order vẫn ASSIGNED", () => {
  const e = make();
  e.command("START");
  goUntil(e, "WAITING_FOR_HANDOVER");
  const s = e.snapshot();
  assert.equal(s.orderStatus, "ASSIGNED");
  assert.equal(s.missionStatus, "IN_PROGRESS");
  assert.ok(
    Math.abs(s.position.altitudeM - demoMission.delivery.altitudeM) < 1e-6,
  );
});

test("TC-16: bàn giao thành công -> RETURNING -> COMPLETED tại trạm", () => {
  const e = make();
  e.command("START");
  goUntil(e, "WAITING_FOR_HANDOVER");
  assert.equal(e.command("CONFIRM_HANDOVER", { success: true }).ok, true);
  assert.equal(e.snapshot().orderStatus, "DELIVERED");
  assert.equal(e.snapshot().missionStatus, "RETURNING");
  assert.equal(e.snapshot().flightState, "RETURNING");
  assert.equal(e.snapshot().cargoOnBoard, false);
  goUntil(e, "COMPLETED");
  const final = e.snapshot();
  assert.equal(final.missionStatus, "COMPLETED");
  assert.equal(final.droneStatus, "AVAILABLE");
  assert.equal(final.orderStatus, "DELIVERED");
  assert.ok(distanceM(final.position, demoMission.home) < 0.01);
  assert.equal(final.position.altitudeM, demoMission.home.altitudeM);
});

test("TC-17: giao hàng thất bại nhưng UAV quay về vẫn COMPLETED", () => {
  const e = make();
  e.command("START");
  goUntil(e, "WAITING_FOR_HANDOVER");
  assert.equal(e.command("CONFIRM_HANDOVER", { success: false }).ok, true);
  assert.equal(e.snapshot().orderStatus, "DELIVERY_FAILED");
  goUntil(e, "COMPLETED");
  assert.equal(e.snapshot().missionStatus, "COMPLETED");
  assert.equal(e.snapshot().orderStatus, "DELIVERY_FAILED");
  assert.equal(e.snapshot().cargoOnBoard, true);
});

test("TC-18: quá thời gian chờ bàn giao -> giao thất bại và quay về", () => {
  const e = make();
  e.command("START");
  goUntil(e, "WAITING_FOR_HANDOVER");
  e.tick(DEFAULT_PARAMS.handoverTimeoutSec + 1);
  assert.equal(e.snapshot().orderStatus, "DELIVERY_FAILED");
  assert.equal(e.snapshot().missionStatus, "RETURNING");
});

test("TC-19: RETURN_HOME khi đang bay đánh dấu giao thất bại", () => {
  const e = make();
  e.command("START");
  goUntil(e, "EN_ROUTE");
  assert.equal(e.command("RETURN_HOME").ok, true);
  assert.equal(e.snapshot().orderStatus, "DELIVERY_FAILED");
  goUntil(e, "COMPLETED");
  assert.equal(e.snapshot().orderStatus, "DELIVERY_FAILED");
});

test("TC-20: RESET trả về trạng thái ban đầu và không ảnh hưởng engine khác", () => {
  const a = make();
  const b = make({
    droneId: "uav-02",
    missionId: "mis-02",
    orderId: "ord-02",
    batteryPct: 78,
  });
  a.command("START");
  a.tick(4);
  assert.equal(b.snapshot().flightState, "IDLE");
  assert.equal(b.snapshot().batteryPct, 78);
  assert.equal(a.command("RESET").ok, true);
  assert.equal(a.snapshot().simTimeSec, 0);
  assert.equal(a.snapshot().flightState, "IDLE");
  assert.equal(a.snapshot().batteryPct, 90);
  assert.deepEqual(a.snapshot().position, demoMission.home);
});

test("TC-21: snapshot không cho sửa ngược trạng thái engine", () => {
  const e = make();
  const s = e.snapshot();
  s.position.lon = 0;
  s.events.push("fake");
  assert.equal(e.snapshot().position.lon, demoMission.home.lon);
  assert.equal(e.snapshot().events.length, 0);
});

test("TC-22: dt lớn vẫn chia bước nhỏ; không NaN và không vượt waypoint", () => {
  const e = make();
  e.command("START");
  const s = e.tick(150);
  assert.ok(s.simTimeSec > 0 && s.simTimeSec <= 150);
  assert.ok(Number.isFinite(s.position.lon) && Number.isFinite(s.batteryPct));
  assert.ok(s.speedMps <= 6.01);
  assert.ok(s.waypointIndex <= demoMission.waypoints.length);
});
