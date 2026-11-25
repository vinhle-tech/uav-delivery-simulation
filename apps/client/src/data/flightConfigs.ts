import { demoMission, type MissionConfig } from '@uav/simulation-core';
import { deliveryPoint, drones, station, waypoints } from './demo';

/**
 * Dữ liệu riêng của Ngày 3, dùng đúng trạm/điểm giao/waypoint Ngày 1 và Ngày 2.
 * 3 động cơ mô phỏng cục bộ độc lập; không ghi PostgreSQL.
 * UAV-03 là OFFLINE, được hiển thị nhưng không được START.
 */
export const flightConfigs: Record<string, MissionConfig> = {
  'uav-01': demoMission,
  'uav-02': {
    droneId: 'uav-02',
    missionId: 'mis-demo-002',
    orderId: 'ord-demo-002',
    home: { ...drones[1].position, altitudeM: station.position.altitudeM },
    delivery: { ...deliveryPoint.position },
    waypoints: waypoints.map((w) => ({
      id: w.id,
      position: { ...w.position, lat: w.position.lat + 0.00025 },
    })),
    payloadKg: 1.1,
    batteryPct: 78,
    droneStatus: 'AVAILABLE',
  },
  'uav-03': {
    droneId: 'uav-03',
    missionId: 'mis-demo-offline-03',
    orderId: 'ord-demo-offline-03',
    home: { ...drones[2].position, altitudeM: station.position.altitudeM },
    delivery: { ...deliveryPoint.position },
    waypoints: waypoints.map((w) => ({ id: w.id, position: { ...w.position } })),
    payloadKg: 0.8,
    batteryPct: 62,
    droneStatus: 'OFFLINE',
  },
};
