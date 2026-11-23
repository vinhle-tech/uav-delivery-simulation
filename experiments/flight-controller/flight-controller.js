// Bộ điều khiển UAV ảo - ví dụ GIÁO DỤC, không phải flight controller thật.
// Chạy trên Node.js, không phụ thuộc CesiumJS, Backend hay phần cứng.

const C = Object.freeze({
  dt: 0.1,                // bước thời gian mô phỏng (s)
  speed: 6,              // vận tốc ngang tối đa (m/s)
  climbSpeed: 3,         // tốc độ tăng/giảm độ cao (m/s)
  cruiseAltitude: 30,    // độ cao hành trình (m)
  payloadLimitKg: 1.5,
  flightDrain: 0.08,     // điểm % pin mỗi giây khi bay
  hoverDrain: 0.05,      // điểm % pin mỗi giây khi PAUSED
  groundDrain: 0.002,   // điểm % pin mỗi giây khi đã hạ cánh
  batteryReserve: 30,    // mức pin dự phòng mục tiêu khi lập kế hoạch
  batteryWarning: 20,    // cảnh báo pin yếu
  batteryCritical: 10,   // pin nguy cấp
  landingBudget: 1.5,    // năng lượng dự phòng để hạ cánh (% điểm)
  handoverTimeout: 60    // giây mô phỏng
});

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function movedToward(from, to, maxStep) {
  const d = dist(from, to);
  if (d <= maxStep || d === 0) return { x: to.x, y: to.y, speed: d / C.dt };
  const factor = maxStep / d;
  return {
    x: from.x + (to.x - from.x) * factor,
    y: from.y + (to.y - from.y) * factor,
    speed: maxStep / C.dt
  };
}

class VirtualFlightController {
  constructor({ battery = 90, payloadKg = 0.8 } = {}) {
    this.home = { x: 0, y: 0 };
    this.delivery = { x: 120, y: 0 };
    this.waypoints = [
      { x: 40, y: 0 }, { x: 80, y: 0 }, { ...this.delivery }
    ];
    this.safeSites = [{ x: 70, y: 0 }, { x: 110, y: 0 }];
    this.position = { x: 0, y: 0, z: 0 };
    this.state = 'IDLE';           // Flight Controller state
    this.mission = 'READY';        // Mission status
    this.order = 'ASSIGNED';       // Order status
    this.drone = 'AVAILABLE';      // Drone availability
    this.battery = battery;
    this.payloadKg = payloadKg;
    this.cargoOnBoard = true;
    this.waypointIndex = 0;
    this.pausedFrom = null;
    this.emergencyTarget = null;
    this.returnPhase = null;
    this.speedNow = 0;
    this.previousSpeed = 0;
    this.lastAccel = 0;
    this.seconds = 0;
    this.waitSeconds = 0;
    this.warned = false;
    this.events = [];
    this.randomSeed = 12345;
  }

  log(message) {
    this.events.push(`[t=${this.seconds.toFixed(1)}s] ${message}`);
  }

  change(next, reason) {
    if (this.state !== next) {
      this.log(`${this.state} -> ${next}${reason ? ': ' + reason : ''}`);
      this.state = next;
    }
  }

  // Ước tính giản lược, không phải mô hình năng lượng UAV thực.
  estimateFullMissionEnergy() {
    const points = [this.home, ...this.waypoints, this.home];
    let horizontal = 0;
    for (let i = 1; i < points.length; i++) {
      horizontal += dist(points[i - 1], points[i]);
    }
    const verticalTime = (4 * C.cruiseAltitude) / C.climbSpeed;
    return (horizontal / C.speed + verticalTime) * C.flightDrain + C.landingBudget;
  }

  preflight() {
    if (!(this.payloadKg > 0 && this.payloadKg <= C.payloadLimitKg)) {
      return 'Quá tải hoặc khối lượng hàng không hợp lệ';
    }
    const needed = this.estimateFullMissionEnergy() + C.batteryReserve;
    if (this.battery < needed) {
      return `Pin ${this.battery.toFixed(1)}% thấp hơn yêu cầu ${needed.toFixed(1)}%`;
    }
    // TODO giai đoạn sau: kiểm tra geofence, GPS, vùng cấm, khoang hàng.
    return null;
  }

  // Năng lượng ước tính để đi trực tiếp đến một điểm an toàn rồi hạ cánh.
  energyToLand(target) {
    const horizontalTime = dist(this.position, target) / C.speed;
    const climbTime = Math.max(0, C.cruiseAltitude - this.position.z) / C.climbSpeed;
    const descendTime = C.cruiseAltitude / C.climbSpeed;
    return (horizontalTime + climbTime + descendTime) * C.flightDrain + C.landingBudget;
  }

