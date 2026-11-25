import type {
  DeliveryPoint,
  Drone,
  Mission,
  Order,
  Station,
  Waypoint,
} from "../types/domain";

// Tọa độ minh họa khu vực Hà Nội; KHÔNG phải hành trình bay thật hoặc vùng cho phép bay.
export const station: Station = {
  id: "station-01",
  name: "Trạm giao hàng mẫu",
  position: { lon: 105.8542, lat: 21.0285, altitudeM: 12 },
};

export const deliveryPoint: DeliveryPoint = {
  id: "point-a",
  name: "Điểm nhận A",
  position: { lon: 105.8609, lat: 21.0346, altitudeM: 12 },
};

export const waypoints: Waypoint[] = [
  { id: "wp-01", position: { lon: 105.8556, lat: 21.03, altitudeM: 45 } },
  { id: "wp-02", position: { lon: 105.8582, lat: 21.0319, altitudeM: 45 } },
  { id: "wp-03", position: { lon: 105.8595, lat: 21.0335, altitudeM: 45 } },
];

export const drones: Drone[] = [
  {
    id: "uav-01",
    status: "AVAILABLE",
    batteryPct: 90,
    position: { lon: 105.8542, lat: 21.0285, altitudeM: 40 },
    maxPayloadKg: 1.5,
  },
  {
    id: "uav-02",
    status: "AVAILABLE",
    batteryPct: 78,
    position: { lon: 105.85395, lat: 21.02872, altitudeM: 40 },
    maxPayloadKg: 1.5,
  },
  {
    id: "uav-03",
    status: "OFFLINE",
    batteryPct: 62,
    position: { lon: 105.85445, lat: 21.02872, altitudeM: 40 },
    maxPayloadKg: 1.5,
  },
];

export const orders: Order[] = [
  {
    id: "ord-demo-001",
    status: "PENDING",
    weightKg: 0.8,
    deliveryPointId: "point-a",
  },
  {
    id: "ord-demo-002",
    status: "PENDING",
    weightKg: 1.1,
    deliveryPointId: "point-a",
  },
];

export const missions: Mission[] = [
  {
    id: "mis-demo-001",
    droneId: "uav-01",
    orderId: "ord-demo-001",
    status: "READY",
    waypointIds: waypoints.map((w) => w.id),
  },
];
