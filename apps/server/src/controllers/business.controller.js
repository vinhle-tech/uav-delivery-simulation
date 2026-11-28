const service=require('../services/business.service');
const config=require('../config/env');
module.exports=io=>({
 health:async(req,res)=>{const db=await service.health();res.json({ok:true,database:db.ok===1,backend:'phase3-server',databaseName:config.database});},
 drones:async(req,res)=>res.json(await service.drones()),
 orders:async(req,res)=>res.json(await service.orders()),
 createOrder:async(req,res)=>res.status(201).json(await service.createOrder(req.body)),
 missions:async(req,res)=>res.json(await service.missions()),
 mission:async(req,res)=>res.json(await service.getMission(req.params.id)),
 createMission:async(req,res)=>{const m=await service.createMission(req.body);io.emit('mission:updated',m);res.status(201).json(m);},
 transition:async(req,res)=>{const m=await service.transition(req.params.id,req.params.action,req.body);io.emit('mission:updated',m);res.json(m);},
 telemetry:async(req,res)=>{const t=await service.telemetry(req.body);io.emit('drone:telemetry',t);res.status(201).json(t);}
});
