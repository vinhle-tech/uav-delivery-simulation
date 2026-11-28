'use strict';
module.exports=service=>({
 login:async(req,res)=>res.json(await service.login(req.body)),
 refresh:async(req,res)=>res.json(await service.refresh(req.body)),
 logout:async(req,res)=>{await service.logout(req.body);res.status(204).end();},
 me:async(req,res)=>res.json((await service.authenticate(req.headers.authorization)).user)
});