  startReturn(reason) {
    if (this.battery < this.energyToLand(this.home)) {
      return this.selectEmergencyLanding(reason + ' (không đủ pin về trạm)');
    }
    if (this.order !== 'DELIVERED') this.order = 'DELIVERY_FAILED';
    this.mission = 'RETURNING';
    this.returnPhase = 'CLIMB';
    this.drone = 'BUSY';
    this.change('RETURNING', reason);
    return { ok: true };
  }

  selectEmergencyLanding(reason) {
    const eligible = this.safeSites
      .map(site => ({ site, energy: this.energyToLand(site) }))
      .filter(v => v.energy <= this.battery)
      .sort((a, b) => a.energy - b.energy);
    if (eligible.length) {
      this.emergencyTarget = eligible[0].site;
      this.drone = 'BUSY';
      if (this.order !== 'DELIVERED') this.order = 'DELIVERY_FAILED';
      this.change('EMERGENCY_LANDING', reason);
      return { ok: true, emergency: true };
    }
    this.mission = 'FAILED';
    this.drone = 'MAINTENANCE';
    if (this.order !== 'DELIVERED') this.order = 'DELIVERY_FAILED';
    this.change('FAILED', reason + ' - mô hình không tìm được điểm hạ cánh khả thi');
    return { ok: false, reason: 'Không có phương án hạ cánh khả thi trong mô hình' };
  }

  command(type, options = {}) {
    if (type === 'START') {
      if (this.state !== 'IDLE') return { ok: false, reason: 'Mission không ở IDLE' };
      this.change('PRE_FLIGHT_CHECK', 'Nhận lệnh START');
      return { ok: true };
    }
    if (type === 'PAUSE') {
      if (this.state !== 'EN_ROUTE') return { ok: false, reason: 'Chỉ Pause khi EN_ROUTE' };
      this.pausedFrom = this.state;
      this.change('PAUSED', 'Nhận lệnh PAUSE');
      return { ok: true };
    }
    if (type === 'RESUME') {
      if (this.state !== 'PAUSED') return { ok: false, reason: 'Mission không PAUSED' };
      if (this.battery <= C.batteryCritical) {
        return { ok: false, reason: 'Pin nguy cấp, không được RESUME' };
      }
      this.change(this.pausedFrom, 'Nhận lệnh RESUME');
      return { ok: true };
    }
    if (type === 'RETURN_HOME' || type === 'ABORT') {
      if (!['EN_ROUTE', 'PAUSED', 'WAITING_FOR_HANDOVER'].includes(this.state)) {
        return { ok: false, reason: 'Không thể Return Home ở trạng thái hiện tại' };
      }
      return this.startReturn(`Nhận lệnh ${type}`);
    }
    if (type === 'CONFIRM_HANDOVER') {
      if (this.state !== 'WAITING_FOR_HANDOVER') {
        return { ok: false, reason: 'Chưa tới giai đoạn bàn giao' };
      }
      const success = options.success === true;
      this.order = success ? 'DELIVERED' : 'DELIVERY_FAILED';
      if (success) this.cargoOnBoard = false;
      this.log(success ? 'Giao hàng thành công' : 'Giao hàng thất bại');
      return this.startReturn('Đã chốt kết quả bàn giao');
    }
    return { ok: false, reason: `Lệnh không được hỗ trợ: ${type}` };
  }

  // Chuyển động ngang có giới hạn bước; điểm đích không bị bay vượt qua.
  flyToward(target) {
    const next = movedToward(this.position, target, C.speed * C.dt);
    this.position.x = next.x;
    this.position.y = next.y;
    this.speedNow = next.speed;
    return dist(this.position, target) < 1e-8;
  }

  safetyTick() {
    if (!['TAKEOFF','EN_ROUTE','PAUSED','RETURNING'].includes(this.state)) return;
    if (!this.warned && this.battery <= C.batteryWarning) {
      this.warned = true;
      this.log(`Cảnh báo pin thấp: ${this.battery.toFixed(2)}%`);
    }
    if (this.battery <= C.batteryCritical) {
      if (this.state === 'RETURNING' && this.battery >= this.energyToLand(this.home)) return;
      if (this.state === 'RETURNING') {
        this.selectEmergencyLanding('Pin nguy cấp khi đang RETURNING');
      } else {
        this.startReturn('Safety Manager: pin nguy cấp');
      }
    }
  }

