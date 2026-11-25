import { preflightError, estimateDirectReturnEnergyPct } from './battery.js';
import { distanceM, moveToward, validPoint } from './navigation.js';
import { DEFAULT_PARAMS } from './params.js';
import type {
  Command, CommandOptions, CommandResult, DroneStatus, FlightState, GeoPoint,
  MissionConfig, MissionStatus, OrderStatus, SimulationParams, SimulationSnapshot, Waypoint,
} from './types.js';

const STEP_SEC = 0.1;
type ReturnPhase = 'CLIMB' | 'CRUISE' | 'DESCEND';

function checkMissionConfig(c: MissionConfig, p: SimulationParams): string | null {
  if (!c.droneId || !c.orderId || !c.missionId) return 'Thiếu định danh UAV/Mission/Order';
  if (!validPoint(c.home) || !validPoint(c.delivery)) return 'Tọa độ trạm hoặc điểm giao không hợp lệ';
  if (!c.waypoints.length) return 'Mission không có waypoint';
  if (c.waypoints.some(w => !w.id || !validPoint(w.position))) return 'Waypoint không hợp lệ';
  if (c.waypoints.some(w => distanceM(c.home, w.position) > p.maxRadiusM) || distanceM(c.home, c.delivery) > p.maxRadiusM) {
    return `Điểm ngoài bán kính ${p.maxRadiusM} m`;
  }
  if (p.cruiseAltitudeM < Math.max(c.home.altitudeM, c.delivery.altitudeM)) return 'Độ cao hành trình nhỏ hơn vị trí mặt đất';
  if (p.speedMps <= 0 || p.climbSpeedMps <= 0 || p.flightDrainPctPerSec <= 0 ||
      p.handoverTimeoutSec <= 0 || p.maxRadiusM <= 0) return 'Tham số mô phỏng không hợp lệ';
  return preflightError(c, p);
}

/** Mô hình demo local; ngày tích hợp backend sẽ chuyển nó lên server làm nguồn trạng thái có thẩm quyền. */
export class SimulationEngine {
  private readonly cfg: MissionConfig;
  private readonly p: SimulationParams;
  private position: GeoPoint;
  private batteryPct: number;
  private flightState: FlightState = 'IDLE';
  private missionStatus: MissionStatus = 'READY';
  private orderStatus: OrderStatus = 'PENDING';
  private droneStatus: DroneStatus;
  private speedMps = 0;
  private simTimeSec = 0;
  private waypointIndex = 0;
  private distanceTravelledM = 0;
  private cargoOnBoard = true;
  private lastError: string | null = null;
  private events: string[] = [];
  private waitSec = 0;
  private returnPhase: ReturnPhase = 'CLIMB';
  private returnTargets: Waypoint[] = [];
  private returnIndex = 0;

  constructor(config: MissionConfig) {
    this.cfg = {
      ...config,
      home: { ...config.home }, delivery: { ...config.delivery },
      waypoints: config.waypoints.map(w => ({ id: w.id, position: { ...w.position } })),
      params: config.params ? { ...config.params } : undefined,
    };
    this.p = { ...DEFAULT_PARAMS, ...config.params };
    this.position = { ...this.cfg.home };
    this.batteryPct = config.batteryPct;
    this.droneStatus = config.droneStatus ?? 'AVAILABLE';
  }

  private change(next: FlightState, note: string): void {
    if (this.flightState !== next) {
      this.events.push(`[${this.simTimeSec.toFixed(1)}s] ${this.flightState} -> ${next}: ${note}`);
      this.events = this.events.slice(-100);
      this.flightState = next;
    }
  }

  private fail(reason: string): void {
    this.lastError = reason;
    this.speedMps = 0;
    this.missionStatus = 'FAILED';
    if (this.orderStatus !== 'DELIVERED') this.orderStatus = 'DELIVERY_FAILED';
    this.droneStatus = 'MAINTENANCE';
    this.change('FAILED', reason);
  }

  private startReturn(normalRoute: boolean, note: string): CommandResult {
    const directEnergy = estimateDirectReturnEnergyPct(this.position, this.cfg.home, this.p);
    if (this.batteryPct < directEnergy) {
      this.fail('Không đủ pin để bảo đảm quay về trạm; cần xử lý hạ cánh khẩn cấp ngoài phạm vi demo');
      return { ok: false, reason: this.lastError ?? undefined };
    }
    this.returnTargets = normalRoute
      ? [...this.cfg.waypoints].reverse().map(w => ({ id: `return-${w.id}`, position: { ...w.position } }))
      : [];
    this.returnTargets.push({ id: 'home', position: { ...this.cfg.home } });
    this.returnIndex = 0;
    this.returnPhase = 'CLIMB';
    this.missionStatus = 'RETURNING';
    this.speedMps = 0;
    this.change('RETURNING', note);
    return { ok: true };
  }

