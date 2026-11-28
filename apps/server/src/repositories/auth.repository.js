'use strict';
const {pool}=require('../db');
const config=require('../config/auth.config');
const one=async(sql,args)=>(await pool.query(sql,args)).rows[0]||null;
const userColumns='u.id,u.email,u.full_name,u.role';
module.exports={
 findUser:email=>one('SELECT id,email,full_name,role,password_hash FROM users WHERE email=$1',[email]),
 createSession:async({id,userId,refreshHash})=>one(`INSERT INTO auth_sessions(id,user_id,refresh_token_hash,expires_at) VALUES($1,$2,$3,now()+($4::int*interval '1 day')) RETURNING id`,[id,userId,refreshHash,config.sessionDays]),
 // Atomic single-use rotation. Concurrent requests with the same old token cannot both update it.
 rotate: (oldHash,newHash)=>one(`UPDATE auth_sessions s SET refresh_token_hash=$2,rotated_at=now() FROM users u WHERE s.user_id=u.id AND s.refresh_token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now() RETURNING s.id AS session_id,${userColumns}`,[oldHash,newHash]),
 revoke:async hash=>{await pool.query('UPDATE auth_sessions SET revoked_at=now() WHERE refresh_token_hash=$1 AND revoked_at IS NULL',[hash]);},
 activeUser: (sessionId,userId)=>one(`SELECT ${userColumns} FROM auth_sessions s JOIN users u ON u.id=s.user_id WHERE s.id=$1 AND s.user_id=$2 AND s.revoked_at IS NULL AND s.expires_at>now()`,[sessionId,userId])
};
