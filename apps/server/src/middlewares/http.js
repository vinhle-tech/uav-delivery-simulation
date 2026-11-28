const origins=new Set(['http://localhost:5173','http://127.0.0.1:5173']);
class HttpError extends Error {constructor(status,code,message){super(message);this.status=status;this.code=code;}}
const reject=(status,code,message)=>{throw new HttpError(status,code,message);};
const fail=(res,status,code,message)=>res.status(status).json({error:{code,message}});
const asyncRoute=fn=>(req,res,next)=>Promise.resolve().then(()=>fn(req,res)).catch(next);
function cors(req,res,next){
 const origin=req.headers.origin;
 if(origin&&!origins.has(origin))return fail(res,403,'ORIGIN_NOT_ALLOWED','Origin không được phép');
 if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.vary('Origin');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');}
 if(req.method==='OPTIONS')return res.sendStatus(204);next();
}
function errorHandler(err,req,res,next){
 if(res.headersSent)return next(err);
 if(err instanceof HttpError)return fail(res,err.status,err.code,err.message);
 if(err.type==='entity.parse.failed')return fail(res,400,'INVALID_JSON','JSON không hợp lệ');
 if(err.type==='entity.too.large')return fail(res,413,'PAYLOAD_TOO_LARGE','Payload quá lớn');
 if(err.code==='23503')return fail(res,422,'FOREIGN_KEY_ERROR','ID tham chiếu không tồn tại');
 if(err.code==='23505')return fail(res,409,'DUPLICATE','Dữ liệu trùng');
 if(err.code==='23514')return fail(res,422,'CHECK_FAILED','Dữ liệu không thỏa ràng buộc');
 console.error('Request failed:',err.code||err.name);return fail(res,500,'SERVER_ERROR','Lỗi nội bộ');
}
module.exports={origins,HttpError,reject,fail,asyncRoute,cors,errorHandler};
