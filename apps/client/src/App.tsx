import { useEffect, useRef, useState } from "react";
import {
  SimulationEngine,
  type Command,
  type CommandOptions,
  type SimulationSnapshot,
} from "@uav/simulation-core";
import AuthGate, { AccountBar } from "./auth/AuthGate";
import CesiumMap from "./map/CesiumMap";
import DevicePanel from "./device/DevicePanel";
import { useSyncedFlight } from "./device/useSyncedFlight";
import { flightConfigs } from "./data/flightConfigs";
import { deliveryPoint, drones, station, waypoints } from "./data/demo";

function createEngines(): Record<string, SimulationEngine> {
  return Object.fromEntries(
    Object.entries(flightConfigs).map(([id, config]) => [
      id,
      new SimulationEngine(config),
    ]),
  );
}

function readSnapshots(
  engines: Record<string, SimulationEngine>,
): Record<string, SimulationSnapshot> {
  return Object.fromEntries(
    Object.entries(engines).map(([id, engine]) => [id, engine.snapshot()]),
  );
}

function formatTime(sec: number): string {
  const total = Math.floor(sec);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export default function App() {
  return (
    <AuthGate>
      <FlightDashboard />
    </AuthGate>
  );
}

function FlightDashboard() {
  const enginesRef = useRef<Record<string, SimulationEngine> | null>(null);
  if (!enginesRef.current) enginesRef.current = createEngines();

  const [snapshots, setSnapshots] = useState<
    Record<string, SimulationSnapshot>
  >(() => readSnapshots(enginesRef.current!));
  const sync = useSyncedFlight();
  const [selected, setSelected] = useState("uav-01");
  const [speedMultiplier, setSpeedMultiplier] = useState(4);
  const [follow, setFollow] = useState(false);
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [mapError, setMapError] = useState("");
  const [notice, setNotice] = useState(
    "Chọn UAV-01 rồi nhấn START để bay thử.",
  );

  // Ngày 3: scheduler chạy CỤC BỘ trong browser, không phát lệnh tới Backend.
  // Fixed step 100 ms thời gian thực; tick() trong Core chia tiếp thành các bước 0.1 s.
  // Khi tab bị throttling, mô phỏng chậm lại thay vì chạy bù đột ngột.
  useEffect(() => {
    const id = window.setInterval(() => {
      const engines = enginesRef.current;
      if (!engines) return;
      for (const [key, engine] of Object.entries(engines)) {
        if (key === "uav-01") continue;
        engine.tick(0.1 * speedMultiplier);
      }
      setSnapshots(readSnapshots(engines));
    }, 100);
    return () => window.clearInterval(id);
  }, [speedMultiplier]);

  function send(command: Command, options: CommandOptions = {}) {
    if (selected === "uav-01") {
      void sync.send(
        command,
        options.success === undefined ? {} : { success: options.success },
      );
      return;
    }
    const engine = enginesRef.current?.[selected];
    if (!engine) return;
    const result = engine.command(command, options);
    setSnapshots(readSnapshots(enginesRef.current!));
    setNotice(
      result.ok
        ? `${selected.toUpperCase()}: ${command} được chấp nhận.`
        : `${selected.toUpperCase()}: ${command} bị từ chối — ${result.reason ?? "Không rõ lý do"}`,
    );
  }

  const displaySnapshots = sync.data
    ? { ...snapshots, "uav-01": sync.data.flight }
    : snapshots;
  const current = displaySnapshots[selected];
  const blocked =
    selected === "uav-01" &&
    (!sync.connected ||
      !sync.data ||
      sync.busy ||
      sync.data.syncStatus === "SYNCING" ||
      !!sync.data.fault);
  const resetBlocked =
    selected === "uav-01" &&
    (!sync.connected ||
      !sync.data ||
      sync.busy ||
      sync.data.syncStatus === "SYNCING" ||
      (!sync.data.fault &&
        !["IDLE", "COMPLETED", "FAILED"].includes(current.flightState)));
  const config = flightConfigs[selected];
  const canStart =
    current.flightState === "IDLE" && current.droneStatus === "AVAILABLE";
  const canPause = current.flightState === "EN_ROUTE";
  const canResume = current.flightState === "PAUSED";
  const canReturn = ["EN_ROUTE", "PAUSED", "WAITING_FOR_HANDOVER"].includes(
    current.flightState,
  );
  const canHandover = current.flightState === "WAITING_FOR_HANDOVER";
  const relativeAltitude = Math.max(
    0,
    current.position.altitudeM - config.home.altitudeM,
  );

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <div className="brandmark">✈</div>
          <div>
            <b>UAV DELIVERY</b>
            <span>Simulation System</span>
          </div>
        </div>
        <div className="side-scroll">
          <AccountBar />
          <div className="eyebrow">GIAI ĐOẠN 3 · AUTHENTICATION</div>
          <h1>Mô phỏng UAV 3D</h1>
          <p className="muted">
            UAV-01 chạy trên Backend và đồng bộ Wokwi; UAV-02 chạy cục bộ;
            UAV-03 offline.
          </p>

          <div className="section-title">
            ĐỘI UAV <span>{drones.length} thiết bị ảo</span>
          </div>
          <div className="drone-list">
            {drones.map((d) => {
              const s = displaySnapshots[d.id];
              return (
                <button
                  key={d.id}
                  className={
                    "drone-card " + (selected === d.id ? "active" : "")
                  }
                  type="button"
                  onClick={() => setSelected(d.id)}
                >
                  <span className="drone-top">
                    <b>{d.id.toUpperCase()}</b>
                    <span
                      className={
                        "status-chip " +
                        (s.droneStatus === "OFFLINE" ? "off" : "ok")
                      }
                    >
                      {s.flightState}
                    </span>
                  </span>
                  <span className="drone-foot">
                    <span>🔋 {s.batteryPct.toFixed(1)}%</span>
                    <span>{s.droneStatus}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="section-title">ĐIỀU KHIỂN UAV ĐÃ CHỌN</div>
          <div className="controls">
            <button
              className="control primary"
              disabled={blocked || !canStart}
              onClick={() => send("START")}
            >
              ▶ START
            </button>
            <button
              className="control"
              disabled={blocked || !canPause}
              onClick={() => send("PAUSE")}
            >
              ⏸ PAUSE
            </button>
            <button
              className="control"
              disabled={blocked || !canResume}
              onClick={() => send("RESUME")}
            >
              ⏵ RESUME
            </button>
            <button
              className="control"
              disabled={blocked || !canReturn}
              onClick={() => send("RETURN_HOME")}
            >
              ↩ RETURN HOME
            </button>
            <button
              className="control success"
              disabled={blocked || !canHandover}
              onClick={() => send("CONFIRM_HANDOVER", { success: true })}
            >
              ✓ ĐÃ BÀN GIAO
            </button>
            <button
              className="control danger"
              disabled={blocked || !canHandover}
              onClick={() => send("CONFIRM_HANDOVER", { success: false })}
            >
              ✕ GIAO THẤT BẠI
            </button>
            <button
              className="control wide"
              disabled={resetBlocked}
              onClick={() => send("RESET")}
            >
              ↺ RESET UAV ĐÃ CHỌN
            </button>
          </div>

          <div className="section-title">TỐC ĐỘ THỜI GIAN MÔ PHỎNG</div>
          <div className="speed-list" role="group" aria-label="Tốc độ mô phỏng">
            {[1, 4, 8].map((n) => (
              <button
                key={n}
                className={
                  "speed-button " +
                  ((selected === "uav-01"
                    ? sync.data?.speed
                    : speedMultiplier) === n
                    ? "selected"
                    : "")
                }
                type="button"
                disabled={
                  selected === "uav-01" && (!sync.connected || sync.busy)
                }
                onClick={() =>
                  selected === "uav-01"
                    ? void sync.send("SPEED", { value: n })
                    : setSpeedMultiplier(n)
                }
              >
                {n}×
              </button>
            ))}
          </div>
          <p className="footnote">
            1× = 0,1 giây mô phỏng mỗi 100 ms thực. Tab chạy nền có thể chậm
            hơn.
          </p>

          <div className="info">
            <b>
              UAV-01 SYNC:{" "}
              {!sync.connected
                ? "BACKEND OFFLINE"
                : (sync.data?.syncStatus ?? "CONNECTING")}
            </b>
            <br />
            Mode ESP32: {sync.data?.deviceMode ?? "—"}
            <br />
            {sync.data?.fault ?? ""}
            <br />
            {sync.notice}
            <br />
            Nếu FAULT: khôi phục kết nối, RESET để bắt đầu lại demo.
          </div>
          <DevicePanel />
          <div className="section-title">TRẠM & TUYẾN ĐƯỜNG</div>
          <div className="fact">
            <span>Trạm</span>
            <b>{station.id.toUpperCase()}</b>
          </div>
          <div className="fact">
            <span>Điểm giao</span>
            <b>{deliveryPoint.id.toUpperCase()}</b>
          </div>
          <div className="fact">
            <span>Waypoint mẫu</span>
            <b>{waypoints.length}</b>
          </div>
          <div className="info">
            UAV-03 cố ý OFFLINE để kiểm tra việc từ chối START. RESET UAV-01 yêu
            cầu ESP32 xác nhận về IDLE; UAV-02 reset cục bộ.
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <strong>Giám sát chuyến bay – CesiumJS</strong>
            <span>Hà Nội · Dữ liệu giả lập phục vụ học tập</span>
          </div>
          <div className="topright">
            <span className={"app-indicator " + mapStatus}>
              {mapStatus === "ready"
                ? "● Bản đồ sẵn sàng"
                : mapStatus === "error"
                  ? "● Lỗi Cesium"
                  : "● Đang tải Cesium..."}
            </span>
          </div>
        </header>

        <div className="status-line" role="status" aria-live="polite">
          {selected === "uav-01" ? sync.notice : notice}
        </div>
        <div className="map-layout">
          <section className="map-card">
            <CesiumMap
              snapshots={displaySnapshots}
              selectedDroneId={selected}
              follow={follow}
              onFollowChange={setFollow}
              onReady={() => setMapStatus("ready")}
              onError={(e) => {
                setMapError(e);
                setMapStatus("error");
              }}
            />
            {mapStatus === "error" && (
              <div className="error-overlay">
                <b>Không thể khởi tạo CesiumJS</b>
                <p>{mapError}</p>
                <p>Kiểm tra WebGL và Console (F12).</p>
              </div>
            )}
            <div className="map-caption">
              Backend (UAV-01) / Local Core (UAV-02) → snapshot → Cesium; không
              dùng để điều khiển UAV thật.
            </div>
          </section>

          <aside className="telemetry">
            <div className="panel-heading">
              <span>TELEMETRY TỪ SIMULATION CORE</span>
              <span className="pill">
                {selected === "uav-01" ? "SERVER CORE" : "LOCAL CORE"}
              </span>
            </div>
            <h2>{current.droneId.toUpperCase()}</h2>
            <div className="metric">
              <span>Flight State</span>
              <b className="state-value">{current.flightState}</b>
            </div>
            <div className="metric">
              <span>Mission Status</span>
              <b>{current.missionStatus}</b>
            </div>
            <div className="metric">
              <span>Order Status</span>
              <b>{current.orderStatus}</b>
            </div>
            <div className="metric">
              <span>Drone Status</span>
              <b>{current.droneStatus}</b>
            </div>
            <div className="metric">
              <span>Pin giả lập</span>
              <b>{current.batteryPct.toFixed(1)}%</b>
            </div>
            <div className="metric">
              <span>Vận tốc ngang</span>
              <b>{current.speedMps.toFixed(2)} m/s</b>
            </div>
            <div className="metric">
              <span>Độ cao so với trạm</span>
              <b>{relativeAltitude.toFixed(1)} m</b>
            </div>
            <div className="metric">
              <span>Quãng đường</span>
              <b>{current.distanceTravelledM.toFixed(1)} m</b>
            </div>
            <div className="metric">
              <span>Thời gian mô phỏng</span>
              <b>{formatTime(current.simTimeSec)}</b>
            </div>
            <div className="metric">
              <span>Mục tiêu</span>
              <b>{current.targetId ?? "—"}</b>
            </div>
            <div className="metric">
              <span>GPS (lon, lat)</span>
              <b className="coords">
                {current.position.lon.toFixed(5)},{" "}
                {current.position.lat.toFixed(5)}
              </b>
            </div>
            <div className="metric">
              <span>Mission ID</span>
              <b>{current.missionId}</b>
            </div>
            {current.lastError && (
              <div className="error-note">{current.lastError}</div>
            )}
            <div className="section-title">NHẬT KÝ CHUYỂN TRẠNG THÁI</div>
            <div className="event-log" aria-label="Nhật ký chuyển trạng thái">
              {current.events.length ? (
                current.events
                  .slice(-6)
                  .reverse()
                  .map((line, i) => <div key={`${i}-${line}`}>{line}</div>)
              ) : (
                <span>Chưa có sự kiện.</span>
              )}
            </div>
            <div className="alert">
              Các chỉ số bay là mô phỏng từ Core; pin ADC/IMU xem Device Panel
              riêng. Không ghi Mission vào PostgreSQL.
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
