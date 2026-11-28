// Authenticated local educational server; do not expose publicly.
const config = require("./config/env");
const express = require("express");
const http = require("node:http");
const { Server } = require("socket.io");
const { pool, assertTestDb } = require("./db");
const { origins, cors, errorHandler, fail } = require("./middlewares/http");
const app = express();
app.use(cors);
app.use(express.json({ limit: "100kb" }));
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: [...origins] },
  allowRequest: (req, done) =>
    done(null, !req.headers.origin || origins.has(req.headers.origin)),
});
const authRoutes = require("./routes/auth.routes");
const { createAuthMiddleware } = require("./middlewares/auth");
const { createProtectedSocket } = require("./middlewares/socket-auth");
const { authenticate, authorizeRoles } = createAuthMiddleware(
  authRoutes.service,
);
const realtime = createProtectedSocket(io, authRoutes.service);
authRoutes(app);
// Default deny for every /api route registered below, including late MQTT routes.
app.use("/api", authenticate, authorizeRoles("ADMIN", "OPERATOR"));
app.use("/api/demo", authorizeRoles("ADMIN"));
require("./routes/business.routes")(app, realtime);
realtime.on("connection", (socket) =>
  socket.emit("server:hello", {
    message: "Connected to UAV API demo",
    demoOnly: true,
  }),
);
async function start() {
  await assertTestDb();
  // Start only after the port is acquired. Never connect two bridges to same UAV.
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(config.port, "127.0.0.1", () => {
      server.removeListener("error", reject);
      resolve();
    });
  });
  require("./mqtt-bridge").attachMqttBridge(app, realtime);
  app.use((req, res) => fail(res, 404, "NOT_FOUND", "Endpoint không tồn tại"));
  app.use(errorHandler);
  console.log(
    `[PHASE3 SERVER] http://127.0.0.1:${config.port} | DB=${config.database} | MQTT=${config.mqttEnabled ? "ENABLED" : "DISABLED"}`,
  );
}
start().catch(async (e) => {
  console.error("[START FAILED]", e.code || e.message);
  server.close();
  io.close();
  await pool.end();
  process.exitCode = 1;
});
