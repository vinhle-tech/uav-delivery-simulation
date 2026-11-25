import type { MissionConfig } from './types.js';

/** Đồng bộ với tọa độ minh họa từ apps/client/src/data/demo.ts (Ngày 1). */
export const demoMission: MissionConfig = {
  droneId: 'uav-01', missionId: 'mis-demo-001', orderId: 'ord-demo-001',
  home: { lon: 105.8542, lat: 21.0285, altitudeM: 12 },
  delivery: { lon: 105.8609, lat: 21.0346, altitudeM: 12 },
  waypoints: [
    { id: 'wp-01', position: { lon: 105.8556, lat: 21.0300, altitudeM: 45 } },
    { id: 'wp-02', position: { lon: 105.8582, lat: 21.0319, altitudeM: 45 } },
    { id: 'wp-03', position: { lon: 105.8595, lat: 21.0335, altitudeM: 45 } },
  ],
  payloadKg: 0.8,
  batteryPct: 90,
  droneStatus: 'AVAILABLE',
};
