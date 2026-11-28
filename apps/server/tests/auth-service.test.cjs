'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {createAuthService}=require('../src/services/auth.service');
const {randomBytes,createHash}=require('node:crypto');
function fixture(){
 const user={id:'user-01',email:'operator@example.invalid',full_name:'Demo Operator',role:'OPERATOR',password_hash:'scrypt-v1$'+'a'.repeat(32)+'$'+'b'.repeat(64)};
 const sessions=new Map(),issued=new Map();
 const tokens={newRefresh:()=>randomBytes(32).toString('base64url'),hashRefresh:t=>createHash('sha256').update(t).digest('hex'),validRefresh:t=>typeof t==='string'&&/^[A-Za-z0-9_-]{43}$/.test(t),signAccess:(userId,sessionId)=>{const t=randomBytes(16).toString('hex');issued.set(t,{userId,sessionId});return t;},verifyAccess:t=>issued.get(t)};
 const repo={findUser:async e=>e===user.email?user:null,createSession:async s=>sessions.set(s.id,{...s}),rotate:async (old,next)=>{for(const s of sessions.values())if(s.refreshHash===old&&!s.revoked&&!s.expired){s.refreshHash=next;return {...user,session_id:s.id};}return null;},revoke:async h=>{for(const s of sessions.values())if(s.refreshHash===h)s.revoked=true;},activeUser:async(id,uid)=>{const s=sessions.get(id);return s&&s.userId===uid&&!s.revoked&&!s.expired?user:null;}};
 const service=createAuthService({repo,tokens,passwords:{verifyPassword:async(p,h)=>p==='correct-password'&&h===user.password_hash}});
 const login=()=>service.login({email:user.email,password:'correct-password'});
 return {service,user,sessions,tokens,login};
}
const code=(status,c)=>e=>e.status===status&&e.code===c;
test('login only exposes public user and stores refresh digest',async()=>{const f=fixture(),r=await f.login();assert.equal(r.user.role,'OPERATOR');assert.equal(r.user.password_hash,undefined);assert.equal(r.expiresIn,900);assert.equal([...f.sessions.values()][0].refreshHash,f.tokens.hashRefresh(r.refreshToken));assert.notEqual([...f.sessions.values()][0].refreshHash,r.refreshToken);});
test('wrong password and unknown account share error',async()=>{const f=fixture();for(const email of [f.user.email,'unknown@example.invalid'])await assert.rejects(f.service.login({email,password:'incorrect-password'}),code(401,'INVALID_CREDENTIALS'));assert.equal(f.sessions.size,0);});
test('input validation and bearer required',async()=>{const f=fixture();await assert.rejects(f.service.login({email:1}),code(400,'INVALID_INPUT'));await assert.rejects(f.service.refresh({refreshToken:'bad'}),code(400,'INVALID_INPUT'));await assert.rejects(f.service.authenticate('Basic abc'),code(401,'UNAUTHORIZED'));});
test('refresh rotates; reuse denied; current access resolves current role',async()=>{const f=fixture(),r=await f.login(),next=await f.service.refresh({refreshToken:r.refreshToken});assert.notEqual(next.refreshToken,r.refreshToken);await assert.rejects(f.service.refresh({refreshToken:r.refreshToken}),code(401,'INVALID_SESSION'));f.user.role='ADMIN';assert.equal((await f.service.authenticate('Bearer '+next.accessToken)).user.role,'ADMIN');});
test('logout revokes only its session, old access denied',async()=>{const f=fixture(),a=await f.login(),b=await f.login();await f.service.logout({refreshToken:a.refreshToken});await f.service.logout({refreshToken:a.refreshToken});await assert.rejects(f.service.authenticate('Bearer '+a.accessToken),code(401,'INVALID_SESSION'));await assert.rejects(f.service.refresh({refreshToken:a.refreshToken}),code(401,'INVALID_SESSION'));assert.equal((await f.service.authenticate('Bearer '+b.accessToken)).user.id,f.user.id);});
test('expired session rejects otherwise valid access and refresh',async()=>{const f=fixture(),r=await f.login();[...f.sessions.values()][0].expired=true;await assert.rejects(f.service.authenticate('Bearer '+r.accessToken),code(401,'INVALID_SESSION'));await assert.rejects(f.service.refresh({refreshToken:r.refreshToken}),code(401,'INVALID_SESSION'));});
