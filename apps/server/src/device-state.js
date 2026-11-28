// Day 5 local demo: v1 contracts, no changes to flight/DB state.
const exact = (o, keys) => o && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).length === keys.length && keys.every(k => Object.hasOwn(o,k));
const integer = n => Number.isSafeInteger(n) && n >= 0;
const lock = x => ['LOCKED','UNLOCKED'].includes(x);
const id = x => typeof x === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(x);
const telemetryV1 = t => exact(t,['schemaVersion','source','deviceId','seq','uptimeMs','batterySimPct','imu','motorPwm','cargoLock']) && t.schemaVersion===1 && t.source==='WOKWI_ESP32' && t.deviceId==='uav-01' && integer(t.seq) && integer(t.uptimeMs) && Number.isFinite(t.batterySimPct) && t.batterySimPct>=0 && t.batterySimPct<=100 && exact(t.imu,['ax','ay','az']) && Object.values(t.imu).every(Number.isFinite) && Array.isArray(t.motorPwm) && t.motorPwm.length===4 && t.motorPwm.every(x=>integer(x)&&x<=255) && lock(t.cargoLock);
const ackV1 = a => exact(a,['schemaVersion','deviceId','commandId','status','reason','cargoLock','deviceMode']) && a.schemaVersion===1 && a.deviceId==='uav-01' && id(a.commandId) && ['ACK','NACK'].includes(a.status) && typeof a.reason==='string' && lock(a.cargoLock) && ['IDLE','EN_ROUTE','WAITING_FOR_HANDOVER'].includes(a.deviceMode);
const modes=['IDLE','EN_ROUTE','PAUSED','WAITING_FOR_HANDOVER','RETURNING','SAFE_STOP'];
const telemetryValid=t=>{
  if(t?.schemaVersion===1)return telemetryV1(t);
  if(t?.schemaVersion!==2)return false;
  const {bootId,deviceMode,imuReady,...v1}=t;
  return id(bootId)&&modes.includes(deviceMode)&&typeof imuReady==='boolean'&&telemetryV1({...v1,schemaVersion:1});
};
const ackValid=a=>{
  if(a?.schemaVersion===1)return ackV1(a);
  if(a?.schemaVersion!==2)return false;
  const {bootId,...rest}=a;
  return id(bootId)&&modes.includes(rest.deviceMode)&&ackV1({...rest,schemaVersion:1,deviceMode:'IDLE'});
};
function createDeviceState({now=Date.now, emit=()=>{}, publish=()=>{}}={}) {
  let ready=false, telemetry=null, receivedAt=null, fresh=false, pending=null, lastCommand=null, revision=0;
  const retiredBoots=new Set();
  const records=new Map(); // bounded per process, no retransmission of command IDs
  const status=()=>!ready?'OFFLINE':fresh && receivedAt!==null && now()-receivedAt<8000?'ONLINE':receivedAt===null?'OFFLINE':'STALE';
  const snapshot=()=>({deviceId:'uav-01',brokerReady:ready,status:status(),telemetry,receivedAt,lastCommand,revision});
  function announce(event){revision++; emit(event,snapshot());}
  function finish(state,reason,ack=null){if(!pending)return; const rec={...pending,status:state,reason,ack,finishedAt:now()}; records.set(rec.commandId,rec); pending=null; lastCommand=rec; announce('device:ack');}
  function setReady(v){if(ready===v)return; ready=v; fresh=false; if(!v)finish('UNKNOWN','BROKER_DISCONNECTED'); announce('device:status');}
  function acceptTelemetry(t,retained=false){if(!ready||retained||!telemetryValid(t))return false;
    if(t.schemaVersion===2&&retiredBoots.has(t.bootId))return false;
    if(telemetry?.schemaVersion===2&&t.schemaVersion!==2)return false;
    if(telemetry&&t.schemaVersion===2&&t.bootId!==telemetry.bootId){
      if(telemetry.bootId){retiredBoots.add(telemetry.bootId);if(retiredBoots.size>128)retiredBoots.delete(retiredBoots.values().next().value);}
      finish('UNKNOWN','DEVICE_REBOOTED');
    }else if(telemetry){const forward=t.seq>telemetry.seq && t.uptimeMs>=telemetry.uptimeMs; const restart=t.schemaVersion===1 && receivedAt!==null && now()-receivedAt>=8000 && t.seq<telemetry.seq && t.uptimeMs<telemetry.uptimeMs; if(!forward&&!restart)return false;}
    telemetry=t;receivedAt=now();fresh=true;announce('device:telemetry');return true;
  }
  function acceptAck(a,retained=false){if(!ready||retained||!ackValid(a)||!pending||a.commandId!==pending.commandId||now()>=pending.deadline)return false;
    if(pending.bootId&&(a.schemaVersion!==2||a.bootId!==pending.bootId))return false;
    if(a.status==='ACK' && pending.kind==='flight' && a.deviceMode!==pending.value)return false;
    if(a.status==='ACK' && pending.kind!=='flight' && a.cargoLock!==(pending.value==='LOCK'?'LOCKED':'UNLOCKED'))return false;
    finish(a.status,a.reason,a);return true;
  }
  function submit(body,kind='cargo'){
    if(!exact(body,['commandId','value'])||!id(body.commandId)||!(kind==='flight'?modes:['LOCK','UNLOCK']).includes(body.value))return {http:400,error:'INVALID_COMMAND'};
    const previous=records.get(body.commandId);if(previous)return previous.value===body.value&&previous.kind===kind?{http:200,command:previous,duplicate:true}:{http:409,error:'COMMAND_ID_CONFLICT'};
    if(kind==='flight'&&telemetry?.schemaVersion!==2)return {http:409,error:'FIRMWARE_V2_REQUIRED'};
    if(status()!=='ONLINE')return {http:503,error:'DEVICE_NOT_ONLINE'};
    if(pending)return {http:409,error:'COMMAND_PENDING'};
    if(records.size>=2000)return {http:503,error:'DEMO_COMMAND_LIMIT_RESTART_REQUIRED'};
    const rec={commandId:body.commandId,value:body.value,kind,bootId:telemetry?.bootId??null,status:'PENDING',reason:null,ack:null,issuedAt:now(),deadline:now()+15000};pending=rec;lastCommand=rec;records.set(rec.commandId,rec);announce('device:ack');
    try {publish({schemaVersion:rec.bootId?2:1,commandId:rec.commandId,deviceId:'uav-01',type:kind==='flight'?'SET_FLIGHT_MODE':'SET_CARGO_LOCK',value:rec.value,...(rec.bootId?{bootId:rec.bootId}:{})},err=>{if(err&&pending?.commandId===rec.commandId)finish('UNKNOWN','PUBLISH_ERROR');});}catch{finish('UNKNOWN','PUBLISH_ERROR');}
    return {http:202,command:records.get(rec.commandId)};
  }
  function tick(){if(pending&&now()>=pending.deadline)finish('TIMEOUT','NO_ACK_AFTER_15S'); if(fresh&&status()!=='ONLINE'){fresh=false;announce('device:status');}}
  return {snapshot,setReady,acceptTelemetry,acceptAck,submit,submitFlight:body=>submit(body,'flight'),tick};
}
module.exports={createDeviceState,telemetryValid,ackValid};