  tick() {
    if (['COMPLETED','FAILED'].includes(this.state)) return;
    this.seconds += C.dt;
    this.previousSpeed = this.speedNow;
    this.speedNow = 0;
    const flying = !['IDLE','PRE_FLIGHT_CHECK','WAITING_FOR_HANDOVER'].includes(this.state);
    const rate = this.state === 'PAUSED' ? C.hoverDrain
      : flying ? C.flightDrain : C.groundDrain;
    this.battery = Math.max(0, this.battery - rate * C.dt);

    if (this.battery === 0) {
      this.mission = 'FAILED';
      this.drone = 'MAINTENANCE';
      if (this.order !== 'DELIVERED') this.order = 'DELIVERY_FAILED';
      this.change('FAILED', 'Cạn pin, không thể tiếp tục mô phỏng');
      return;
    }
    this.safetyTick();
    if (['FAILED','EMERGENCY_LANDING'].includes(this.state)) {
      if (this.state === 'EMERGENCY_LANDING') this.tickEmergencyLanding();
      return;
    }

    switch (this.state) {
      case 'PRE_FLIGHT_CHECK': {
        const error = this.preflight();
        if (error) {
          this.mission = 'FAILED';
          this.change('FAILED', 'Pre-flight thất bại: ' + error);
        } else {
          this.mission = 'IN_PROGRESS';
          this.drone = 'BUSY';
          this.change('TAKEOFF', 'Pre-flight hợp lệ');
        }
        break;
      }
      case 'TAKEOFF':
        this.position.z = Math.min(C.cruiseAltitude, this.position.z + C.climbSpeed * C.dt);
        if (this.position.z >= C.cruiseAltitude) this.change('EN_ROUTE', 'Đạt độ cao hành trình');
        break;
      case 'EN_ROUTE': {
        const target = this.waypoints[this.waypointIndex];
        if (this.flyToward(target)) {
          this.waypointIndex++;
          this.log(`Đạt waypoint ${this.waypointIndex}/${this.waypoints.length}`);
          if (this.waypointIndex === this.waypoints.length) this.change('APPROACH', 'Đến điểm giao');
        }
        break;
      }
      case 'APPROACH':
        this.change('LANDING', 'Cho phép hạ cánh theo mô hình');
        break;
      case 'LANDING':
        this.position.z = Math.max(0, this.position.z - C.climbSpeed * C.dt);
        if (this.position.z === 0) {
          this.waitSeconds = 0;
          this.change('WAITING_FOR_HANDOVER', 'Đã hạ cánh tại điểm giao');
        }
        break;
      case 'WAITING_FOR_HANDOVER':
        this.waitSeconds += C.dt;
        if (this.waitSeconds >= C.handoverTimeout) {
          this.order = 'DELIVERY_FAILED';
          this.log('Hết thời gian chờ xác nhận');
          this.startReturn('Timeout bàn giao');
        }
        break;
      case 'PAUSED':
        // Giữ nguyên vị trí/độ cao nhưng vẫn tiêu hao pin.
        break;
      case 'RETURNING':
        if (this.returnPhase === 'CLIMB') {
          this.position.z = Math.min(C.cruiseAltitude, this.position.z + C.climbSpeed * C.dt);
          if (this.position.z >= C.cruiseAltitude) this.returnPhase = 'TRAVEL';
        } else if (this.returnPhase === 'TRAVEL') {
          if (dist(this.position, this.home) > 1e-8) this.flyToward(this.home);
          else this.returnPhase = 'DESCEND';
        } else if (this.returnPhase === 'DESCEND') {
          this.position.z = Math.max(0, this.position.z - C.climbSpeed * C.dt);
          if (this.position.z === 0) {
            this.mission = 'COMPLETED';
            this.drone = 'AVAILABLE';
            this.change('COMPLETED', 'Đã về trạm và hạ cánh');
          }
        }
        break;
    }
    this.lastAccel = (this.speedNow - this.previousSpeed) / C.dt;
  }

  tickEmergencyLanding() {
    // Chỉ là chính sách hạ cánh tại điểm đã khai báo; không mô phỏng vật lý thực.
    if (dist(this.position, this.emergencyTarget) > 1e-8) {
      this.flyToward(this.emergencyTarget);
    } else {
      this.position.z = Math.max(0, this.position.z - C.climbSpeed * C.dt);
      if (this.position.z === 0) {
        this.mission = 'FAILED';
        this.drone = 'MAINTENANCE';
        this.change('FAILED', 'Đã hạ cánh dự phòng, Mission thất bại');
      }
    }
  }

  // Bộ sinh nhiễu cố định seed để kiểm thử cho kết quả có thể lặp lại.
  noise() {
    this.randomSeed = (1664525 * this.randomSeed + 1013904223) >>> 0;
    return (this.randomSeed / 2 ** 32 - 0.5) * 2;
  }

  telemetry() {
    return {
      simTimeSec: +this.seconds.toFixed(1),
      flightState: this.state,
      missionStatus: this.mission,
      orderStatus: this.order,
      truePosition: { ...this.position },
      gpsMeasuredX: +(this.position.x + this.noise()).toFixed(2),
      gpsMeasuredY: +(this.position.y + this.noise()).toFixed(2),
      altimeterM: +(this.position.z + this.noise() * 0.2).toFixed(2),
      speedMps: +this.speedNow.toFixed(2),
      imuApproxAccelMps2: +this.lastAccel.toFixed(2),
      batteryPct: +this.battery.toFixed(2)
    };
  }
}

module.exports = { VirtualFlightController, C, dist };
