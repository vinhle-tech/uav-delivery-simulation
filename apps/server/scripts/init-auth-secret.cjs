'use strict';
const fs=require('node:fs');const path=require('node:path');const {randomBytes}=require('node:crypto');
const file=path.resolve(__dirname,'../.env');
try{
 const current=fs.readFileSync(file,'utf8');
 const existing=require('dotenv').parse(current);
 if(Object.hasOwn(existing,'AUTH_JWT_SECRET')){
   if(!/^[a-fA-F0-9]{64}$/.test(existing.AUTH_JWT_SECRET))throw new Error('Existing AUTH_JWT_SECRET invalid; not overwritten.');
   console.log('SKIP existing AUTH_JWT_SECRET');
 }else{
   fs.appendFileSync(file,`${current.endsWith('\n')?'':'\n'}AUTH_JWT_SECRET=${randomBytes(32).toString('hex')}\n`,'utf8');
   console.log('AUTH SECRET PASS (saved locally; not printed)');
 }
}catch(e){console.error('AUTH SECRET FAIL:',e.code||e.message);process.exitCode=1;}
