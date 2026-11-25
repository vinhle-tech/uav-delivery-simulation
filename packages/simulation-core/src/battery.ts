import { distanceM, routeDistanceM } from './navigation.js';
import type { GeoPoint, MissionConfig, SimulationParams } from './types.js';

/** Chỉ là ước tính dùng cho mô phỏng giáo dục, không khẳng định an toàn UAV thật. */
export function estimateMissionEnergyPct(cfg: MissionConfig, p: SimulationParams): number {
  const outgoing = [cfg.home, ...cfg.waypoints.map(w => w.position), cfg.delivery];
  const groundDistanceM = 2 * routeDistanceM(outgoing);
  const climbAndLandM = 2 * (Math.max(0, p.cruiseAltitudeM - cfg.home.altitudeM) + Math.max(0, p.cruiseAltitudeM - cfg.delivery.altitudeM));
  const flightSeconds = groundDistanceM / p.speedMps + climbAndLandM / p.climbSpeedMps;
  return flightSeconds * p.flightDrainPctPerSec + p.handoverTimeoutSec * p.groundDrainPctPerSec + p.landingBudgetPct;
}

/** Năng lượng ước tính nếu đi THẲNG về home và hạ cánh; chỉ dùng để quyết định giới hạn trong mô hình. */
export function estimateDirectReturnEnergyPct(position: GeoPoint, home: GeoPoint, p: SimulationParams): number {
  const horizontalSeconds = distanceM(position, home) / p.speedMps;
  const altitudeSeconds = (Math.abs(p.cruiseAltitudeM - position.altitudeM) + Math.max(0, p.cruiseAltitudeM - home.altitudeM)) / p.climbSpeedMps;
  return (horizontalSeconds + altitudeSeconds) * p.flightDrainPctPerSec + p.landingBudgetPct;
}

export function preflightError(cfg: MissionConfig, p: SimulationParams): string | null {
  if (!Number.isFinite(cfg.payloadKg) || cfg.payloadKg <= 0 || cfg.payloadKg > p.maxPayloadKg) return 'Tải trọng phải > 0 và <= 1.5 kg';
  if (!Number.isFinite(cfg.batteryPct) || cfg.batteryPct < 0 || cfg.batteryPct > 100) return 'Giá trị pin không hợp lệ';
  if (cfg.batteryPct < estimateMissionEnergyPct(cfg, p) + p.batteryReservePct) {
    return `Không đủ pin cho hành trình đi-về và dự phòng ${p.batteryReservePct}%`;
  }
  return null;
}
