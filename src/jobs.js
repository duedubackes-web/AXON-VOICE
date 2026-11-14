import {mkdir,readdir,readFile,writeFile,rename,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {renderVideo} from './media.js';
export const validId=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(value);
export async function atomicJSON(path,value){await writeFile(path+'.tmp',JSON.stringify(value,null,2),{mode:0o600});await rename(path+'.tmp',path);}
export class JobQueue {
  constructor(root,{render=renderVideo,maxJobs=20,maxDuration=600}={}){this.root=resolve(root);this.render=render;this.maxJobs=maxJobs;this.maxDuration=maxDuration;this.jobs=new Map();this.active=null;this.closed=false;this.chain=Promise.resolve();this.writes=new Map();}
  async init(){await mkdir(this.root,{recursive:true,mode:0o700});for(const name of await readdir(this.root)){if(!validId(name))continue;try{const j=JSON.parse(await readFile(join(this.root,name,'job.json'),'utf8'));if(j.id!==name)continue;if(['running','queued'].includes(j.status)){j.status='queued';j.recovered=true;await this.persist(j);}this.jobs.set(j.id,j);}catch{/* A partial/corrupt directory is not exposed as a job. */}}this.kick();return this;}
  async persist(j){const previous=this.writes.get(j.id)??Promise.resolve();const next=previous.catch(()=>{}).then(()=>atomicJSON(join(this.root,j.id,'job.json'),j));this.writes.set(j.id,next);try{await next;}finally{if(this.writes.get(j.id)===next)this.writes.delete(j.id);}}
  public(j){const {project,audioPath,...view}=j;return view;}
  list(){return [...this.jobs.values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(j=>this.public(j));}
  async enqueue(project,{key,audioPath,audioDuration}={}){
    // Serialize admission and disk writes so duplicate requests cannot race.
    const operation=this.chain.then(async()=>{
      if(this.closed)throw new Error('Fila encerrada.');
      if(key){const old=[...this.jobs.values()].find(j=>j.key===key);if(old){if(JSON.stringify(old.project)!==JSON.stringify(project)||old.audioPath!==audioPath)throw new Error('Chave já usada por outro projeto.');return this.public(old);}}
      if(this.jobs.size>=this.maxJobs)throw new Error('Limite de trabalhos atingido. Exclua uma exportação antiga.');
      if((audioDuration??project.duration)>this.maxDuration)throw new Error(`Exportação limitada a ${this.maxDuration} segundos.`);
      const id=randomUUID();const j={id,key,project,audioPath,audioDuration,status:'queued',createdAt:new Date().toISOString()};
      await mkdir(join(this.root,id),{mode:0o700});await this.persist(j);this.jobs.set(id,j);this.kick();return this.public(j);
    });this.chain=operation.catch(()=>{});return operation;
  }
  kick(){if(!this.closed&&!this.active)this.active=this.drain().finally(()=>{this.active=null;if(!this.closed&&[...this.jobs.values()].some(j=>j.status==='queued'))this.kick();});}
  async drain(){for(const j of this.jobs.values()){if(this.closed)break;if(j.status!=='queued')continue;this.controller=new AbortController();j.status='running';j.startedAt=new Date().toISOString();await this.persist(j);try{if(this.controller.signal.aborted)throw new Error('Cancelled');const result=await this.render(j.project,join(this.root,j.id),{audioPath:j.audioPath,audioDuration:j.audioDuration,signal:this.controller.signal,maxDuration:this.maxDuration});if(j.status!=='cancelled'){j.result=result;j.status='succeeded';}}catch{if(j.status!=='cancelled'){j.status='failed';j.error='Falha de renderização. Verifique FFmpeg e o áudio; crie uma nova exportação para tentar novamente.';}}j.finishedAt=new Date().toISOString();await this.persist(j);this.controller=null;}}
  async cancel(id){const j=this.jobs.get(id);if(!j)return null;if(j.status==='queued'||j.status==='running'){const wasRunning=j.status==='running';j.status='cancelled';if(wasRunning)this.controller?.abort();await this.persist(j);}return this.public(j);}
  async remove(id){const j=this.jobs.get(id);if(!j)return false;if(['running','queued'].includes(j.status))throw new Error('Cancele e aguarde o trabalho antes de excluir.');if(this.active&&j.status==='cancelled')await this.active;await rm(join(this.root,id),{recursive:true,force:true});this.jobs.delete(id);return true;}
  async close(){this.closed=true;this.controller?.abort();await this.active;await this.chain;}
}
