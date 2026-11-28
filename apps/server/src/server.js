// Local educational server. Day 2 adds authentication; do not expose publicly.
const config=require('./config/env');
const express=require('express');
const http=require('node:http');
const {Server}=require('socket.io');
const {pool,assertTestDb}=require('./db');
const {origins,cors,errorHandler,fail}=require('./middlewares/http');
const app=express();
app.use(cors);app.use(express.json({limit:'100kb'}));
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:[...origins]},allowRequest:(req,done)=>done(null,!req.headers.origin||origins.has(req.headers.origin))});
require('./routes/business.routes')(app,io);
io.on('connection',socket=>socket.emit('server:hello',{message:'Connected to UAV API demo',demoOnly:true}));
async function start(){
 await assertTestDb();
 // Start only after the port is acquired. Never connect two bridges to same UAV.
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(config.port,'127.0.0.1',()=>{server.removeListener('error',reject);resolve();});});
 require('./mqtt-bridge').attachMqttBridge(app,io);
 app.use((req,res)=>fail(res,404,'NOT_FOUND','Endpoint không tồn tại'));
 app.use(errorHandler);
 console.log(`[PHASE3 SERVER] http://127.0.0.1:${config.port} | DB=${config.database} | MQTT=${config.mqttEnabled?'ENABLED':'DISABLED'}`);
}
start().catch(async e=>{console.error('[START FAILED]',e.code||e.message);server.close();io.close();await pool.end();process.exitCode=1;});
