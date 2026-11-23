const { VirtualFlightController, C } = require('./flight-controller');
const uav = new VirtualFlightController({ battery: 90, payloadKg: 0.8 });

function until(predicate, maxTicks = 4000) {
  for (let i = 0; i < maxTicks; i++) {
    if (predicate()) return;
    uav.tick();
    if (i % 100 === 0) {
      const t = uav.telemetry();
      console.log(`t=${t.simTimeSec}s | ${t.flightState} | x=${t.truePosition.x.toFixed(1)}m | ` +
        `z=${t.truePosition.z.toFixed(1)}m | pin=${t.batteryPct}%`);
    }
  }
  throw new Error('Không đạt trạng thái mục tiêu (có thể có lỗi logic).');
}

console.log('START:', uav.command('START'));
until(() => uav.state === 'EN_ROUTE');
until(() => uav.position.x >= 20);
console.log('PAUSE:', uav.command('PAUSE'));
for (let i = 0; i < 30; i++) uav.tick(); // 3 giây mô phỏng
console.log('KHI PAUSED:', uav.telemetry());
console.log('RESUME:', uav.command('RESUME'));
until(() => uav.state === 'WAITING_FOR_HANDOVER');
console.log('ORDER TRƯỚC XÁC NHẬN:', uav.order);
console.log('CONFIRM:', uav.command('CONFIRM_HANDOVER', { success: true }));
console.log('SAU XÁC NHẬN:', { order: uav.order, mission: uav.mission, state: uav.state });
until(() => uav.state === 'COMPLETED');
console.log('KẾT QUẢ CUỐI:', { order: uav.order, mission: uav.mission, drone: uav.drone });
console.log('\nNHẬT KÝ:');
for (const line of uav.events) console.log(line);
console.log(`\nSố bước mô phỏng xấp xỉ: ${(uav.seconds / C.dt).toFixed(0)}`);