  command(cmd: Command, options: CommandOptions = {}): CommandResult {
    if (cmd === 'RESET') {
      // RESET chỉ dành cho mô phỏng cục bộ và có tác động xóa trạng thái phiên chạy.
      this.position = { ...this.cfg.home };
      this.batteryPct = this.cfg.batteryPct;
      this.flightState = 'IDLE';
      this.missionStatus = 'READY';
      this.orderStatus = 'PENDING';
      this.droneStatus = this.cfg.droneStatus ?? 'AVAILABLE';
      this.speedMps = 0;
      this.simTimeSec = 0;
      this.waypointIndex = 0;
      this.distanceTravelledM = 0;
      this.cargoOnBoard = true;
      this.lastError = null;
      this.events = [];
      this.waitSec = 0;
      this.returnTargets = [];
      this.returnIndex = 0;
      this.returnPhase = 'CLIMB';
      return { ok: true };
    }
    if (cmd === 'START') {
      if (this.flightState !== 'IDLE') return { ok: false, reason: 'Chỉ START khi đang IDLE' };
      if (this.droneStatus !== 'AVAILABLE') return { ok: false, reason: 'UAV không AVAILABLE' };
      const error = checkMissionConfig(this.cfg, this.p);
      if (error) { this.lastError = error; return { ok: false, reason: error }; }
      this.droneStatus = 'BUSY';
      this.missionStatus = 'IN_PROGRESS';
      this.orderStatus = 'ASSIGNED';
      this.change('PRE_FLIGHT_CHECK', 'Kiểm tra trước bay đã đạt');
      return { ok: true };
    }
    if (cmd === 'PAUSE') {
      if (this.flightState !== 'EN_ROUTE') return { ok: false, reason: 'Chỉ PAUSE khi EN_ROUTE' };
      this.speedMps = 0;
      this.change('PAUSED', 'Tạm dừng bay ngang');
      return { ok: true };
    }
    if (cmd === 'RESUME') {
      if (this.flightState !== 'PAUSED') return { ok: false, reason: 'Chỉ RESUME khi PAUSED' };
      if (this.batteryPct < estimateDirectReturnEnergyPct(this.position, this.cfg.home, this.p) + this.p.batteryReservePct) {
        return { ok: false, reason: 'Pin không còn đủ điều kiện RESUME' };
      }
      this.change('EN_ROUTE', 'Tiếp tục từ vị trí đã tạm dừng');
      return { ok: true };
    }
    if (cmd === 'RETURN_HOME') {
      if (!['EN_ROUTE', 'PAUSED', 'WAITING_FOR_HANDOVER'].includes(this.flightState)) return { ok: false, reason: 'Không thể RETURN_HOME ở trạng thái này' };
      if (this.orderStatus !== 'DELIVERED') this.orderStatus = 'DELIVERY_FAILED';
      return this.startReturn(false, 'Người dùng yêu cầu quay về sớm');
    }
    if (cmd === 'CONFIRM_HANDOVER') {
      if (this.flightState !== 'WAITING_FOR_HANDOVER') return { ok: false, reason: 'Chưa ở điểm bàn giao' };
      if (typeof options.success !== 'boolean') return { ok: false, reason: 'Phải chỉ định success=true hoặc false' };
      this.orderStatus = options.success ? 'DELIVERED' : 'DELIVERY_FAILED';
      if (options.success) this.cargoOnBoard = false;
      return this.startReturn(true, options.success ? 'Bàn giao thành công' : 'Bàn giao thất bại');
    }
    return { ok: false, reason: `Lệnh không hỗ trợ: ${cmd}` };
  }

  private updateHorizontal(target: GeoPoint, dt: number): boolean {
    const to = { ...target, altitudeM: this.p.cruiseAltitudeM };
    const next = moveToward(this.position, to, this.p.speedMps, dt);
    this.position = { ...next.position, altitudeM: this.position.altitudeM };
    this.speedMps = next.movedM / dt;
    this.distanceTravelledM += next.movedM;
    return next.arrived;
  }

  private updateAltitude(toAltitude: number, dt: number): boolean {
    const delta = toAltitude - this.position.altitudeM;
    const step = this.p.climbSpeedMps * dt;
    if (Math.abs(delta) <= step) {
      this.position.altitudeM = toAltitude;
      this.speedMps = 0;
      return true;
    }
    this.position.altitudeM += Math.sign(delta) * step;
    this.speedMps = 0;
    return false;
  }

  private safetyCheck(): void {
    if (!['TAKEOFF', 'EN_ROUTE', 'PAUSED', 'LANDING', 'RETURNING'].includes(this.flightState)) return;
    if (this.batteryPct <= 0) { this.fail('Mô phỏng cạn pin; không có kịch bản hạ cánh an toàn'); return; }
    const minReturnEnergy = estimateDirectReturnEnergyPct(this.position, this.cfg.home, this.p);
    if (this.flightState === 'RETURNING') {
      if (this.batteryPct < minReturnEnergy) this.fail('Pin không đủ để về trạm trong mô hình');
      return;
    }
    if (this.batteryPct < minReturnEnergy + this.p.batteryReservePct && ['EN_ROUTE', 'PAUSED'].includes(this.flightState)) {
      this.startReturn(false, 'Safety Manager: cần bảo toàn pin dự phòng');
    }
  }

