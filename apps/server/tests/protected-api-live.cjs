'use strict';
const assert=require('node:assert/strict');
const {io}=require('socket.io-client');
const base='http://127.0.0.1:3000';
const email=process.env.AUTH_TEST_EMAIL||'operator@example.invalid';
const password=process.env.AUTH_TEST_PASSWORD;
const role=email==='admin@example.invalid'?'ADMIN':'OPERATOR';
const origin='http://127.0.0.1:5173';
let session,second,active,other;
async function req(method,path,body,token,extra={}){
 const headers={...extra};if(body!==undefined)headers['Content-Type']='application/json';if(token)headers.Authorization='Bearer '+token;
 const res=await fetch(base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
 const raw=await res.text();let data;try{data=raw?JSON.parse(raw):null;}catch{data=null;}
 return {status:res.status,data,headers:res.headers};
}
function status(r,s){assert.equal(r.status,s,`Expected HTTP ${s}, got ${r.status}`);return r.data;}
function socket(token,wantSuccess){return new Promise((resolve,reject)=>{
 const s=io(base,{autoConnect:false,reconnection:false,timeout:4000,auth:token?{token}:{}});
 const timer=setTimeout(()=>finish(new Error('Socket timeout')),7000);
 function finish(err){clearTimeout(timer);s.off('connect_error',onError);s.off('server:hello',onHello);if(err||!wantSuccess)s.disconnect();err?reject(err):resolve(s);}
 function onError(e){if(!wantSuccess&&e.message==='UNAUTHORIZED')finish();else finish(new Error('Unexpected socket connection error'));}
 function onHello(d){if(wantSuccess&&d?.demoOnly===true)finish();else finish(new Error('Unexpected socket data'));}
 s.on('connect_error',onError);s.on('server:hello',onHello);s.connect();
 });}
function disconnected(s){return new Promise((resolve,reject)=>{if(!s.connected)return resolve();const timer=setTimeout(()=>{s.off('disconnect',done);reject(new Error('Revoked socket still connected'));},7000);function done(){clearTimeout(timer);resolve();}s.once('disconnect',done);});}
async function login(){const d=status(await req('POST','/api/auth/login',{email,password}),200);assert.equal(d.user.role,role);return d;}
async function main(){
 if(!password||!['admin@example.invalid','operator@example.invalid'].includes(email))throw Error('Set valid demo account privately');
 const h=status(await req('GET','/health'),200);assert.equal(h?.backend,'phase3-server');assert.equal(h?.databaseName,'uav_delivery_phase3_test');
 try{
 const endpoints=[['GET','/api/drones'],['GET','/api/orders'],['POST','/api/orders',{}],['GET','/api/missions'],['GET','/api/missions/not-real'],['POST','/api/missions',{}],['POST','/api/missions/not-real/start',{}],['GET','/api/devices/uav-01'],['GET','/api/devices/uav-01/flight'],['POST','/api/devices/uav-01/flight',{}],['POST','/api/devices/uav-01/commands',{}],['POST','/api/demo/telemetry',{}]];
 for(const [m,p,b] of endpoints){status(await req(m,p,b),401);status(await req(m,p,b,'invalid-token'),401);}console.log('PASS 1: all 12 protected routes reject missing and forged token');
 const pre=await req('OPTIONS','/api/orders',undefined,undefined,{Origin:origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'});status(pre,204);assert.match(pre.headers.get('access-control-allow-headers')||'',/authorization/i);assert.equal(pre.headers.get('access-control-allow-origin'),origin);status(await req('OPTIONS','/api/orders',undefined,undefined,{Origin:'https://untrusted.invalid'}),403);console.log('PASS 2: CORS preflight and origin policy');
 session=await login();const t=session.accessToken;
 for(const p of ['/api/drones','/api/orders','/api/missions'])assert.ok(Array.isArray(status(await req('GET',p,undefined,t),200)));
 const me=status(await req('GET','/api/auth/me',undefined,t),200);assert.equal(me.role,role);console.log('PASS 3: authenticated business reads and identity');
 status(await req('POST','/api/demo/telemetry',{},t),role==='ADMIN'?400:403);console.log('PASS 4: admin-only demo telemetry (no insert)');
 const device=await req('GET','/api/devices/uav-01',undefined,t);status(device,200);let flight;for(let i=0;i<20;i++){flight=await req('GET','/api/devices/uav-01/flight',undefined,t);if(flight.status!==503)break;await new Promise(r=>setTimeout(r,500));}status(flight,200);console.log('PASS 5: authenticated device and flight reads');
 await socket(undefined,false);await socket('invalid-token',false);active=await socket(t,true);console.log('PASS 6: Socket.IO rejects missing/forged token; valid token gets hello');
 second=await login();other=await socket(second.accessToken,true);
 status(await req('POST','/api/auth/logout',{refreshToken:session.refreshToken}),204);
 status(await req('GET','/api/orders',undefined,t),401);await disconnected(active);status(await req('GET','/api/orders',undefined,second.accessToken),200);assert.equal(other.connected,true);console.log('PASS 7: logout revokes HTTP and socket, second session remains valid');
 console.log('PROTECTED API LIVE PASS (7/7)');
 }finally{active?.disconnect();other?.disconnect();for(const s of [session,second])if(s?.refreshToken)try{await req('POST','/api/auth/logout',{refreshToken:s.refreshToken});}catch{console.error('Session cleanup request failed');}}
}
main().catch(e=>{console.error('PROTECTED API LIVE FAIL:',e.name==='AssertionError'?'assertion failed; inspect last PASS (no credentials logged)':e.message);process.exitCode=1;});
