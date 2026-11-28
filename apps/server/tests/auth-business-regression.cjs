'use strict';
// Local test database only. Do not run alongside a flight or another test run.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { io } = require('socket.io-client');
const config = require('../src/config/env');
const { pool, assertTestDb } = require('../src/db');
const base = 'http://127.0.0.1:3000';
const email = process.env.AUTH_TEST_EMAIL;
const password = process.env.AUTH_TEST_PASSWORD;
const run = 'qa-' + randomUUID();
const point = run + '-point';
const drones = ['ok', 'low', 'busy'].map(s => run + '-' + s);
let session, socket, fixtures = false, count = 0;
async function req(method, path, body, token) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = 'Bearer ' + token;
  const r = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(10000) });
  const raw = await r.text();
  let data; try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }
  return { status: r.status, data };
}
function expect(r, status, code) {
  assert.equal(r.status, status, `Expected HTTP ${status}, got ${r.status}`);
  if (code) assert.equal(r.data?.error?.code, code, 'Unexpected error code');
  return r.data;
}
const api = (m,p,b) => req(m,p,b,session.accessToken);
const pass = label => { count++; console.log(`PASS ${count}: ${label}`); };
async function transaction(fn) {
  const db = await pool.connect();
  try { await db.query('BEGIN'); await fn(db); await db.query('COMMIT'); }
  catch (e) { await db.query('ROLLBACK'); throw e; }
  finally { db.release(); }
}
async function setup() {
  await transaction(async db => {
    await db.query('INSERT INTO delivery_points(id,name,latitude,longitude) VALUES($1,$2,21.03,105.86)', [point,'Temporary regression point']);
    for (let i=0;i<drones.length;i++) await db.query('INSERT INTO drones(id,model_id,station_id,battery_pct,status) VALUES($1,$2,$3,$4,$5)', [drones[i],'model-q1','station-01',i===1?35:90,i===2?'BUSY':'AVAILABLE']);
  });
  fixtures=true;
}
async function cleanup() {
  if (!fixtures) return;
  // Exact random fixture point and drone IDs only. No deletion of existing orders or UAVs.
  await transaction(async db => {
    await db.query('DELETE FROM missions WHERE drone_id=ANY($1::text[]) AND order_id IN (SELECT id FROM orders WHERE delivery_point_id=$2)', [drones,point]);
    await db.query('DELETE FROM orders WHERE delivery_point_id=$1',[point]);
    await db.query('DELETE FROM drones WHERE id=ANY($1::text[])',[drones]);
    await db.query('DELETE FROM delivery_points WHERE id=$1',[point]);
  });
  fixtures=false;
}
function connect() {
  return new Promise((resolve,reject)=>{
    socket=io(base,{autoConnect:false,reconnection:false,timeout:4000,auth:{token:session.accessToken}});
    const timer=setTimeout(()=>finish(Error('Socket hello timeout')),7000);
    function finish(err){clearTimeout(timer);socket.off('connect_error',onError);socket.off('server:hello',onHello);err?reject(err):resolve();}
    function onError(){finish(Error('Socket authentication failed'));}
    function onHello(d){finish(d?.demoOnly===true?undefined:Error('Unexpected hello'));}
    socket.on('connect_error',onError);socket.on('server:hello',onHello);socket.connect();
  });
}
async function missionEvent(action, predicate) {
  let timer, handler;
  const event = new Promise((resolve,reject)=>{
    timer=setTimeout(()=>reject(Error('mission:updated timeout')),8000);
    handler=d=>{if(predicate(d))resolve(d);};socket.on('mission:updated',handler);
  });
  // Register a rejection handler immediately; HTTP may fail before event arrives.
  event.catch(()=>{});
  try { const result=await action(); await event; return result; }
  finally {clearTimeout(timer);socket.off('mission:updated',handler);}
}
async function main(){
  assert.equal(email,'operator@example.invalid','Use OPERATOR for this suite');
  assert.ok(password,'Missing test password');
  assert.equal(config.port,3000,'Expected port 3000');
  assert.equal(config.mqttEnabled,false,'Stop backend, set MQTT_ENABLED=false, restart before running');
  await assertTestDb();
  const health=expect(await req('GET','/health'),200);
  assert.equal(health.backend,'phase3-server');assert.equal(health.databaseName,'uav_delivery_phase3_test');assert.equal(health.database,true);
  expect(await req('GET','/api/drones'),401);
  session=expect(await req('POST','/api/auth/login',{email,password}),200);assert.equal(session.user.role,'OPERATOR');pass('health, authentication and isolated database');
  await setup();console.log('Fixture run: '+run);
  const list=expect(await api('GET','/api/drones'),200);assert.ok(drones.every(id=>list.some(d=>d.id===id)),'Backend must use the same local database');
  assert.ok(Array.isArray(expect(await api('GET','/api/orders'),200)));assert.ok(Array.isArray(expect(await api('GET','/api/missions'),200)));pass('authenticated reads');
  expect(await api('POST','/api/orders',{deliveryPointId:point,weightKg:-1}),400,'INVALID_INPUT');
  expect(await api('POST','/api/orders',{deliveryPointId:run+'-missing',weightKg:0.8}),404,'POINT_NOT_FOUND');pass('invalid order inputs');
  async function order(weight){const o=expect(await api('POST','/api/orders',{deliveryPointId:point,weightKg:weight}),201);assert.equal(o.delivery_point_id,point);assert.equal(o.status,'PENDING');return o;}
  const good=await order(0.8),heavy=await order(2),extra=await order(0.6);pass('create orders');
  const create=(o,d)=>api('POST','/api/missions',{orderId:o,droneId:d});
  expect(await create(heavy.id,drones[0]),422,'OVERWEIGHT');pass('overweight rejected');
  expect(await create(good.id,drones[1]),422,'INSUFFICIENT_BATTERY');pass('low battery rejected');
  expect(await create(good.id,drones[2]),409,'DRONE_BUSY');pass('busy drone rejected');
  await connect();
  let mission=await missionEvent(async()=>expect(await create(good.id,drones[0]),201),d=>d?.order_id===good.id&&d?.status==='READY');
  assert.equal(mission.status,'READY');assert.equal(mission.version,0);pass('mission created and authenticated socket receives event');
  expect(await create(good.id,drones[0]),409,'ORDER_BUSY');expect(await create(extra.id,drones[0]),409,'DRONE_BUSY');pass('duplicate assignment rejected');
  const transition=(action,v)=>api('POST',`/api/missions/${mission.id}/${action}`,{expectedVersion:v});
  expect(await transition('pause',0),409,'INVALID_STATE');expect(await transition('start',99),409,'VERSION_CONFLICT');pass('invalid transition and stale version rejected');
  for(const [action,state] of [['start','IN_PROGRESS'],['pause','PAUSED'],['resume','IN_PROGRESS'],['return-home','RETURNING'],['complete','COMPLETED']]){
    const v=mission.version; const id=mission.id;
    mission=await missionEvent(async()=>expect(await transition(action,v),200),d=>d?.id===id&&d?.version===v+1&&d?.status===state);
    assert.equal(mission.version,v+1);assert.equal(mission.status,state);console.log('  '+state+' v'+mission.version);
  }
  assert.equal(mission.version,5);pass('Mission Flow and realtime updates');
  const m=expect(await api('GET',`/api/missions/${mission.id}`),200);assert.equal(m.status,'COMPLETED');assert.equal(m.version,5);
  const result=await pool.query('SELECT m.status,m.version,d.status AS drone_status,o.status AS order_status FROM missions m JOIN drones d ON d.id=m.drone_id JOIN orders o ON o.id=m.order_id WHERE m.id=$1',[mission.id]);
  assert.deepEqual(result.rows[0],{status:'COMPLETED',version:5,drone_status:'AVAILABLE',order_status:'ASSIGNED'});pass('database persistence and drone release (legacy order state)');
}
(async()=>{
 let failed=false;
 try{await main();}catch(e){failed=true;console.error('REGRESSION FAIL after '+count+'/12: '+(e.name==='AssertionError'?'assertion failed (inspect last PASS)':e.code||e.message));}
 finally{
   socket?.disconnect();
   if(session?.refreshToken)try{expect(await req('POST','/api/auth/logout',{refreshToken:session.refreshToken}),204);}catch{failed=true;console.error('Session cleanup failed');}
   try{await cleanup();}catch(e){failed=true;console.error('Fixture cleanup failed; retain run ID for review: '+run);}
   await pool.end();
 }
 if(!failed&&count===12)console.log('AUTH BUSINESS REGRESSION PASS (12/12) — fixture cleanup complete');else process.exitCode=1;
})().catch(()=>{console.error('Regression cleanup failed');process.exitCode=1;});
