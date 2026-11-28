'use strict';
const { randomBytes } = require('node:crypto');
const { pool, assertTestDb } = require('../src/db');
const { hashPassword } = require('../src/services/password');
const users = [
  { id: 'user-01', email: 'operator@example.invalid', name: 'Demo Operator', role: 'OPERATOR' },
  { id: 'user-admin-01', email: 'admin@example.invalid', name: 'Demo Admin', role: 'ADMIN' }
];
async function main() {
  const db = await pool.connect();
  const created = [];
  try {
    await assertTestDb(db);
    await db.query('BEGIN');
    await db.query('SELECT pg_advisory_xact_lock(730032)');
    const ready = await db.query("SELECT to_regclass('public.auth_sessions') AS ready");
    if (!ready.rows[0].ready) throw new Error('Run npm run migrate first');
    for (const u of users) {
      const result = await db.query('SELECT id,email,role,password_hash FROM users WHERE id=$1 OR email=$2 FOR UPDATE', [u.id, u.email]);
      if (result.rowCount > 1) throw new Error('Conflicting account identity: ' + u.id);
      const row = result.rows[0];
      if (row && (row.id !== u.id || row.email !== u.email || row.role !== u.role)) throw new Error('Unexpected account identity or role: ' + u.id);
      if (row && row.password_hash !== 'NOT_A_REAL_PASSWORD_HASH') {
        if (!/^scrypt-v1\$[a-f0-9]{32}\$[a-f0-9]{64}$/.test(row.password_hash)) throw new Error('Unknown password format; existing account left intact: ' + u.id);
        console.log('SKIP existing password:', u.email); continue;
      }
      if (!row && u.id === 'user-01') throw new Error('Baseline operator missing; run baseline migration first');
      const password = randomBytes(24).toString('base64url');
      const hash = await hashPassword(password);
      if (row) await db.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash,u.id]);
      else await db.query('INSERT INTO users(id,email,full_name,role,password_hash) VALUES($1,$2,$3,$4,$5)', [u.id,u.email,u.name,u.role,hash]);
      created.push({email:u.email,password});
    }
    await db.query('COMMIT');
    console.log('AUTH USERS PASS');
    for (const u of created) console.log(`Email: ${u.email}\nPassword (save privately; shown once): ${u.password}`);
  } catch (e) { await db.query('ROLLBACK'); throw e; }
  finally { db.release(); }
}
main().catch(e=>{console.error('AUTH USERS FAIL:',e.code||e.message);process.exitCode=1;}).finally(()=>pool.end());
