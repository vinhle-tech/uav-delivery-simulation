'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createAuthMiddleware}=require('../src/middlewares/auth');
const {createAuthService}=require('../src/services/auth.service');
const {HttpError}=require('../src/middlewares/http');
// Real AuthService.authenticate with fake token verifier and fake database.
function fixture(){
  let role='OPERATOR',active=true,dbError=null;
  const service=createAuthService({
    tokens:{verifyAccess:t=>t==='valid'?{userId:'user-01',sessionId:'session-01'}:null},
    repo:{activeUser:async(s,u)=>{
      if(dbError)throw dbError;
      return active&&s==='session-01'&&u==='user-01'?{id:u,email:'operator@example.invalid',full_name:'Demo',role,password_hash:'not-public'}:null;
    }},passwords:{}
  });
  return {...createAuthMiddleware(service),role:r=>{role=r;},revoke:()=>{active=false;},failDb:e=>{dbError=e;}};
}
async function invoke(m,req){let calls=0,error;await m(req,{},e=>{calls++;error=e;});assert.equal(calls,1);return error;}
const req=()=>({headers:{authorization:'Bearer valid'}});
function errorIs(e,status,code){assert.ok(e instanceof HttpError);assert.equal(e.status,status);assert.equal(e.code,code);}
test('valid access populates only trusted public identity',async()=>{const f=fixture(),r=req();r.body={role:'ADMIN'};assert.equal(await invoke(f.authenticate,r),undefined);assert.equal(r.auth.user.role,'OPERATOR');assert.equal(r.auth.user.id,'user-01');assert.equal(r.auth.sessionId,'session-01');assert.equal(r.auth.user.password_hash,undefined);assert.ok(Object.isFrozen(r.auth.user));});
test('missing malformed or invalid access denied; stale req.auth removed',async()=>{const f=fixture();for(const authorization of [undefined,'Basic valid','Bearer invalid']){const r={headers:{authorization},auth:{user:{role:'ADMIN'}}};errorIs(await invoke(f.authenticate,r),401,'UNAUTHORIZED');assert.equal(r.auth,undefined);}});
test('revoked or expired session is denied even with valid JWT',async()=>{const f=fixture(),r=req();await invoke(f.authenticate,r);f.revoke();errorIs(await invoke(f.authenticate,r),401,'INVALID_SESSION');assert.equal(r.auth,undefined);});
test('both known roles can enter common operator routes',async()=>{const f=fixture();for(const role of ['OPERATOR','ADMIN']){f.role(role);const r=req();assert.equal(await invoke(f.authenticate,r),undefined);assert.equal(await invoke(f.authorizeRoles('ADMIN','OPERATOR'),r),undefined);}});
test('operator cannot access admin route; body spoof does not help',async()=>{const f=fixture(),r=req();r.body={role:'ADMIN'};await invoke(f.authenticate,r);errorIs(await invoke(f.authorizeRoles('ADMIN'),r),403,'FORBIDDEN');});
test('admin allowed; current role checked again on next request',async()=>{const f=fixture(),r=req();f.role('ADMIN');await invoke(f.authenticate,r);assert.equal(await invoke(f.authorizeRoles('ADMIN'),r),undefined);f.role('OPERATOR');await invoke(f.authenticate,r);errorIs(await invoke(f.authorizeRoles('ADMIN'),r),403,'FORBIDDEN');});
test('missing identity and unknown roles fail closed',async()=>{const f=fixture();errorIs(await invoke(f.authorizeRoles('ADMIN'),{}),401,'UNAUTHORIZED');f.role('UNKNOWN');const r=req();errorIs(await invoke(f.authenticate,r),403,'FORBIDDEN');assert.equal(r.auth,undefined);});
test('database errors propagate to HTTP error handler and do not authorize',async()=>{const f=fixture(),r=req(),e=new Error('database unavailable');f.failDb(e);assert.equal(await invoke(f.authenticate,r),e);assert.equal(r.auth,undefined);});
test('invalid middleware configuration rejected at startup',()=>{const f=fixture();assert.throws(()=>createAuthMiddleware({}),TypeError);assert.throws(()=>f.authorizeRoles(),TypeError);assert.throws(()=>f.authorizeRoles('SUPERUSER'),TypeError);});
