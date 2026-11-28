'use strict';
const {randomUUID}=require('node:crypto');
const {reject}=require('../middlewares/http');
const publicUser=u=>({id:u.id,email:u.email,fullName:u.full_name,role:u.role});
const invalid=()=>reject(401,'INVALID_CREDENTIALS','Email hoặc mật khẩu không đúng');
const expired=()=>reject(401,'INVALID_SESSION','Phiên đăng nhập không hợp lệ hoặc đã hết hạn');
// A valid-format dummy hash ensures unknown accounts also perform scrypt.
const dummy='scrypt-v1$'+'0'.repeat(32)+'$'+'0'.repeat(64);
function createAuthService({repo,tokens,passwords,accessSeconds=900}){
 const result=(user,id,refresh)=>({user:publicUser(user),accessToken:tokens.signAccess(user.id,id),refreshToken:refresh,tokenType:'Bearer',expiresIn:accessSeconds});
 function requireRefresh(body){const t=body?.refreshToken;if(!tokens.validRefresh(t))reject(400,'INVALID_INPUT','Cần refreshToken hợp lệ');return t;}
 return {
 async login(body){
   const email=body?.email,password=body?.password;
   if(typeof email!=='string'||email.trim().length===0||email.length>254||typeof password!=='string'||Buffer.byteLength(password,'utf8')>256)reject(400,'INVALID_INPUT','Email và password hợp lệ là bắt buộc');
   const user=await repo.findUser(email.trim().toLowerCase());
   const encoded=user?.password_hash;
   const hasHash=typeof encoded==='string'&&/^scrypt-v1\$[a-f0-9]{32}\$[a-f0-9]{64}$/.test(encoded);
   const ok=await passwords.verifyPassword(password,hasHash?encoded:dummy);
   if(!user||!hasHash||!ok)invalid();
   const id=randomUUID(),refresh=tokens.newRefresh();
   await repo.createSession({id,userId:user.id,refreshHash:tokens.hashRefresh(refresh)});
   return result(user,id,refresh);
 },
 async refresh(body){const old=requireRefresh(body),next=tokens.newRefresh();const row=await repo.rotate(tokens.hashRefresh(old),tokens.hashRefresh(next));if(!row)expired();return result(row,row.session_id,next);},
 async logout(body){const t=requireRefresh(body);await repo.revoke(tokens.hashRefresh(t));},
 async authenticate(authorization){
   const match=typeof authorization==='string'&&/^Bearer ([^\s]+)$/i.exec(authorization);
   const claims=match&&tokens.verifyAccess(match[1]);
   if(!claims)reject(401,'UNAUTHORIZED','Access Token không hợp lệ hoặc đã hết hạn');
   const user=await repo.activeUser(claims.sessionId,claims.userId);
   if(!user)expired();return {user:publicUser(user),sessionId:claims.sessionId};
 }
 };
}
module.exports={createAuthService};
