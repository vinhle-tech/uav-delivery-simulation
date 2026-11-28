const path = require('node:path');
require('dotenv').config({path:path.resolve(__dirname,'../../.env')});
const config = {
  port: Number(process.env.PORT || 3000),
  host: process.env.PGHOST || '127.0.0.1',
  pgPort: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
  mqttEnabled: process.env.MQTT_ENABLED === 'true',
};
if (!['127.0.0.1','localhost','::1'].includes(config.host) || config.database !== 'uav_delivery_phase3_test') {
  throw new Error('Day 1 requires local PGDATABASE=uav_delivery_phase3_test; original DB is protected.');
}
for (const n of [config.port, config.pgPort]) if (!Number.isInteger(n)||n<1||n>65535) throw new Error('Invalid port');
if (!config.password) throw new Error('Set PGPASSWORD in apps/server/.env');
module.exports=config;
