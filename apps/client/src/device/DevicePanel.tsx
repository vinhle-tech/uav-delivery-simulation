import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./device-panel.css";
const BASE = "http://127.0.0.1:3000";
interface Telemetry {
  deviceMode?: string;
  imuReady?: boolean;
  bootId?: string;
  seq: number;
  batterySimPct: number;
  uptimeMs: number;
  imu: { ax: number; ay: number; az: number };
  motorPwm: number[];
  cargoLock: string;
}
interface CommandResult {
  commandId: string;
  value: string;
  status: string;
  reason: string | null;
  ack: { deviceMode: string; cargoLock: string } | null;
}
interface DeviceSnapshot {
  deviceId: string;
  brokerReady: boolean;
  status: string;
  telemetry: Telemetry | null;
  receivedAt: number | null;
  lastCommand: CommandResult | null;
  revision: number;
}
export default function DevicePanel() {
  const [socketUp, setSocketUp] = useState(false);
  const [state, setState] = useState<DeviceSnapshot | null>(null);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState(
    "Điều khiển servo mô hình; Backend và firmware cùng kiểm tra.",
  );
  useEffect(() => {
    const socket = io(BASE, { autoConnect: false });
    const update = (s: DeviceSnapshot) =>
      setState((old) => (!old || s.revision >= old.revision ? s : old));
    socket.on("connect", () => {
      setState(null);
      setSocketUp(true);
    });
    socket.on("disconnect", () => setSocketUp(false));
    socket.on("connect_error", () => setSocketUp(false));
    for (const event of ["device:telemetry", "device:status", "device:ack"])
      socket.on(event, update);
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, []);
  async function send(value: "LOCK" | "UNLOCK") {
    if (
      value === "UNLOCK" &&
      !window.confirm("Mở khoang hàng mô phỏng tại điểm giao?")
    )
      return;
    setSending(true);
    setNotice("Đang gửi yêu cầu...");
    const commandId = crypto.randomUUID();
    try {
      const res = await fetch(`${BASE}/api/devices/uav-01/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commandId, value }),
        signal: AbortSignal.timeout(5000),
      });
      const result = await res.json();
      setNotice(
        res.ok
          ? `Backend nhận yêu cầu ${value}; xem kết quả ACK bên dưới.`
          : `Bị từ chối: ${result.error}`,
      );
    } catch {
      setNotice(
        "Không xác nhận được yêu cầu HTTP. Kiểm tra kết quả ACK/trạng thái trước khi gửi lại.",
      );
    } finally {
      setSending(false);
    }
  }
  const t = state?.telemetry;
  const disabled =
    !socketUp ||
    state?.status !== "ONLINE" ||
    sending ||
    state?.lastCommand?.status === "PENDING";
  return (
    <section className="device-panel" aria-label="Wokwi Device Panel">
      <div className="device-head">
        <strong>WOKWI ESP32 · UAV-01</strong>
        <span
          className={
            socketUp && state?.status === "ONLINE"
              ? "device-online"
              : "device-offline"
          }
        >
          {!socketUp ? "BACKEND OFFLINE" : (state?.status ?? "CONNECTING")}
        </span>
      </div>
      <p className="device-small">
        MQTT: {socketUp && state?.brokerReady ? "CONNECTED" : "OFFLINE"} · Dữ
        liệu thiết bị, không phải GPS bay.
      </p>
      {t ? (
        <>
          <div className="device-meter">
            <span>Pin từ biến trở</span>
            <b>{t.batterySimPct}%</b>
          </div>
          <progress max={100} value={t.batterySimPct} />
          <div className="device-meter">
            <span>IMU X / Y / Z (m/s²)</span>
            <b>
              {[t.imu.ax, t.imu.ay, t.imu.az]
                .map((n) => n.toFixed(2))
                .join(" / ")}
            </b>
          </div>
          <div className="device-pwm">
            {t.motorPwm.map((p, i) => (
              <div key={i}>
                M{i + 1}
                <b>{p}</b>
                <progress max={255} value={p} />
              </div>
            ))}
          </div>
          <div className="device-meter">
            <span>Khoang hàng (telemetry)</span>
            <b>{t.cargoLock}</b>
          </div>
          <div className="device-small">
            Mode: {t.deviceMode ?? "v1"} · IMU:{" "}
            {t.imuReady === false ? "ERROR" : t.imuReady ? "READY" : "—"}
          </div>
          <div className="device-small">
            Seq {t.seq} · uptime {Math.floor(t.uptimeMs / 1000)}s{" "}
            {(!socketUp || state?.status !== "ONLINE") && "· DỮ LIỆU CŨ"}
          </div>
        </>
      ) : (
        <p>Chưa nhận telemetry.</p>
      )}
      <div className="device-actions">
        <button
          className="control"
          disabled={disabled}
          onClick={() => void send("LOCK")}
        >
          LOCK
        </button>
        <button
          className="control"
          disabled={disabled}
          onClick={() => void send("UNLOCK")}
        >
          UNLOCK
        </button>
      </div>
      <p className="device-small" role="status">
        {notice}
      </p>
      {state?.lastCommand && (
        <div className="device-result">
          <b>
            {state.lastCommand.value}: {state.lastCommand.status}
          </b>
          <div>{state.lastCommand.reason ?? "Đang chờ thiết bị"}</div>
          {state.lastCommand.ack && (
            <div>
              {state.lastCommand.ack.deviceMode} ·{" "}
              {state.lastCommand.ack.cargoLock}
            </div>
          )}
          <small>{state.lastCommand.commandId}</small>
        </div>
      )}
      <p className="device-small">
        Ngày 6: chỉ mở khóa khi UAV-01 đã hạ cánh và đồng bộ. ACK không xác nhận
        giao hàng.
      </p>
    </section>
  );
}