  private step(dt: number): void {
    if (['IDLE', 'COMPLETED', 'FAILED'].includes(this.flightState)) return;
    this.simTimeSec += dt;
    this.speedMps = 0;

    if (this.flightState === 'PRE_FLIGHT_CHECK') {
      this.change('TAKEOFF', 'Bắt đầu cất cánh');
    } else if (this.flightState === 'TAKEOFF') {
      if (this.updateAltitude(this.p.cruiseAltitudeM, dt)) this.change('EN_ROUTE', 'Đạt cao độ hành trình');
    } else if (this.flightState === 'EN_ROUTE') {
      const target = this.cfg.waypoints[this.waypointIndex]?.position ?? this.cfg.delivery;
      if (this.updateHorizontal(target, dt)) {
        if (this.waypointIndex < this.cfg.waypoints.length) this.waypointIndex++;
        else this.change('LANDING', 'Đã tới điểm giao hàng');
      }
    } else if (this.flightState === 'LANDING') {
      if (this.updateAltitude(this.cfg.delivery.altitudeM, dt)) {
        this.change('WAITING_FOR_HANDOVER', 'Đã hạ cánh, chờ xác nhận');
        this.waitSec = 0;
      }
    } else if (this.flightState === 'PAUSED') {
      // Giữ vị trí, vẫn tiêu hao năng lượng.
    } else if (this.flightState === 'WAITING_FOR_HANDOVER') {
      this.waitSec += dt;
      if (this.waitSec >= this.p.handoverTimeoutSec) {
        this.orderStatus = 'DELIVERY_FAILED';
        this.startReturn(true, 'Hết thời gian bàn giao');
      }
    } else if (this.flightState === 'RETURNING') {
      if (this.returnPhase === 'CLIMB') {
        if (this.updateAltitude(this.p.cruiseAltitudeM, dt)) this.returnPhase = 'CRUISE';
      } else if (this.returnPhase === 'CRUISE') {
        const target = this.returnTargets[this.returnIndex]?.position;
        if (!target) {
          this.returnPhase = 'DESCEND';
        } else if (this.updateHorizontal(target, dt)) {
          this.returnIndex++;
          if (this.returnIndex >= this.returnTargets.length) this.returnPhase = 'DESCEND';
        }
      } else if (this.updateAltitude(this.cfg.home.altitudeM, dt)) {
        this.speedMps = 0;
        this.droneStatus = 'AVAILABLE';
        this.missionStatus = 'COMPLETED';
        this.change('COMPLETED', 'Đã về trạm và hạ cánh');
      }
    }

    const rate = this.flightState === 'PAUSED' ? this.p.hoverDrainPctPerSec
      : this.flightState === 'WAITING_FOR_HANDOVER' ? this.p.groundDrainPctPerSec
      : this.p.flightDrainPctPerSec;
    this.batteryPct = Math.max(0, this.batteryPct - rate * dt);
    this.safetyCheck();
  }

  /** dt là số giây thời gian mô phỏng, có thể gọi từ Node hoặc browser. */
  tick(dtSec: number): SimulationSnapshot {
    if (!Number.isFinite(dtSec) || dtSec < 0 || dtSec > 3600) throw new RangeError('dtSec phải hữu hạn trong [0, 3600]');
    let remaining = dtSec;
    while (remaining > 1e-10) {
      const delta = Math.min(STEP_SEC, remaining);
      this.step(delta);
      remaining -= delta;
      if (['IDLE', 'COMPLETED', 'FAILED'].includes(this.flightState)) break;
    }
    return this.snapshot();
  }

  snapshot(): SimulationSnapshot {
    const targetId = this.flightState === 'EN_ROUTE'
      ? this.cfg.waypoints[this.waypointIndex]?.id ?? 'delivery'
      : this.flightState === 'RETURNING' ? this.returnTargets[this.returnIndex]?.id ?? 'home'
        : null;
    return {
      droneId: this.cfg.droneId, missionId: this.cfg.missionId, orderId: this.cfg.orderId,
      position: { ...this.position }, flightState: this.flightState,
      missionStatus: this.missionStatus, orderStatus: this.orderStatus,
      droneStatus: this.droneStatus, batteryPct: Number(this.batteryPct.toFixed(5)),
      speedMps: Number(this.speedMps.toFixed(5)), simTimeSec: Number(this.simTimeSec.toFixed(6)),
      waypointIndex: this.waypointIndex, targetId,
      distanceTravelledM: Number(this.distanceTravelledM.toFixed(5)),
      cargoOnBoard: this.cargoOnBoard, lastError: this.lastError, events: [...this.events],
    };
  }
}
