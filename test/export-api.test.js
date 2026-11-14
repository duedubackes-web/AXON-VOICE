import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {makeServer} from '../server.js';
import {command,mediaAvailable} from '../src/media.js';
const available=await mediaAvailable();
test('API accepts an authorized audio, renders, reuses a request, downloads and deletes',{skip:!available,timeout:30000},async t=>{
 const root=await mkdtemp(join(tmpdir(),'axon-export-api-'));
 const server=makeServer({dataDir:join(root,'data')});await server.ready;await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{await server.shutdown();await new Promise(r=>server.close(r));await rm(root,{recursive:true,force:true});});
 const base=`http://127.0.0.1:${server.address().port}`;
 await command('ffmpeg',['-v','error','-f','lavfi','-i','sine=frequency=330:duration=3',join(root,'sample.wav')]);
 const audio=await fetch(base+'/api/audio',{method:'POST',headers:{'X-Axon-Consent':'own-or-licensed'},body:await readFile(join(root,'sample.wav'))});assert.equal(audio.status,201);const asset=await audio.json();
 const input={title:'Teste ponta a ponta',script:'Uma história original. Do roteiro ao vídeo.',format:'9:16',audioId:asset.id};
 const request=()=>fetch(base+'/api/jobs',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':'api-render-test'},body:JSON.stringify(input)});
 const response=await request();assert.equal(response.status,202);const initial=await response.json();assert.equal((await(await request()).json()).id,initial.id);
 let job;for(let i=0;i<100;i++){job=await(await fetch(base+'/api/jobs/'+initial.id)).json();if(!['queued','running'].includes(job.status))break;await delay(50);}
 assert.equal(job.status,'succeeded');assert.equal(job.result.hasAudio,true);assert.equal(job.result.width,720);assert.equal(job.result.height,1280);
 const result=await fetch(base+'/api/jobs/'+job.id+'/file');assert.equal(result.status,200);assert.equal(result.headers.get('content-type'),'video/mp4');const bytes=Buffer.from(await result.arrayBuffer());assert.equal(bytes.subarray(4,8).toString(),'ftyp');
 assert.equal((await fetch(base+'/api/jobs/'+job.id,{method:'DELETE'})).status,200);assert.equal((await fetch(base+'/api/jobs/'+job.id+'/file')).status,404);
 assert.equal((await fetch(base+'/api/audio/'+asset.id,{method:'DELETE'})).status,200);
 assert.equal((await fetch(base+'/api/audio',{method:'POST',headers:{'X-Axon-Consent':'own-or-licensed'},body:'not an audio'})).status,400);
});
