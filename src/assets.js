import {mkdir,readdir,readFile,writeFile,rm,stat} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {atomicJSON,validId} from './jobs.js';
import {command,probe} from './media.js';
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
export function imageType(data){
 if(data.length>=8&&data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'png';
 if(data.length>=3&&data[0]===255&&data[1]===216&&data[2]===255)return 'jpeg';
 if(data.length>=12&&data.subarray(0,4).toString()==='RIFF'&&data.subarray(8,12).toString()==='WEBP')return 'webp';
 return null;
}
export class AssetStore {
 constructor(root,{maxAssets=40}={}){this.root=resolve(root);this.maxAssets=maxAssets;this.assets=new Map();this.chain=Promise.resolve();}
 serial(action){const task=this.chain.then(action);this.chain=task.catch(()=>{});return task;}
 async init(){await mkdir(this.root,{recursive:true,mode:0o700});for(const id of await readdir(this.root)){if(!validId(id))continue;try{const a=JSON.parse(await readFile(join(this.root,id,'asset.json'),'utf8'));if(a.id!==id)continue;await stat(join(this.root,id,'image.png'));this.assets.set(id,a);}catch{}}return this;}
 list(){return [...this.assets.values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(a=>({...a}));}
 path(id){if(!validId(id)||!this.assets.has(id))throw fail('Imagem não encontrada.',404);return join(this.root,id,'image.png');}
 resolveScenes(project){return project.scenes.map(s=>s.imageAssetId?this.path(s.imageAssetId):null);}
 async create(data,name,rights){return this.serial(async()=>{
  if(rights!=='own-or-licensed')throw fail('Confirme os direitos de uso da imagem.');
  if(!Buffer.isBuffer(data)||data.length>12*1024*1024||!imageType(data))throw fail('Use uma imagem PNG, JPEG ou WebP de até 12 MB.');
  if(typeof name!=='string'||name.length>120)throw fail('Nome da imagem inválido.');
  const hash=createHash('sha256').update(data).digest('hex');const existing=[...this.assets.values()].find(a=>a.sha256===hash);if(existing)return {...existing,reused:true};
  if(this.assets.size>=this.maxAssets)throw fail('Limite de imagens atingido. Remova referências e exclua imagens antigas.',409);
  const id=randomUUID(),dir=join(this.root,id);await mkdir(dir,{mode:0o700});
  try{const input=join(dir,'input');await writeFile(input,data,{mode:0o600});const info=await probe(input);const image=info.streams?.find(s=>['png','mjpeg','webp'].includes(s.codec_name));if(!image||!Number.isInteger(image.width)||!Number.isInteger(image.height)||image.width<16||image.height<16||image.width*image.height>16000000)throw Error('Dimensões inválidas.');
   await command('ffmpeg',['-nostdin','-v','error','-y','-protocol_whitelist','file,pipe','-max_pixels','16000000','-i',input,'-map','0:v:0','-frames:v','1','-vf',"scale=w='min(1920,iw)':h='min(1920,ih)':force_original_aspect_ratio=decrease,format=rgb24",'-map_metadata','-1','-threads','1',join(dir,'image.png')],{timeout:30000});
   const result=await probe(join(dir,'image.png'));const stream=result.streams.find(s=>s.codec_type==='video');
   const asset={id,name:name.trim()||'Imagem sem título',kind:'image',mimeType:'image/png',width:stream.width,height:stream.height,bytes:(await stat(join(dir,'image.png'))).size,sha256:hash,rights,createdAt:new Date().toISOString()};
   await atomicJSON(join(dir,'asset.json'),asset);await rm(input);this.assets.set(id,asset);return {...asset,reused:false};
  }catch{await rm(dir,{recursive:true,force:true});throw fail('Não foi possível validar e normalizar a imagem.');}
 });}
 async remove(id,isReferenced){return this.serial(async()=>{this.path(id);if(isReferenced(id))throw fail('Imagem usada por uma campanha ou exportação. Remova essas referências antes de excluir.',409);await rm(join(this.root,id),{recursive:true,force:true});this.assets.delete(id);});}
}
export function assignImages(project,input){
 if(input===undefined)return project;
 if(!Array.isArray(input)||input.length!==project.scenes.length||input.some(id=>id!==null&&id!==''&&!validId(id)))throw fail('Seleção de imagens por cena inválida.');
 project.scenes.forEach((s,i)=>{if(input[i])s.imageAssetId=input[i];});return project;
}
