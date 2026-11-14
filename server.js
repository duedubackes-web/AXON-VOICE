import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {readFile,mkdir,writeFile,rm,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {plan,regions} from './src/planner.js';
import {JobQueue,validId,atomicJSON} from './src/jobs.js';
import {mediaAvailable,normalizeAudio} from './src/media.js';
import {createAccess} from './src/access.js';
const files={'/':['index.html','text/html'],'/app.js':['app.js','text/javascript'],'/style.css':['style.css','text/css']};
function fail(status,message){return Object.assign(new Error(message),{status});}
async function body(req,max=260000){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>max)throw fail(413,'Arquivo acima do limite permitido.');chunks.push(chunk);}return Buffer.concat(chunks);}
async function json(req){if(!req.headers['content-type']?.startsWith('application/json'))throw fail(415,'Envie JSON.');try{return JSON.parse((await body(req)).toString('utf8'));}catch(e){if(e.status)throw e;throw fail(400,'JSON inválido.');}}
export function makeServer(options={}){
 const dataDir=resolve(options.dataDir??(process.env.AXON_DATA_DIR||fileURLToPath(new URL('./.data',import.meta.url))));
 const maxDuration=options.maxDuration??600;
 const access=createAccess({password:options.password??process.env.AXON_STUDIO_PASSWORD??'',publicOrigin:options.publicOrigin??process.env.AXON_PUBLIC_ORIGIN??''});
 let queue,available=false;
 const ready=(async()=>{available=await mediaAvailable();await mkdir(join(dataDir,'audio'),{recursive:true,mode:0o700});queue=await new JobQueue(join(dataDir,'jobs'),{maxDuration,...options.queueOptions}).init();})();
 // Startup failures are reported by start(), and requests return a generic 500.
 ready.catch(()=>{});
 const server=createServer(async(req,res)=>{
  const headers={'Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; media-src 'self' blob:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store'};
  const send=(status,data,type='application/json',extra={})=>{res.writeHead(status,{...headers,...extra,'Content-Type':type+'; charset=utf-8'});res.end(type==='application/json'?JSON.stringify(data):data);};
  try{
   if(!['GET','HEAD'].includes(req.method)&&!access.sameOrigin(req))throw fail(403,'Origem não permitida.');
   if(req.method==='GET'&&files[req.url]){const [file,type]=files[req.url];return send(200,await readFile(fileURLToPath(new URL('./public/'+file,import.meta.url))),type);}
   if(req.method==='GET'&&req.url==='/api/session')return send(200,{locked:!access.valid(req),passwordRequired:access.enabled});
   if(req.method==='POST'&&req.url==='/api/login'){if(!access.enabled)return send(200,{ok:true});const data=await json(req);const result=access.login(req,data.password);return send(result.status,{ok:result.status===200,error:result.error},'application/json',result.cookie?{'Set-Cookie':result.cookie}:{});}
   if(!access.valid(req))throw fail(401,'Desbloqueie o estúdio para continuar.');
   await ready;
   if(req.method==='GET'&&req.url==='/api/capabilities')return send(200,{regions,planning:true,aiVoice:false,aiVideo:false,storyboardVideo:available,ownNarration:available,maxDuration,maxUploadBytes:20*1024*1024,storage:'browser-indexeddb-and-server-render-jobs',authentication:access.enabled?'single-studio-password':'local-only'});
   if(req.method==='POST'&&req.url==='/api/plan'){try{return send(200,plan(await json(req)));}catch(e){throw e.status?e:fail(400,e.message);}}
   if(req.method==='GET'&&req.url==='/api/jobs')return send(200,queue.list());
   if(req.method==='POST'&&req.url==='/api/audio'){
    if(!available)throw fail(503,'Instale FFmpeg e FFprobe para processar áudio.');
    if(req.headers['x-axon-consent']!=='own-or-licensed')throw fail(400,'Confirme que você possui autorização para usar este áudio.');
    const audioNames=await import('node:fs/promises').then(fs=>fs.readdir(join(dataDir,'audio')));if(audioNames.length>=40)throw fail(429,'Limite de áudios atingido. Exclua áudios antigos.');
    const id=randomUUID(),dir=join(dataDir,'audio',id);await mkdir(dir,{mode:0o700});
    try{const data=await body(req,20*1024*1024);if(!data.length)throw fail(400,'Envie um arquivo de áudio.');await writeFile(join(dir,'input'),data,{mode:0o600});const duration=await normalizeAudio(join(dir,'input'),join(dir,'audio.wav'),maxDuration);await rm(join(dir,'input'));const record={id,duration,createdAt:new Date().toISOString(),rights:'own-or-licensed'};await atomicJSON(join(dir,'audio.json'),record);return send(201,record);}catch(e){await rm(dir,{recursive:true,force:true});throw e.status?e:fail(400,'Áudio inválido, formato não suportado ou duração acima do limite.');}
   }
   const audioMatch=req.url?.match(/^\/api\/audio\/([0-9a-f-]+)$/u);
   if(audioMatch&&req.method==='DELETE'){
    const id=audioMatch[1];if(!validId(id))throw fail(404,'Áudio não encontrado.');const audioPath=join(dataDir,'audio',id,'audio.wav');if([...queue.jobs.values()].some(j=>['queued','running'].includes(j.status)&&j.audioPath===audioPath))throw fail(409,'O áudio está em uso por uma exportação.');await rm(join(dataDir,'audio',id),{recursive:true,force:true});return send(200,{deleted:true});
   }
   if(req.method==='POST'&&req.url==='/api/jobs'){
    if(!available)throw fail(503,'Instale FFmpeg e FFprobe para exportar vídeos.');
    const input=await json(req);let project;
    try{project=plan(input);}catch(e){throw fail(400,e.message);}
    if(input.visualPrompts!==undefined){if(!Array.isArray(input.visualPrompts)||input.visualPrompts.length!==project.scenes.length||input.visualPrompts.some(p=>typeof p!=='string'||p.length>2000))throw fail(400,'Direções visuais inválidas.');project.scenes.forEach((s,i)=>s.visualPrompt=input.visualPrompts[i]);}
    const key=req.headers['idempotency-key'];if(typeof key!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/u.test(key))throw fail(400,'Informe uma chave de idempotência válida.');
    let audioPath,audioDuration;
    if(input.audioId){if(!validId(input.audioId))throw fail(400,'Áudio inválido.');try{const record=JSON.parse(await readFile(join(dataDir,'audio',input.audioId,'audio.json'),'utf8'));audioPath=join(dataDir,'audio',input.audioId,'audio.wav');await stat(audioPath);audioDuration=record.duration;}catch{throw fail(404,'Áudio não encontrado.');}}
    try{return send(202,await queue.enqueue(project,{key,audioPath,audioDuration}));}catch(e){throw fail(409,e.message);}
   }
   const match=req.url?.match(/^\/api\/jobs\/([0-9a-f-]+)(?:\/(file|cancel|retry))?$/u);
   if(match){const [,id,action]=match;if(!validId(id)||!queue.jobs.has(id))throw fail(404,'Trabalho não encontrado.');const job=queue.jobs.get(id);
    if(req.method==='GET'&&action==='file'){if(job.status!=='succeeded')throw fail(409,'Exportação ainda não está disponível.');const path=join(queue.root,id,'output.mp4');const info=await stat(path);res.writeHead(200,{...headers,'Content-Type':'video/mp4','Content-Length':info.size,'Content-Disposition':`attachment; filename="axon-${id}.mp4"`});const stream=createReadStream(path);stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());return stream.pipe(res);}
    if(req.method==='GET'&&!action)return send(200,queue.public(job));
    if(req.method==='POST'&&action==='retry'){if(!available)throw fail(503,'FFmpeg indisponível.');if(!['failed','cancelled'].includes(job.status))throw fail(409,'Somente trabalhos falhos ou cancelados podem ser repetidos.');if(job.audioPath){try{await stat(job.audioPath);}catch{throw fail(404,'O áudio original foi excluído. Carregue uma nova gravação.');}}try{return send(202,await queue.enqueue(job.project,{key:randomUUID(),audioPath:job.audioPath,audioDuration:job.audioDuration}));}catch(e){throw fail(409,e.message);}}
    if(req.method==='POST'&&action==='cancel')return send(200,await queue.cancel(id));
    if(req.method==='DELETE'&&!action){try{await queue.remove(id);}catch(e){throw fail(409,e.message);}return send(200,{deleted:true});}
   }
   return send(404,{error:'Não encontrado.'});
  }catch(e){if(!res.headersSent)send(e.status??500,{error:e.status?e.message:'Não foi possível processar a solicitação.'});else res.destroy();}
 });
 server.ready=ready;server.shutdown=async()=>{await ready;await queue.close();};return server;
}
export async function start(){
 const host=process.env.HOST??'127.0.0.1';
 if(!['127.0.0.1','localhost','::1'].includes(host)&&!(process.env.AXON_STUDIO_PASSWORD?.length>=16))throw new Error('Para expor o servidor, configure AXON_STUDIO_PASSWORD com pelo menos 16 caracteres.');
 const server=makeServer();await server.ready;server.listen(Number(process.env.PORT??3000),host,()=>console.log('AXON-VOICE iniciado na porta '+(process.env.PORT??3000)));
 for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{server.close();server.shutdown().finally(()=>process.exit());});return server;
}
if(process.argv[1]===fileURLToPath(import.meta.url))start().catch(e=>{console.error(e.message);process.exitCode=1;});
