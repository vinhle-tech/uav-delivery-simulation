const {randomUUID}=require('node:crypto');
const repo=require('../repositories/business.repository');
const {reject}=require('../middlewares/http');
const allowed=new Map(Object.entries({start:{from:['READY'],to:'IN_PROGRESS',droneStatus:'BUSY'},pause:{from:['IN_PROGRESS'],to:'PAUSED'},resume:{from:['PAUSED'],to:'IN_PROGRESS'},'return-home':{from:['IN_PROGRESS','PAUSED'],to:'RETURNING'},complete:{from:['RETURNING'],to:'COMPLETED',droneStatus:'AVAILABLE'}}));
module.exports={
 health:repo.health,drones:repo.drones,orders:repo.orders,missions:repo.missions,
 async getMission(id){const m=await repo.mission(id);if(!m)reject(404,'MISSION_NOT_FOUND','Không tìm thấy Mission');return m;},
 async createOrder(body){const {deliveryPointId,weightKg}=body||{};
 if(typeof deliveryPointId!=='string'||typeof weightKg!=='number'||!Number.isFinite(weightKg)||weightKg<=0||weightKg>9999)reject(400,'INVALID_INPUT','deliveryPointId (string) và weightKg (số > 0) là bắt buộc');
 if(!await repo.point(deliveryPointId))reject(404,'POINT_NOT_FOUND','Không tìm thấy điểm giao');
 return repo.insertOrder(`ord-${randomUUID().slice(0,8)}`,deliveryPointId,weightKg);},
 async createMission(body){const {orderId,droneId}=body||{};if(typeof orderId!=='string'||typeof droneId!=='string')reject(400,'INVALID_INPUT','Thiếu orderId hoặc droneId');
 try{return await repo.transaction(async db=>{
 const order=await repo.lockOrder(db,orderId);if(!order)reject(404,'ORDER_NOT_FOUND','Không thấy đơn');if(order.status!=='PENDING')reject(409,'ORDER_BUSY','Đơn đã được phân công');
 const drone=await repo.lockDrone(db,droneId);if(!drone)reject(404,'DRONE_NOT_FOUND','Không thấy UAV');if(drone.status!=='AVAILABLE')reject(409,'DRONE_BUSY','UAV không sẵn sàng');
 if(Number(order.weight_kg)>Number(drone.max_payload_kg))reject(422,'OVERWEIGHT','Hàng vượt tải trọng UAV');
 // Legacy demo threshold; route-aware preflight is Day 3.
 if(Number(drone.battery_pct)<55)reject(422,'INSUFFICIENT_BATTERY','Mẫu thử yêu cầu pin >= 55%');
 const m=await repo.insertMission(db,`mis-${randomUUID().slice(0,8)}`,orderId,droneId,drone.station_id);
 await repo.updateDrone(db,droneId,'RESERVED');await repo.updateOrder(db,orderId,'ASSIGNED');return m;
 });}catch(e){if(e.code==='23505')reject(409,'ACTIVE_MISSION_EXISTS','UAV/đơn có Mission đang hoạt động');throw e;}},
 async transition(id,action,body){const c=allowed.get(action);if(!c)reject(404,'UNKNOWN_ACTION','Không có thao tác');const v=body?.expectedVersion;if(!Number.isInteger(v)||v<0)reject(400,'INVALID_VERSION','Cần expectedVersion là số nguyên >= 0');
 return repo.transaction(async db=>{const m=await repo.lockMission(db,id);if(!m)reject(404,'MISSION_NOT_FOUND','Không thấy Mission');if(m.version!==v)reject(409,'VERSION_CONFLICT',`Version hiện tại: ${m.version}`);if(!c.from.includes(m.status))reject(409,'INVALID_STATE',`Không thể ${action} khi ${m.status}`);const next=await repo.updateMission(db,id,c.to);if(c.droneStatus)await repo.updateDrone(db,m.drone_id,c.droneStatus);return next;});},
 async telemetry(body){const {droneId,missionId=null,simTimeSec=0,x=0,y=0,z=0,batteryPct}=body||{};if(typeof droneId!=='string'||![simTimeSec,x,y,z,batteryPct].every(n=>typeof n==='number'&&Number.isFinite(n))||simTimeSec<0||batteryPct<0||batteryPct>100)reject(400,'INVALID_TELEMETRY','Thiếu/sai trường telemetry mẫu');return {...await repo.telemetry([droneId,missionId,simTimeSec,x,y,z,batteryPct]),demoOnly:true};}
};
