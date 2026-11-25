/** API độc lập UI; GeoPoint.altitudeM là cao độ quy ước của demo, không phải AGL địa hình. */
export interface GeoPoint {
  lon: number;
  lat: number;
  altitudeM: number;
}
export interface Waypoint {
  id: string;
  position: GeoPoint;
}
export type FlightState =
  | 'IDLE' | 'PRE_FLIGHT_CHECK' | 'TAKEOFF' | 'EN_ROUTE'
  | 'LANDING' | 'WAITING_FOR_HANDOVER' | 'PAUSED'
  | 'RETURNING' | 'COMPLETED' | 'FAILED';
export type MissionStatus = 'READY' | 'IN_PROGRESS' | 'RETURNING' | 'COMPLETED' | 'FAILED';
export type OrderStatus = 'PENDING' | 'ASSIGNED' | 'DELIVERED' | 'DELIVERY_FAILED';
export type DroneStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'MAINTENANCE';
export type Command = 'START' | 'PAUSE' | 'RESUME' | 'CONFIRM_HANDOVER' | 'RETURN_HOME' | 'RESET';
export interface CommandOptions { success?: boolean }
export interface CommandResult { ok: boolean; reason?: string }
export interface SimulationParams {
  speedMps: number;
  climbSpeedMps: number;
  cruiseAltitudeM: number;
  maxPayloadKg: number;
  maxRadiusM: number;
  flightDrainPctPerSec: number;
  hoverDrainPctPerSec: number;
  groundDrainPctPerSec: number;
  batteryReservePct: number;
  landingBudgetPct: number;
  handoverTimeoutSec: number;
}
export interface MissionConfig {
  droneId: string;
  missionId: string;
  orderId: string;
  home: GeoPoint;
  delivery: GeoPoint;
  waypoints: Waypoint[];
  payloadKg: number;
  batteryPct: number;
  droneStatus?: DroneStatus;
  params?: Partial<SimulationParams>;
}
export interface SimulationSnapshot {
  droneId: string;
  missionId: string;
  orderId: string;
  position: GeoPoint;
  flightState: FlightState;
  missionStatus: MissionStatus;
  orderStatus: OrderStatus;
  droneStatus: DroneStatus;
  batteryPct: number;
  speedMps: number;
  simTimeSec: number;
  waypointIndex: number;
  targetId: string | null;
  distanceTravelledM: number;
  cargoOnBoard: boolean;
  lastError: string | null;
  events: string[];
}
