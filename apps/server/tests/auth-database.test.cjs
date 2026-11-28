const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const {randomUUID,randomBytes}=require('node:crypto');
const {pool,assertTestDb}=require('../src/db');
after(()=>pool.end());
test('auth migration and two initialized user roles',async()=>{
 await assertTestDb();
 const migration=await pool.query("SELECT name FROM schema_migrations WHERE name='migrations/002_auth.sql'");
 assert.equal(migration.rowCount,1);
 const result=await pool.query("SELECT id,role,password_hash FROM users WHERE id IN ('user-01','user-admin-01') ORDER BY id");
 assert.deepEqual(result.rows.map(r=>[r.id,r.role]),[['user-01','OPERATOR'],['user-admin-01','ADMIN']]);
 for(const row of result.rows) assert.match(row.password_hash,/^scrypt-v1\$[a-f0-9]{32}\$[a-f0-9]{64}$/);
});
test('session foreign key, digest uniqueness and expiration constraints',async()=>{
 const db=await pool.connect();
 try {await assertTestDb(db);await db.query('BEGIN');
 const digest=randomBytes(32).toString('hex');
 const sql='INSERT INTO auth_sessions(id,user_id,refresh_token_hash,expires_at) VALUES($1,$2,$3,now()+interval \'1 day\')';
 await db.query(sql,[randomUUID(),'user-01',digest]);
 async function denied(query,args,code){await db.query('SAVEPOINT auth_check');try{await assert.rejects(db.query(query,args),e=>e.code===code);}finally{await db.query('ROLLBACK TO SAVEPOINT auth_check');await db.query('RELEASE SAVEPOINT auth_check');}}
 await denied(sql,[randomUUID(),'user-01',digest],'23505');
 await denied(sql,[randomUUID(),'missing-'+randomUUID(),randomBytes(32).toString('hex')],'23503');
 await denied(sql,[randomUUID(),'user-01','plaintext'],'23514');
 await denied("INSERT INTO auth_sessions(id,user_id,refresh_token_hash,expires_at) VALUES($1,$2,$3,now()-interval '1 day')",[randomUUID(),'user-01',randomBytes(32).toString('hex')],'23514');
 }finally{await db.query('ROLLBACK');db.release();}
});
