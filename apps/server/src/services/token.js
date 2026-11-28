'use strict';
const jwt=require('jsonwebtoken');
const config=require('../config/auth.config');
const {randomBytes,randomUUID,createHash}=require('node:crypto');
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function signAccess(userId,sessionId){return jwt.sign({sid:sessionId},config.secret,{algorithm:'HS256',subject:userId,issuer:config.issuer,audience:config.audience,expiresIn:config.accessSeconds,jwtid:randomUUID()});}
function verifyAccess(token){
 if(typeof token!=='string'||token.length>4096)return null;
 try{const p=jwt.verify(token,config.secret,{algorithms:['HS256'],issuer:config.issuer,audience:config.audience});
 if(!p||typeof p.sub!=='string'||!p.sub||!uuid.test(p.sid||'')||!Number.isInteger(p.exp)||!Number.isInteger(p.iat))return null;
 return {userId:p.sub,sessionId:p.sid};}catch{return null;}
}
const newRefresh=()=>randomBytes(32).toString('base64url');
const validRefresh=t=>typeof t==='string'&&/^[A-Za-z0-9_-]{43}$/.test(t);
const hashRefresh=t=>createHash('sha256').update(t).digest('hex');
module.exports={signAccess,verifyAccess,newRefresh,validRefresh,hashRefresh};
