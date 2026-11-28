'use strict';
const {reject}=require('./http');
const knownRoles=new Set(['ADMIN','OPERATOR']);

// Inject the existing AuthService, not a second JWT/session implementation.
function createAuthMiddleware(service){
  if(!service || typeof service.authenticate!=='function'){
    throw new TypeError('AuthService.authenticate is required');
  }
  async function authenticate(req,res,next){
    // Never accept identity/role from client-supplied body, query or custom headers.
    delete req.auth;
    try{
      const auth=await service.authenticate(req.headers?.authorization);
      if(!auth || typeof auth.sessionId!=='string' || !auth.sessionId ||
         typeof auth.user?.id!=='string' || !auth.user.id){
        reject(401,'UNAUTHORIZED','Phiên đăng nhập không hợp lệ');
      }
      if(!knownRoles.has(auth.user.role)){
        reject(403,'FORBIDDEN','Quyền người dùng không được hỗ trợ');
      }
      req.auth=Object.freeze({user:Object.freeze({
        id:auth.user.id,email:auth.user.email,fullName:auth.user.fullName,role:auth.user.role
      }),sessionId:auth.sessionId});
    }catch(err){return next(err);}
    return next();
  }
  function authorizeRoles(...roles){
    if(roles.length===0 || roles.some(r=>!knownRoles.has(r))){
      throw new TypeError('authorizeRoles requires valid roles: ADMIN, OPERATOR');
    }
    const allowed=new Set(roles);
    return function(req,res,next){
      try{
        if(!req.auth?.user || !req.auth.sessionId)reject(401,'UNAUTHORIZED','Cần đăng nhập');
        if(!allowed.has(req.auth.user.role))reject(403,'FORBIDDEN','Không có quyền thực hiện thao tác');
      }catch(err){return next(err);}
      return next();
    };
  }
  return {authenticate,authorizeRoles};
}
module.exports={createAuthMiddleware};
