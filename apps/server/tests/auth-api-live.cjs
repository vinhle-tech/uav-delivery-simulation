'use strict';
const assert=require('node:assert/strict');
const base='http://127.0.0.1:3000';
const email=process.env.AUTH_TEST_EMAIL||'operator@example.invalid';
const password=process.env.AUTH_TEST_PASSWORD;
const role=email==='admin@example.invalid'?'ADMIN':'OPERATOR';
let current,second;
async function req(method,path,body,token){const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(token)headers.Authorization='Bearer '+token;const res=await fetch(base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)});const raw=await res.text();let data;try{data=raw?JSON.parse(raw):null;}catch{data=null;}return {status:res.status,data};}
function status(r,s){assert.equal(r.status,s,`Expected HTTP ${s}, received ${r.status}`);return r.data;}
async function main(){
 if(!password||!['operator@example.invalid','admin@example.invalid'].includes(email))throw Error('Set AUTH_TEST_PASSWORD and valid demo AUTH_TEST_EMAIL privately');
 const health=status(await req('GET','/health'),200);if(health?.backend!=='phase3-server'||health?.databaseName!=='uav_delivery_phase3_test')throw Error('Wrong backend/database; stopped');
 try{
 status(await req('POST','/api/auth/login',{email,password:'invalid-test-password'}),401);console.log('PASS 1: wrong password rejected');
 current=status(await req('POST','/api/auth/login',{email,password}),200);assert.equal(current.user.role,role);assert.equal('password_hash' in current.user,false);console.log('PASS 2: login and role');
 status(await req('GET','/api/auth/me'),401);const me=status(await req('GET','/api/auth/me',undefined,current.accessToken),200);assert.equal(me.email,email);console.log('PASS 3: /me requires valid access token');
 const old=current.refreshToken;const both=await Promise.all([req('POST','/api/auth/refresh',{refreshToken:old}),req('POST','/api/auth/refresh',{refreshToken:old})]);const winner=both.find(r=>r.status===200);if(winner)current=winner.data;assert.deepEqual(both.map(r=>r.status).sort(),[200,401]);assert.ok(current.refreshToken!==old);console.log('PASS 4: concurrent refresh only one succeeds');
 status(await req('POST','/api/auth/refresh',{refreshToken:old}),401);console.log('PASS 5: old refresh token rejected');
 second=status(await req('POST','/api/auth/login',{email,password}),200);
 status(await req('POST','/api/auth/logout',{refreshToken:current.refreshToken}),204);status(await req('GET','/api/auth/me',undefined,current.accessToken),401);status(await req('POST','/api/auth/refresh',{refreshToken:current.refreshToken}),401);console.log('PASS 6: logout revokes access and refresh');
 status(await req('GET','/api/auth/me',undefined,second.accessToken),200);console.log('PASS 7: second session unaffected');
 console.log('AUTH API LIVE PASS (7/7)');
 }finally{for(const s of [current,second])if(s?.refreshToken)try{await req('POST','/api/auth/logout',{refreshToken:s.refreshToken});}catch{console.error('Cleanup request failed; session expires automatically');}}
}
main().catch(e=>{console.error('AUTH API LIVE FAIL:',e.name==='AssertionError'?'assertion failed; check expected endpoint/status (no tokens logged)':e.message);process.exitCode=1;});
