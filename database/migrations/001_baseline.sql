-- UAV Delivery Simulation - PostgreSQL schema for learning (local-only MVP)
-- Run inside the uav_delivery database in pgAdmin Query Tool.
-- IDs are TEXT for readability and compatibility with ORD-001/UAV-01 examples.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'OPERATOR' CHECK (role IN ('OPERATOR','ADMIN')),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180)
);

CREATE TABLE IF NOT EXISTS drone_models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  max_payload_kg NUMERIC(7,2) NOT NULL CHECK (max_payload_kg > 0),
  cruise_speed_mps NUMERIC(7,2) NOT NULL CHECK (cruise_speed_mps > 0)
);

CREATE TABLE IF NOT EXISTS delivery_points (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180)
);

CREATE TABLE IF NOT EXISTS drones (
  id TEXT PRIMARY KEY,
  model_id TEXT NOT NULL REFERENCES drone_models(id),
  station_id TEXT NOT NULL REFERENCES stations(id),
  battery_pct NUMERIC(5,2) NOT NULL CHECK (battery_pct BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'AVAILABLE'
    CHECK (status IN ('AVAILABLE','RESERVED','BUSY','CHARGING','MAINTENANCE','EMERGENCY')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  delivery_point_id TEXT NOT NULL REFERENCES delivery_points(id),
  created_by TEXT REFERENCES users(id),
  weight_kg NUMERIC(7,2) NOT NULL CHECK (weight_kg > 0),
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','ASSIGNED','IN_DELIVERY','DELIVERED','DELIVERY_FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS missions (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  drone_id TEXT NOT NULL REFERENCES drones(id),
  station_id TEXT NOT NULL REFERENCES stations(id),
  status TEXT NOT NULL DEFAULT 'READY'
    CHECK (status IN ('READY','IN_PROGRESS','PAUSED','RETURNING','COMPLETED','FAILED','INTERRUPTED')),
  version INTEGER NOT NULL DEFAULT 0 CHECK (version >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

-- Protect against two active missions for one drone or one order.
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_mission_drone
  ON missions(drone_id)
  WHERE status IN ('READY','IN_PROGRESS','PAUSED','RETURNING','INTERRUPTED');
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_mission_order
  ON missions(order_id)
  WHERE status IN ('READY','IN_PROGRESS','PAUSED','RETURNING','INTERRUPTED');
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);

CREATE TABLE IF NOT EXISTS waypoints (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  sequence_no INTEGER NOT NULL CHECK (sequence_no >= 0),
  x_m DOUBLE PRECISION NOT NULL,
  y_m DOUBLE PRECISION NOT NULL,
  altitude_m DOUBLE PRECISION NOT NULL CHECK (altitude_m >= 0),
  UNIQUE(mission_id, sequence_no)
);

CREATE TABLE IF NOT EXISTS telemetry (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  drone_id TEXT NOT NULL REFERENCES drones(id),
  mission_id TEXT REFERENCES missions(id),
  sim_time_s DOUBLE PRECISION CHECK (sim_time_s >= 0),
  x_m DOUBLE PRECISION NOT NULL,
  y_m DOUBLE PRECISION NOT NULL,
  z_m DOUBLE PRECISION NOT NULL,
  battery_pct NUMERIC(5,2) NOT NULL CHECK (battery_pct BETWEEN 0 AND 100),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_telemetry_drone_time ON telemetry(drone_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS drone_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  drone_id TEXT NOT NULL REFERENCES drones(id),
  mission_id TEXT REFERENCES missions(id),
  event_type TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  drone_id TEXT NOT NULL REFERENCES drones(id),
  mission_id TEXT REFERENCES missions(id),
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('INFO','WARNING','CRITICAL')),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','RESOLVED')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS delivery_confirmations (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  mission_id TEXT NOT NULL UNIQUE REFERENCES missions(id),
  successful BOOLEAN NOT NULL,
  method TEXT NOT NULL DEFAULT 'MANUAL',
  failure_reason TEXT,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((successful AND failure_reason IS NULL) OR NOT successful)
);
