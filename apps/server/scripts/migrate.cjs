const fs=require('node:fs');const path=require('node:path');const {createHash}=require('node:crypto');
const {pool,assertTestDb}=require('../src/db');
const root=path.resolve(__dirname,'../../..','database');
const files=['migrations/001_baseline.sql','seeds/001_demo.sql','migrations/002_auth.sql'];
(async()=>{const db=await pool.connect();try{
 await assertTestDb(db);await db.query('BEGIN');await db.query('SELECT pg_advisory_xact_lock(730031)');
 const exists=await db.query("SELECT to_regclass('public.schema_migrations') AS ledger");
 if(!exists.rows[0].ledger){const r=await db.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");if(r.rowCount)throw Error('New empty test database required for baseline; existing tables left untouched');}
 await db.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, sha256 TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
 for(const name of files){const sql=fs.readFileSync(path.join(root,name),'utf8').replace(/\r\n/g,'\n');const sha=createHash('sha256').update(sql).digest('hex');const r=await db.query('SELECT sha256 FROM schema_migrations WHERE name=$1',[name]);if(r.rowCount){if(r.rows[0].sha256!==sha)throw Error('Checksum mismatch: '+name);console.log('SKIP '+name);continue;}await db.query(sql);await db.query('INSERT INTO schema_migrations(name,sha256) VALUES($1,$2)',[name,sha]);console.log('APPLY '+name);}
 await db.query('COMMIT');console.log('MIGRATION PASS');
 }catch(e){await db.query('ROLLBACK');throw e;}finally{db.release();}})().catch(e=>{console.error('MIGRATION FAIL:',e.message);process.exitCode=1;}).finally(()=>pool.end());
