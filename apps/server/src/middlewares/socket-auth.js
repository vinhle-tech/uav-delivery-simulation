'use strict';
// Only the protected facade is passed to business and MQTT code. No raw io.emit.
function createProtectedSocket(io,service,{intervalMs=2000}={}){
 const states=new WeakMap();
 const allowed=a=>!!a?.sessionId && !!a?.user?.id && ['ADMIN','OPERATOR'].includes(a.user.role);
 function validate(socket){
   const state=states.get(socket);
   if(!state)return Promise.resolve(false);
   if(state.pending)return state.pending;
   state.pending=(async()=>{
     try{const a=await service.authenticate(state.header);return allowed(a);}
     catch{return false;}
   })().finally(()=>{state.pending=null;});
   return state.pending;
 }
 io.use(async(socket,next)=>{
   const token=socket.handshake.auth?.token;
   if(typeof token!=='string'||!token||token.length>4096||/\s/.test(token))return next(new Error('UNAUTHORIZED'));
   states.set(socket,{header:'Bearer '+token,pending:null});
   if(!await validate(socket)){states.delete(socket);return next(new Error('UNAUTHORIZED'));}
   next();
 });
 io.on('connection',socket=>{
   // No client-side business commands are accepted over sockets at this stage.
   socket.use((_packet,next)=>next(new Error('CLIENT_EVENTS_DISABLED')));
   const timer=setInterval(async()=>{if(!await validate(socket))socket.disconnect(true);},intervalMs);
   timer.unref?.();
   socket.once('disconnect',()=>{clearInterval(timer);states.delete(socket);});
 });
 async function send(socket,event,...args){
   if(!socket.connected)return false;
   if(!await validate(socket)){socket.disconnect(true);return false;}
   if(!socket.connected||!states.has(socket))return false;
   socket.emit(event,...args);return true;
 }
 return Object.freeze({
   emit(event,...args){return Promise.all([...io.sockets.sockets.values()].map(s=>send(s,event,...args)));},
   on(event,handler){if(event!=='connection')throw Error('Only connection handlers supported');io.on(event,s=>handler(Object.freeze({emit:(name,...args)=>send(s,name,...args)})));}
 });
}
module.exports={createProtectedSocket};
