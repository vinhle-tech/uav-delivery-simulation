import { SimulationEngine } from '../src/engine.js';
import { demoMission } from '../src/demo-data.js';

const engine = new SimulationEngine(demoMission);
console.log('== UAV DELIVERY / DAY 2 / SIMULATION CORE ==');
console.log('START:', engine.command('START'));
let previous = '';
for (let i = 0; i < 10000; i++) {
  const s = engine.tick(0.5);
  if (s.flightState !== previous) {
    console.log(`[${s.simTimeSec.toFixed(1)}s] ${s.flightState} | Mission=${s.missionStatus} | Order=${s.orderStatus} | Pin=${s.batteryPct.toFixed(1)}%`);
    previous = s.flightState;
  }
  if (s.flightState === 'WAITING_FOR_HANDOVER') {
    console.log('CONFIRM_HANDOVER:', engine.command('CONFIRM_HANDOVER', { success: true }));
  }
  if (s.flightState === 'COMPLETED' || s.flightState === 'FAILED') break;
}
console.log('\nFINAL SNAPSHOT:');
console.log(JSON.stringify(engine.snapshot(), null, 2));
