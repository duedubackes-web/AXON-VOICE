import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {JobQueue,atomicJSON} from '../src/jobs.js';
import {plan} from '../src/planner.js';
const p=()=>plan({script:'Uma história começa aqui.'});
test('parallel duplicate submissions create one persisted job and reject key reuse',{timeout:15000},async()=>{
 const dir=await mkdtemp(join(tmpdir(),'axon-jobs-'));const queue=await new JobQueue(dir,{render:async()=>({kind:'test'})}).init();
 try{const [a,b]=await Promise.all([queue.enqueue(p(),{key:'same-key'}),queue.enqueue(p(),{key:'same-key'})]);assert.equal(a.id,b.id);await queue.active;assert.equal(queue.list().length,1);assert.equal(queue.list()[0].status,'succeeded');await assert.rejects(()=>queue.enqueue(plan({script:'Outro projeto.'}),{key:'same-key'}));await queue.close();const recovered=await new JobQueue(dir).init();assert.equal(recovered.list()[0].status,'succeeded');await recovered.remove(a.id);assert.equal(recovered.list().length,0);await recovered.close();}finally{await queue.close();await rm(dir,{recursive:true,force:true});}
});
test('running job cancellation never becomes success and a queued job survives restart',{timeout:15000},async()=>{
 const dir=await mkdtemp(join(tmpdir(),'axon-cancel-'));
 const queue=await new JobQueue(dir,{render:async(_p,_d,{signal})=>new Promise((resolve,reject)=>{signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true});})}).init();
 try{const j=await queue.enqueue(p());await queue.cancel(j.id);await queue.active;assert.equal(queue.list()[0].status,'cancelled');await queue.close();const id=randomUUID();await mkdir(join(dir,id));await atomicJSON(join(dir,id,'job.json'),{id,status:'running',createdAt:new Date().toISOString(),project:p()});const recovered=await new JobQueue(dir,{render:async()=>({kind:'test'})}).init();await recovered.active;assert.equal(recovered.jobs.get(id).status,'succeeded');assert.equal(recovered.jobs.get(id).recovered,true);await recovered.close();}finally{await queue.close();await rm(dir,{recursive:true,force:true});}
});
