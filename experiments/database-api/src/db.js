require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'uav_delivery',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD
});

pool.on('error', err => console.error('PostgreSQL pool idle error:', err.message));
module.exports = { pool };
