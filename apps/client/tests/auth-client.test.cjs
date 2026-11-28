const {test,before}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
let createAuthClient;
before(async()=>{
 const source=fs.readFileSync(path.join(__dirname,'../src/auth/session.ts'),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 ({createAuthClient}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64')));
});
const user={id:'user-01',email:'operator@example.invalid',fullName:'Demo Operator',role:'OPERATOR'};
const session=(n)=>({user,accessToken:'access-'+n,refreshToken:'refresh-'+n,expiresIn:900});
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
function fixture(handler){
 const calls=[];
 const client=createAuthClient(async(url,init)=>{
  const p=new URL(url).pathname;calls.push({p,init});
  if(p==='/api/auth/login')return json(session(1));
  return handler(p,init);
 });
 return {client,calls};
}
test('login and bearer header',async()=>{
 const {client}=fixture((p,i)=>{assert.equal(p,'/api/drones');assert.equal(i.headers.get('Authorization'),'Bearer access-1');return json([]);});
 await client.login(user.email,'demo');assert.equal(client.getSnapshot().session.user.role,'OPERATOR');assert.equal((await client.authFetch('/api/drones')).status,200);
});
test('wrong password does not create session',async()=>{
 const client=createAuthClient(async()=>json({error:{message:'Sai mật khẩu'}},401));await assert.rejects(client.login(user.email,'bad'),/Sai mật khẩu/);assert.equal(client.getSnapshot().session,null);assert.equal(client.getSnapshot().busy,false);
});
test('parallel 401 responses rotate only once and retry with new token',async()=>{
 let rotations=0;const {client}=fixture(async(p,i)=>{if(p==='/api/auth/refresh'){rotations++;assert.equal(JSON.parse(i.body).refreshToken,'refresh-1');await new Promise(r=>setTimeout(r,15));return json(session(2));}return json({},i.headers.get('Authorization')==='Bearer access-1'?401:200);});
 await client.login(user.email,'demo');const results=await Promise.all([client.authFetch('/api/drones'),client.authFetch('/api/orders')]);assert.deepEqual(results.map(r=>r.status),[200,200]);assert.equal(rotations,1);assert.equal(client.getSnapshot().session.refreshToken,'refresh-2');
});
test('revoked session clears authentication',async()=>{
 const {client}=fixture((p)=>json({},401));await client.login(user.email,'demo');await assert.rejects(client.authFetch('/api/drones'));assert.equal(client.getSnapshot().session,null);
});
test('403 and network failures never retry command',async()=>{
 let count=0;const {client}=fixture(()=>{count++;if(count===1)return json({},403);throw Error('network');});await client.login(user.email,'demo');assert.equal((await client.authFetch('/api/devices/uav-01/flight',{method:'POST',body:'{}'})).status,403);await assert.rejects(client.authFetch('/api/devices/uav-01/flight',{method:'POST',body:'{}'}));assert.equal(count,2);
});
test('logout revokes latest refresh token and clears session',async()=>{
 const {client}=fixture((p,i)=>{if(p==='/api/auth/refresh')return json(session(2));assert.equal(p,'/api/auth/logout');assert.equal(JSON.parse(i.body).refreshToken,'refresh-2');return new Response(null,{status:204});});await client.login(user.email,'demo');await client.refresh();await client.logout();assert.equal(client.getSnapshot().session,null);await assert.rejects(client.authFetch('/api/drones'));
});
test('failed logout keeps session for retry',async()=>{
 const {client}=fixture(()=>{throw Error('network');});await client.login(user.email,'demo');await assert.rejects(client.logout());assert.ok(client.getSnapshot().session);assert.equal(client.getSnapshot().busy,false);
});
test('token never sent to external origin',async()=>{
 const {client,calls}=fixture(()=>{throw Error('unexpected');});await client.login(user.email,'demo');await assert.rejects(client.authFetch('https://example.com/api/drones'));assert.equal(calls.length,1);
});
