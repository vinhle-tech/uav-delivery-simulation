const {pool}=require('../db');
const rows=async(sql,params=[],db=pool)=>(await db.query(sql,params)).rows;
const first=async(sql,params=[],db=pool)=>(await rows(sql,params,db))[0];
module.exports={
 health:()=>first('SELECT 1 AS ok'),
 drones:()=>rows(`SELECT d.id,d.status,d.battery_pct,dm.max_payload_kg,dm.cruise_speed_mps FROM drones d JOIN drone_models dm ON dm.id=d.model_id ORDER BY d.id`),
 orders:()=>rows('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100'),
 point:id=>first('SELECT 1 FROM delivery_points WHERE id=$1',[id]),
 insertOrder:(id,point,weight)=>first(`INSERT INTO orders(id,delivery_point_id,weight_kg,status) VALUES($1,$2,$3,'PENDING') RETURNING *`,[id,point,weight]),
 missions:()=>rows('SELECT * FROM missions ORDER BY created_at DESC LIMIT 100'),
 mission:id=>first('SELECT * FROM missions WHERE id=$1',[id]),
 lockOrder:(db,id)=>first('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[id],db),
 lockDrone:(db,id)=>first(`SELECT d.*,dm.max_payload_kg FROM drones d JOIN drone_models dm ON dm.id=d.model_id WHERE d.id=$1 FOR UPDATE OF d`,[id],db),
 lockMission:(db,id)=>first('SELECT * FROM missions WHERE id=$1 FOR UPDATE',[id],db),
 insertMission:(db,id,order,drone,station)=>first('INSERT INTO missions(id,order_id,drone_id,station_id) VALUES($1,$2,$3,$4) RETURNING *',[id,order,drone,station],db),
 updateDrone:(db,id,status)=>db.query('UPDATE drones SET status=$2,updated_at=now() WHERE id=$1',[id,status]),
 updateOrder:(db,id,status)=>db.query('UPDATE orders SET status=$2 WHERE id=$1',[id,status]),
 updateMission:(db,id,status)=>first(`UPDATE missions SET status=$2,version=version+1,started_at=CASE WHEN $2='IN_PROGRESS' AND started_at IS NULL THEN now() ELSE started_at END,finished_at=CASE WHEN $2='COMPLETED' THEN now() ELSE finished_at END WHERE id=$1 RETURNING *`,[id,status],db),
 telemetry:(v)=>first('INSERT INTO telemetry(drone_id,mission_id,sim_time_s,x_m,y_m,z_m,battery_pct) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',v),
 async transaction(fn){const db=await pool.connect();try{await db.query('BEGIN');const result=await fn(db);await db.query('COMMIT');return result;}catch(e){await db.query('ROLLBACK');throw e;}finally{db.release();}}
};
