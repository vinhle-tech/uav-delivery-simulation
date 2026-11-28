'use strict';
const secret=process.env.AUTH_JWT_SECRET;
if(typeof secret!=='string'||!(/^[a-fA-F0-9]{64}$/).test(secret))throw new Error('AUTH_JWT_SECRET must be 64 hex characters; run node scripts/init-auth-secret.cjs');
module.exports=Object.freeze({secret:Buffer.from(secret,'hex'),issuer:'uav-delivery',audience:'uav-client',accessSeconds:900,sessionDays:7});
