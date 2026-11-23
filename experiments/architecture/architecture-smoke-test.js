// DEMO KIẾN TRÚC: Sử dụng EventEmitter để học cách server độc lập client.
// Đây KHÔNG phải server REST / Socket.IO. Chạy với Node.js, không cần npm install.
const { EventEmitter } = require("node:events");
const {
  VirtualFlightController,
  C,
} = require("../flight-controller/flight-controller");

class DemoServer {
  constructor() {
    this.engine = new VirtualFlightController({ battery: 90, payloadKg: 0.8 });
    this.events = new EventEmitter();
    this.version = 0;
    this.receipts = new Map();
  }
  command({ requestId, expectedVersion, type }) {
    if (this.receipts.has(requestId)) return this.receipts.get(requestId);
    if (expectedVersion !== this.version) {
      return {
        ok: false,
        status: 409,
        reason: "VERSION_CONFLICT",
        version: this.version,
      };
    }
    const engineResult = this.engine.command(type);
    const result = engineResult.ok
      ? { ok: true, status: 202, accepted: type, version: ++this.version }
      : {
          ok: false,
          status: 422,
          reason: engineResult.reason,
          version: this.version,
        };
    this.receipts.set(requestId, result);
    return result;
  }
  tick(n) {
    for (let i = 0; i < n; i++) {
      this.engine.tick();
      if (i % 5 === 0) {
        const t = this.engine.telemetry();
        this.events.emit("telemetry", {
          flightState: t.flightState,
          simTimeSec: t.simTimeSec,
          batteryPct: t.batteryPct,
          x: t.truePosition.x,
          version: this.version,
        });
      }
    }
  }
  subscribe(clientName) {
    let count = 0;
    const handler = (t) => {
      count++;
      if (count % 30 === 1) {
        console.log(
          `[${clientName}] sim=${t.simTimeSec}s state=${t.flightState} x=${t.x.toFixed(1)}m pin=${t.batteryPct}%`,
        );
      }
    };
    this.events.on("telemetry", handler);
    return () => this.events.off("telemetry", handler);
  }
}

const server = new DemoServer();
const closeWeb = server.subscribe("WEB");
server.subscribe("MOBILE");
server.subscribe("DESKTOP");
console.log(
  "START:",
  server.command({ requestId: "r-start", expectedVersion: 0, type: "START" }),
);
let ticks = 0;
while (server.engine.state !== "EN_ROUTE" && ticks < 1000) {
  server.tick(1);
  ticks++;
}
if (server.engine.state !== "EN_ROUTE")
  throw new Error("UAV không vào EN_ROUTE");
console.log(
  "PAUSE từ WEB:",
  server.command({ requestId: "r-pause", expectedVersion: 1, type: "PAUSE" }),
);
console.log(
  "RESUME với version cũ từ MOBILE:",
  server.command({ requestId: "r-old", expectedVersion: 1, type: "RESUME" }),
);
console.log(
  "RESUME với version mới từ MOBILE:",
  server.command({ requestId: "r-new", expectedVersion: 2, type: "RESUME" }),
);
const before = server.engine.seconds;
console.log("Đóng WEB (chỉ hủy đăng ký sự kiện)");
closeWeb();
server.tick(100);
const after = server.engine.seconds;
console.log(
  `Server tiếp tục tick: ${before.toFixed(1)}s -> ${after.toFixed(1)}s`,
);
console.log(
  "KẾT LUẬN: Web đóng không làm dừng Engine còn chạy trong demo server.",
);
console.log(`Bước thời gian: ${C.dt}s`);
