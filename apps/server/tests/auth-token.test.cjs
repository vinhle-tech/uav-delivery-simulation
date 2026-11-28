'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const {randomBytes,randomUUID}=require('node:crypto');
// Test-only secret, never uses real .env.
process.env.AUTH_JWT_SECRET=randomBytes(32).toString('hex');
const t=require('../src/services/token');const jwt=require('jsonwebtoken');const cfg=require('../src/config/auth.config');
const sid=randomUUID();
test('JWT signature, issuer, audience, claims and 15-minute TTL',()=>{const token=t.signAccess('u',sid),p=jwt.decode(token);assert.equal(p.exp-p.iat,900);assert.equal(p.iss,cfg.issuer);assert.equal(p.aud,cfg.audience);assert.deepEqual(t.verifyAccess(token),{userId:'u',sessionId:sid});});
test('JWT rejects tamper, wrong secret, expiration, audience and algorithm',()=>{const opts={subject:'u',issuer:cfg.issuer,audience:cfg.audience,expiresIn:900,algorithm:'HS256'};const signed=t.signAccess('u',sid);const parts=signed.split('.');parts[2]=(parts[2][0]==='A'?'B':'A')+parts[2].slice(1);const bad=[parts.join('.'),jwt.sign({sid},randomBytes(32),opts),jwt.sign({sid},cfg.secret,{...opts,expiresIn:-1}),jwt.sign({sid},cfg.secret,{...opts,audience:'other'}),jwt.sign({sid},cfg.secret,{...opts,algorithm:'HS384'}),jwt.sign({},cfg.secret,opts)];for(const x of bad)assert.equal(t.verifyAccess(x),null);});
test('refresh token entropy format and digest',()=>{const a=t.newRefresh(),b=t.newRefresh();assert.notEqual(a,b);assert.equal(t.validRefresh(a),true);assert.equal(t.validRefresh('bad'),false);assert.match(t.hashRefresh(a),/^[a-f0-9]{64}$/);});
