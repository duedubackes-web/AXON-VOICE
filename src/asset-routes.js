import {readFile} from 'node:fs/promises';
export async function assetRoutes({req,send,body,assets,available,isReferenced}){
 if(req.method==='GET'&&req.url==='/api/assets'){send(200,assets.list());return true;}
 if(req.method==='POST'&&req.url==='/api/assets'){
  if(!available){send(503,{error:'Instale FFmpeg para processar imagens.'});return true;}
  let name;try{name=decodeURIComponent(req.headers['x-axon-name']??'Imagem');}catch{send(400,{error:'Nome inválido.'});return true;}
  send(201,await assets.create(await body(req,12*1024*1024),name,req.headers['x-axon-consent']));return true;
 }
 const match=req.url?.match(/^\/api\/assets\/([0-9a-f-]+)(?:\/(file))?$/u);if(!match)return false;
 const [,id,action]=match;
 if(req.method==='GET'&&action==='file'){send(200,await readFile(assets.path(id)),'image/png');return true;}
 if(req.method==='DELETE'&&!action){await assets.remove(id,isReferenced);send(200,{deleted:true});return true;}
 return false;
}
