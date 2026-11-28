const {Pool}=require('pg');
const c=require('./config/env');
const pool=new Pool({host:c.host,port:c.pgPort,database:c.database,user:c.user,password:c.password});
pool.on('error', e=>console.error('PostgreSQL pool idle error:',e.code||'UNKNOWN'));
async function assertTestDb(client=pool){
 const r=await client.query('SELECT current_database() AS name');
 if(r.rows[0].name!=='uav_delivery_phase3_test') throw new Error('Unexpected database; aborted');
}
module.exports={pool,assertTestDb};
