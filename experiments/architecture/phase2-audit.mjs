// Read-only audit: run from repo root, or pass repo root as first argument.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(process.argv.slice(2).find(x=>!x.startsWith('--'))||'.');
const live=process.argv.includes('--live');
const rows=[];
const add=(status,name,detail='')=>{rows.push({status,name});console.log(`${status.padEnd(9)} ${name}${detail?' — '+detail:''}`)};
const exists=f=>fs.existsSync(path.join(root,f));
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const parse=f=>JSON.parse(read(f).replace(/^\uFEFF/,''));
function check(name,fn){try{add(fn()?'PASS':'FAIL',name)}catch{add('FAIL',name,'missing or invalid input')}}
const required=[
'apps/client/package.json','apps/client/index.html','apps/client/tsconfig.json','apps/client/vite.config.ts','apps/client/src/main.tsx','apps/client/src/App.tsx','apps/client/src/styles.css','apps/client/src/styles-day3.css','apps/client/src/data/demo.ts','apps/client/src/data/flightConfigs.ts','apps/client/src/types/domain.ts','apps/client/src/map/CesiumMap.tsx','apps/client/src/device/DevicePanel.tsx','apps/client/src/device/device-panel.css','apps/client/src/device/useSyncedFlight.ts',
...['package.json','tsconfig.json','src/index.ts','src/engine.ts','src/types.ts','src/navigation.ts','src/battery.ts','src/params.ts','src/demo-data.ts','tests/engine.test.ts','scripts/demo.ts'].map(f=>'packages/simulation-core/'+f),
...['package.json','src/server.js','src/db.js','src/mqtt-bridge.js','src/device-state.js','src/flight-sync.js','tests/api-smoke.test.js','tests/socket-smoke.js','tests/mission-flow.ps1','tests/device-state.test.cjs','tests/flight-sync.test.cjs'].map(f=>'experiments/database-api/'+f),
...['diagram.json','sketch.ino','libraries.txt','mqtt_config.example.h'].map(f=>'experiments/embedded-wokwi/synchronized-uav/'+f),
...['device-command','device-telemetry','device-ack'].map(f=>'contracts/'+f+'.v2.schema.json'),
'experiments/mqtt-spike/.env.example','docs/04-database-api/schema.sql','docs/04-database-api/seed.sql'];
console.log('PHASE 2 AUDIT (read-only)\nRoot: '+root+'\n');
for(const f of required)check('file '+f,()=>exists(f)&&fs.statSync(path.join(root,f)).isFile());
check('App uses server snapshot and sync command',()=>{const s=read('apps/client/src/App.tsx');return /useSyncedFlight\s*\(/.test(s)&&s.includes('sync.data.flight')&&s.includes('sync.send(')&&s.includes('UAV-01 SYNC')});
check('Backend calls attachMqttBridge',()=>/attachMqttBridge\s*\(\s*app\s*,\s*io\s*\)/.test(read('experiments/database-api/src/server.js')));
check('Socket origin 127.0.0.1:5173',()=>read('experiments/database-api/src/server.js').includes('http://127.0.0.1:5173'));
check('Bridge has flight route and TLS',()=>{const s=read('experiments/database-api/src/mqtt-bridge.js');return s.includes('/api/devices/uav-01/flight')&&s.includes('mqtts://')&&/rejectUnauthorized\s*:\s*true/.test(s)});
check('Core built dist/src/index.js',()=>exists('packages/simulation-core/dist/src/index.js'));
check('Client socket.io-client declared',()=>!!parse('apps/client/package.json').dependencies?.['socket.io-client']);
check('Backend mqtt declared',()=>!!parse('experiments/database-api/package.json').dependencies?.mqtt);
for(const f of required.filter(f=>f.endsWith('.schema.json')))check('JSON '+f,()=>!!parse(f));
check('Wokwi diagram: expected ESP32 connections',()=>{const d=parse('experiments/embedded-wokwi/synchronized-uav/diagram.json');const ids=new Set(d.parts.map(p=>p.id));return ids.size===d.parts.length&&d.connections.every(c=>Array.isArray(c)&&c.length===4&&[c[0],c[1]].every(p=>ids.has(p.split(':')[0])))&&['D21','D22','D34','D18','D23','D5','D19','D25','D26','D27','D14'].every(p=>d.connections.some(c=>c[0]==='esp:'+p||c[1]==='esp:'+p))&&!d.connections.some(c=>c.slice(0,2).some(p=>/^esp:\d+$/.test(p)))});
for(const f of ['experiments/database-api/.env','experiments/mqtt-spike/.env'])add(exists(f)?'PASS':'BLOCKED','local config '+f,'existence only; values not read');
const git=args=>spawnSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true});
if(git(['rev-parse','--is-inside-work-tree']).status!==0)add('BLOCKED','Git checks','not a Git worktree');else{
 const isSensitive=f=>/(^|\/)(\.env(\..+)?|mqtt_config\.h|\.local-backups|node_modules)(\/|$)/i.test(f)&&!/(^|\/)\.env\.example$/i.test(f);
 const tracked=git(['ls-files','-z']);const untracked=git(['ls-files','--others','--exclude-standard','-z']);
 if(tracked.status!==0||untracked.status!==0)add('BLOCKED','Git tracked/unignored file check');else{
  const risky=[...new Set((tracked.stdout+untracked.stdout).split('\0').filter(isSensitive))];
  add(risky.length?'FAIL':'PASS','Git secret/generated path check',risky.length?risky.join(', '):'path names only; not a full secret scan');
 }
 for(const f of ['experiments/database-api/.env','experiments/mqtt-spike/.env','experiments/embedded-wokwi/synchronized-uav/mqtt_config.h','.local-backups/check.txt'])add(git(['check-ignore','--no-index','-q','--',f]).status===0?'PASS':'FAIL','ignored '+f);
}
if(live){
 const base='http://127.0.0.1:3000';
 async function get(p,headers={}){const r=await fetch(base+p,{headers,signal:AbortSignal.timeout(5000)});return {status:r.status,data:await r.json()};}
 try{const r=await get('/health');add(r.status===200&&r.data.ok===true&&r.data.database===true?'PASS':'FAIL','live health / PostgreSQL');}catch{add('BLOCKED','live health','Backend unreachable or invalid response')}
 try{const r=await get('/api/devices/uav-01/flight');add(r.status===200&&r.data.flight?.droneId==='uav-01'&&typeof r.data.syncStatus==='string'?'PASS':'FAIL','live flight snapshot');}catch{add('BLOCKED','live flight snapshot')}
 try{const r=await get('/api/devices/uav-01',{Origin:'http://example.invalid'});add(r.status===403?'PASS':'FAIL','live disallowed origin rejected','CORS check only; not authentication');}catch{add('BLOCKED','live origin test')}
 try{const a=await get('/api/devices/uav-01');await new Promise(r=>setTimeout(r,4000));const b=await get('/api/devices/uav-01');const x=a.data.telemetry,y=b.data.telemetry;const good=b.status===200&&b.data.brokerReady===true&&b.data.status==='ONLINE'&&y?.schemaVersion===2&&y.imuReady===true&&x?.bootId===y.bootId&&y.seq>x.seq;add(good?'PASS':'BLOCKED','live Wokwi telemetry v2 advancing','requires running Wokwi; retry if simulator slow or restarted');}catch{add('BLOCKED','live Wokwi telemetry')}
}else add('NOT RUN','live API and telemetry','rerun with --live while Backend and Wokwi run');
const counts=Object.fromEntries(['PASS','FAIL','BLOCKED','NOT RUN'].map(k=>[k,rows.filter(x=>x.status===k).length]));
console.log('\nSUMMARY '+JSON.stringify(counts));console.log('Audit checks only. No unit tests, builds, flight commands, or DB writes performed. Final GO requires manual evidence.');
process.exitCode=counts.FAIL?1:counts.BLOCKED?2:0;
