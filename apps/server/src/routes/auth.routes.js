'use strict';
const {asyncRoute,fail}=require('../middlewares/http');
const {createAuthService}=require('../services/auth.service');
const repo=require('../repositories/auth.repository');
const tokens=require('../services/token');
const passwords=require('../services/password');
const {accessSeconds}=require('../config/auth.config');
const service=createAuthService({repo,tokens,passwords,accessSeconds});
// Bounded process-wide login rate/concurrency for local educational server. Not a distributed limiter.
let count=0,windowStart=Date.now(),inFlight=0;
function loginGuard(req,res,next){
 if(Date.now()-windowStart>=60000){windowStart=Date.now();count=0;}
 if(count>=30||inFlight>=2){res.setHeader('Retry-After','60');return fail(res,429,'LOGIN_RATE_LIMIT','Thử lại sau');}
 count++;inFlight++;let released=false;const release=()=>{if(!released){released=true;inFlight--;}};
 // Release on actual handler completion below, not on disconnect (scrypt may still run).
 req.releaseAuthLogin=release;next();
}
module.exports=app=>{
 const c=require('../controllers/auth.controller')(service);
 app.use('/api/auth',(req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
 app.post('/api/auth/login',loginGuard,asyncRoute(async(req,res)=>{try{await c.login(req,res);}finally{req.releaseAuthLogin();}}));
 app.post('/api/auth/refresh',asyncRoute(c.refresh));
 app.post('/api/auth/logout',asyncRoute(c.logout));
 app.get('/api/auth/me',asyncRoute(c.me));
};
module.exports.service=service;
