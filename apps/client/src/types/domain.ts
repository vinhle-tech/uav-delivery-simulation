export interface GeoPoint {
  lon: number;
  lat: number;
  altitudeM: number;
}

export type DroneStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';
export type MissionStatus = 'READY' | 'IN_PROGRESS' | 'PAUSED' | 'RETURNING' | 'COMPLETED';
export type OrderStatus = 'PENDING' | 'ASSIGNED' | 'DELIVERED' | 'DELIVERY_FAILED';

export interface Station { id: string; name: string; position: GeoPoint }
export interface Drone { id: string; status: DroneStatus; batteryPct: number; position: GeoPoint; maxPayloadKg: number }
export interface Waypoint { id: string; position: GeoPoint }
export interface DeliveryPoint { id: string; name: string; position: GeoPoint }
export interface Order { id: string; status: OrderStatus; weightKg: number; deliveryPointId: string }
export interface Mission { id: string; droneId: string; orderId: string; status: MissionStatus; waypointIds: string[] }
