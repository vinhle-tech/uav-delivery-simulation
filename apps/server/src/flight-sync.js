// Day 6: one authoritative demo engine, no DB mutation; hardware is an LED/servo proxy.
const {randomUUID}=require('node:crypto');
const desired=s=>({IDLE:'IDLE',PRE_FLIGHT_CHECK:'EN_ROUTE',TAKEOFF:'EN_ROUTE',EN_ROUTE:'EN_ROUTE',PAUSED:'PAUSED',LANDING:'EN_ROUTE',WAITING_FOR_HANDOVER:'WAITING_FOR_HANDOVER',RETURNING:'RETURNING',COMPLETED:'IDLE',FAILED:'SAFE_STOP'})[s];
function createFlightSync({core,state,now=Date.now}){
  const {SimulationEngine,demoMission,preflightError,DEFAULT_PARAMS}=core;
  let engine=new SimulationEngine(demoMission),speed=4,fault=null,transition=null,boot=null,armed=false,unlocked=false,seenCargo=null,confirmedMode=null,stopAttempted=false,cargoSync=null;
  const device=()=>state.snapshot();
  const flight=()=>engine.snapshot();
  const online=d=>d.status==='ONLINE'&&d.telemetry?.schemaVersion===2;
  const reject=(error,http=409)=>({http,error});
  const snap=()=>({flight:flight(),speed,fault,syncStatus:transition||cargoSync?'SYNCING':fault?'FAULT':armed?'SYNCED':'IDLE',deviceMode:device().telemetry?.deviceMode??null,openedForHandover:unlocked});
  function fail(reason){if(!fault){fault=reason;stopAttempted=false;} transition=null;cargoSync=null;}
  function request(mode,action){
    const commandId=randomUUID();const r=state.submitFlight({commandId,value:mode});
    if(r.http!==202){fail(r.error||'MODE_REQUEST_FAILED');return false;}
    transition={commandId,mode,action,deadline:now()+25000,ack:false,ackSeq:0};return true;
  }
  function step(){
    const d=device(),t=d.telemetry,s=flight(),last=d.lastCommand;
    // Fault recovery never restarts a motor automatically. Wait for explicit RESET.
    if(transition){
      if(!online(d)||t.bootId!==boot){fail('DEVICE_DISCONNECTED_OR_REBOOTED');return;}
      if(now()>=transition.deadline){fail('MODE_CONFIRM_TIMEOUT');return;}
      if(last?.commandId===transition.commandId&&last.status!=='PENDING'){
        if(last.status!=='ACK'){fail('MODE_'+last.status+': '+last.reason);return;}
        if(!transition.ack){transition.ack=true;transition.ackSeq=t.seq;}
      }
      if(transition.ack&&t.seq>transition.ackSeq&&t.deviceMode===transition.mode&&((transition.mode==='WAITING_FOR_HANDOVER'||transition.mode==='IDLE'||transition.mode==='SAFE_STOP')?t.motorPwm.every(x=>x===0):t.motorPwm.every(x=>x>0))){
        const action=transition.action;confirmedMode=transition.mode;transition=null;
        if(action==='RESET'){
          if(t.cargoLock!=='LOCKED'){fail('RESET_LOCK_NOT_CONFIRMED');return;}
          engine=new SimulationEngine(demoMission);fault=null;armed=false;boot=null;unlocked=false;seenCargo=null;stopAttempted=false;
        }
        if(action==='START')armed=true;
        if(action==='STOP')stopAttempted=true;
      }
      return;
    }
    if(fault){
      if(online(d)&&!stopAttempted&&last?.status!=='PENDING'){
        stopAttempted=true;boot=t.bootId;request('SAFE_STOP','STOP');
      }
      return;
    }
    if(!armed){if(online(d)&&t.deviceMode!=='IDLE')fail('DEVICE_NOT_IDLE_AFTER_BACKEND_RESTART');return;}
    if(!online(d)||t.bootId!==boot||!t.imuReady){fail('DEVICE_OFFLINE_REBOOT_OR_IMU');return;}
    if(t.deviceMode!==confirmedMode){fail('UNEXPECTED_DEVICE_MODE');return;}
    if(last?.kind==='cargo'&&last.commandId!==seenCargo&&last.status!=='PENDING'){
      seenCargo=last.commandId;
      if(last.status==='UNKNOWN'||last.status==='TIMEOUT'){fail('CARGO_RESULT_UNKNOWN');return;}
      if(last.status==='ACK')cargoSync={value:last.value,seq:t.seq,deadline:now()+15000};
    }
    if(cargoSync){
      if(now()>=cargoSync.deadline){fail('CARGO_TELEMETRY_TIMEOUT');return;}
      if(t.seq<=cargoSync.seq||t.cargoLock!==(cargoSync.value==='LOCK'?'LOCKED':'UNLOCKED'))return;
      if(cargoSync.value==='UNLOCK'&&s.flightState==='WAITING_FOR_HANDOVER')unlocked=true;
      cargoSync=null;
    }
    if(s.flightState==='FAILED'){fail('CORE_FAILED');return;}
    if(s.flightState==='COMPLETED')return;
    if(t.batterySimPct<=30){fail('DEVICE_LOW_BATTERY');return;}
    if(s.flightState!=='WAITING_FOR_HANDOVER'&&t.cargoLock!=='LOCKED'){fail('CARGO_NOT_LOCKED');return;}
    if(last?.status==='PENDING')return;
    // Hold the simulation handover timer while the cargo is open or while ACK is pending.
    if(s.flightState==='WAITING_FOR_HANDOVER'&&t.cargoLock!=='LOCKED')return;
    // Stop between automatic flight transitions until the hardware mode is confirmed.
    const next=engine.tick(0.1*speed);
    if(next.flightState==='FAILED'){fail('CORE_FAILED');return;}
    const mode=desired(next.flightState);
    if(mode!==confirmedMode)request(mode,'AUTO');
  }
  function command(body){
    if(!body||typeof body.command!=='string')return reject('INVALID_FLIGHT_COMMAND',400);
    const c=body.command,d=device(),t=d.telemetry,s=flight();
    if(c==='SPEED'){if(![1,4,8].includes(body.value))return reject('INVALID_SPEED',400);speed=body.value;return {http:200};}
    if(transition||cargoSync||d.lastCommand?.status==='PENDING')return reject('COMMAND_PENDING');
    if(!online(d))return reject('DEVICE_V2_NOT_ONLINE',503);
    if(c==='RESET'){
      if(!fault&&!['IDLE','COMPLETED','FAILED'].includes(s.flightState))return reject('RESET_ONLY_IDLE_COMPLETED_OR_FAULT');
      boot=t.bootId;stopAttempted=true;
      return request('IDLE','RESET')?{http:202}:reject('RESET_REQUEST_FAILED');
    }
    if(fault)return reject('RESET_REQUIRED');
    if(c==='START'){
      if(s.flightState!=='IDLE'||armed||!t.imuReady||t.deviceMode!=='IDLE'||t.cargoLock!=='LOCKED'||t.motorPwm.some(x=>x!==0))return reject('PRE_FLIGHT_DEVICE_NOT_READY');
      const cfg={...demoMission,batteryPct:Math.min(demoMission.batteryPct,t.batterySimPct)};
      const error=preflightError(cfg,DEFAULT_PARAMS);if(error)return reject(error);
      engine=new SimulationEngine(cfg);const r=engine.command('START');if(!r.ok)return reject(r.reason);
      boot=t.bootId;unlocked=false;seenCargo=d.lastCommand?.commandId??null;
      return request('EN_ROUTE','START')?{http:202}:reject('START_REQUEST_FAILED');
    }
    if(armed&&d.lastCommand?.kind==='cargo'&&d.lastCommand.commandId!==seenCargo&&d.lastCommand.status!=='PENDING')return reject('WAIT_CARGO_CONFIRMATION');
    if(!armed||!['PAUSE','RESUME','RETURN_HOME','CONFIRM_HANDOVER'].includes(c))return reject('INVALID_FLIGHT_COMMAND',400);
    if(t.bootId!==boot||t.deviceMode!==confirmedMode||!t.imuReady||t.batterySimPct<=30){fail('DEVICE_NOT_READY');return reject('DEVICE_NOT_READY');}
    if(t.cargoLock!=='LOCKED'||(d.lastCommand?.kind==='cargo'&&['TIMEOUT','UNKNOWN'].includes(d.lastCommand.status))||(d.lastCommand?.kind==='cargo'&&d.lastCommand.status==='ACK'&&d.lastCommand.value==='UNLOCK'))return reject('CARGO_LOCK_REQUIRED');
    if(c==='CONFIRM_HANDOVER'&&typeof body.success!=='boolean')return reject('SUCCESS_BOOLEAN_REQUIRED',400);
    if(c==='CONFIRM_HANDOVER'&&body.success===true&&!unlocked)return reject('OPEN_AND_RELOCK_CARGO_FIRST');
    const result=engine.command(c,{success:body.success});if(!result.ok)return reject(result.reason);
    const mode=desired(flight().flightState);
    return mode===confirmedMode||request(mode,c)?{http:202}:reject('MODE_REQUEST_FAILED');
  }
  function cargo(body){
    const d=device(),t=d.telemetry,s=flight();
    if(!online(d))return reject('DEVICE_V2_NOT_ONLINE',503);
    if(fault||transition||cargoSync)return reject('FLIGHT_NOT_SYNCHRONIZED');
    if(armed&&d.lastCommand?.kind==='cargo'&&d.lastCommand.commandId!==seenCargo&&d.lastCommand.status!=='PENDING')return reject('WAIT_CARGO_CONFIRMATION');
    if(body?.value==='UNLOCK'&&(!armed||s.flightState!=='WAITING_FOR_HANDOVER'||t.deviceMode!=='WAITING_FOR_HANDOVER'))return reject('NOT_AT_DELIVERY_POINT');
    if(body?.value==='LOCK'&&!['IDLE','COMPLETED','WAITING_FOR_HANDOVER'].includes(s.flightState))return reject('LOCK_ONLY_WHEN_GROUNDED');
    return state.submit(body);
  }
  return {snapshot:snap,step,command,cargo};
}
module.exports={createFlightSync,desired};
