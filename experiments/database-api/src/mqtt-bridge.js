const mqtt=require('mqtt');
const dotenv=require('dotenv');
const fs=require('node:fs');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {createDeviceState}=require('./device-state');
const {createFlightSync}=require('./flight-sync');
const {pathToFileURL}=require('node:url');
const origins=new Set(['http://127.0.0.1:5173','http://localhost:5173']);
function attachMqttBridge(app,io){
  const envPath=path.resolve(__dirname,'../../mqtt-spike/.env');
  const cfg=fs.existsSync(envPath)?dotenv.parse(fs.readFileSync(envPath)):{};
  const host=cfg.MQTT_HOST, port=Number(cfg.MQTT_PORT||8883), namespace=cfg.MQTT_NAMESPACE||'uav-solo-lab';
  const prefix=`uav-delivery/${namespace}/dev/uav-01`;
  let client, flightSync;
  const state=createDeviceState({emit:(event,data)=>io.emit(event,data),publish:(cmd,done)=>{
    if(!client?.connected)return done(new Error('offline'));
    client.publish(`${prefix}/command`,JSON.stringify(cmd),{qos:0,retain:false},done);
  }});
  app.use('/api/devices',(req,res,next)=>{
    const origin=req.headers.origin;
    if(origin&&!origins.has(origin))return res.status(403).json({error:'ORIGIN_NOT_ALLOWED'});
    if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.vary('Origin');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');}
    if(req.method==='OPTIONS')return res.sendStatus(204);
    next();
  });
  const corePath=path.resolve(__dirname,'../../../packages/simulation-core/dist/src/index.js');
  import(pathToFileURL(corePath).href).then(core=>{
    flightSync=createFlightSync({core,state});
    const flightTimer=setInterval(()=>flightSync.step(),100);flightTimer.unref();
    console.log('[FLIGHT SYNC] UAV-01 server core ready');
  }).catch(err=>console.error('[FLIGHT SYNC] Build simulation-core first:',err.message));
  app.get('/api/devices/uav-01/flight',(req,res)=>flightSync?res.json(flightSync.snapshot()):res.status(503).json({error:'FLIGHT_CORE_NOT_READY'}));
  app.post('/api/devices/uav-01/flight',(req,res)=>{
    if(!req.is('application/json'))return res.status(415).json({error:'JSON_REQUIRED'});
    if(!flightSync)return res.status(503).json({error:'FLIGHT_CORE_NOT_READY'});
    const {http,...result}=flightSync.command(req.body);res.status(http).json(result);
  });
  app.get('/api/devices/uav-01',(req,res)=>res.json(state.snapshot()));
  app.post('/api/devices/uav-01/commands',(req,res)=>{if(!req.is('application/json'))return res.status(415).json({error:'JSON_REQUIRED'});if(!flightSync)return res.status(503).json({error:'FLIGHT_CORE_NOT_READY'});const {http,...result}=flightSync.cargo(req.body);res.status(http).json(result);});
  io.on('connection',socket=>socket.emit('device:status',state.snapshot()));
  const timer=setInterval(()=>state.tick(),500);timer.unref();
  if(!host||!/^[A-Za-z0-9.-]+$/.test(host)||!cfg.MQTT_USERNAME||!cfg.MQTT_PASSWORD||!Number.isInteger(port)||port<1||port>65535||!/^[a-z0-9_-]{3,40}$/.test(namespace)){
    console.warn('[MQTT BRIDGE] Missing/invalid mqtt-spike/.env; device offline; existing API preserved');return;
  }
  client=mqtt.connect(`mqtts://${host}:${port}`,{username:cfg.MQTT_USERNAME,password:cfg.MQTT_PASSWORD,clientId:`uav-bridge-${randomUUID().slice(0,8)}`,rejectUnauthorized:true,clean:true,protocolVersion:4,reconnectPeriod:5000,connectTimeout:15000,queueQoSZero:false});
  client.on('connect',()=>{state.setReady(false);client.subscribe([`${prefix}/telemetry`,`${prefix}/ack`],{qos:0},(err,granted)=>{
    if(err||granted?.length!==2||granted.some(x=>x.qos===128)){console.warn('[MQTT BRIDGE] SUBSCRIBE FAILED');return;}
    state.setReady(true);console.log('[MQTT BRIDGE] CONNECTED + SUBSCRIBED',prefix);
  });});
  for(const event of ['close','offline','reconnect'])client.on(event,()=>state.setReady(false));
  const heartbeat=setInterval(()=>{if(client?.connected&&state.snapshot().brokerReady&&flightSync&&!flightSync.snapshot().fault)client.publish(`${prefix}/heartbeat`,'1',{qos:0,retain:false});},2000);heartbeat.unref();
  client.on('error',err=>console.warn('[MQTT BRIDGE]',err.message));
  client.on('message',(topic,payload,packet)=>{if(payload.length>4096||packet.retain)return;let data;try{data=JSON.parse(payload.toString());}catch{return;}
    if(topic===`${prefix}/telemetry`)state.acceptTelemetry(data);
    else if(topic===`${prefix}/ack`)state.acceptAck(data);
  });
}
module.exports={attachMqttBridge};
