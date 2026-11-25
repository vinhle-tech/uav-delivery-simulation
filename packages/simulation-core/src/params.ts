import type { SimulationParams } from './types.js';

/** Mô hình giáo dục; 25 phút danh định ~ 100% / 1500s, chưa hiệu chuẩn theo pin thật.
 *  Thử nghiệm ngày 4 trước đó dùng 0.08 điểm %/s; ở đây chọn 0.066667 cho nhất quán
 *  với giả định thời lượng danh định ~25 phút. Hai giá trị KHÔNG được coi là kết quả đo.
 */
export const DEFAULT_PARAMS: Readonly<SimulationParams> = Object.freeze({
  speedMps: 6,
  climbSpeedMps: 3,
  cruiseAltitudeM: 45,
  maxPayloadKg: 1.5,
  maxRadiusM: 2000,
  flightDrainPctPerSec: 100 / 1500,
  hoverDrainPctPerSec: 0.05,
  groundDrainPctPerSec: 0.002,
  batteryReservePct: 30,
  landingBudgetPct: 1.5,
  handoverTimeoutSec: 60,
});
