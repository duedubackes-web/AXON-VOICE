import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {setTimeout as delay} from 'node:timers/promises';
import {AssetStore,imageType,assignImages} from '../src/assets.js';
import {command,mediaAvailable} from '../src/media.js';
import {makeServer} from '../server.js';
import {plan} from '../src/planner.js';
const available=await mediaAvailable();
test('image sniffing rejects SVG and path-like scene image identifiers',()=>{
 assert.equal(imageType(Buffer.from('<svg onload="alert(1)"></svg>')),null);assert.throws(()=>assignImages(plan({script:'Uma história.'}),['../../secret']));assert.throws(()=>assignImages(plan({script:'Uma história.'}),[]));
});
test('library validates, deduplicates, persists and protects referenced images',{skip:!available,timeout:30000},async()=>{
 const root=await mkdtemp(join(tmpdir(),'axon-assets-'));
 try{const file=join(root,'source.png');await command('ffmpeg',['-v','error','-f','lavfi','-i','color=c=red:s=320x240','-frames:v','1','-threads','1',file]);const bytes=await readFile(file);const store=await new AssetStore(join(root,'assets')).init();
 await assert.rejects(()=>store.create(bytes,'Sem autorização',''),/direitos/);await assert.rejects(()=>store.create(Buffer.from('<svg/>'),'SVG','own-or-licensed'),/PNG/);
 const asset=await store.create(bytes,'Imagem original','own-or-licensed');assert.equal(asset.width,320);assert.equal(asset.height,240);assert.equal((await store.create(bytes,'Duplicata','own-or-licensed')).id,asset.id);assert.equal(store.list().length,1);
 const reloaded=await new AssetStore(join(root,'assets')).init();assert.equal(reloaded.list()[0].id,asset.id);await assert.rejects(()=>reloaded.remove(asset.id,()=>true),/usada/);await reloaded.remove(asset.id,()=>false);assert.equal(reloaded.list().length,0);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('HTTP uploads images, composes a real vertical video and preserves scene images in campaigns and cuts',{skip:!available,timeout:90000},async t=>{
 const root=await mkdtemp(join(tmpdir(),'axon-images-api-'));const server=makeServer({dataDir:join(root,'data')});await server.ready;await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{await server.shutdown();await new Promise(r=>server.close(r));await rm(root,{recursive:true,force:true});});
 const base=`http://127.0.0.1:${server.address().port}`,post=(path,input)=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':'images-api-render'},body:JSON.stringify(input)});
 const ids=[];for(const [color,size] of [['red','320x240'],['blue','240x320']]){const path=join(root,color+'.png');await command('ffmpeg',['-v','error','-f','lavfi','-i',`color=c=${color}:s=${size}`,'-frames:v','1','-threads','1',path]);const response=await fetch(base+'/api/assets',{method:'POST',headers:{'X-Axon-Consent':'own-or-licensed','X-Axon-Name':color},body:await readFile(path)});assert.equal(response.status,201);ids.push((await response.json()).id);}
 assert.equal((await fetch(base+'/api/assets/'+ids[0]+'/file')).headers.get('content-type'),'image/png; charset=utf-8');
 const input={title:'Imagens em cena',script:Array(33).fill('história').join(' '),format:'9:16',sceneImageIds:ids};const start=await post('/api/jobs',input);assert.equal(start.status,202);const initial=await start.json();let job;
 for(let i=0;i<300;i++){job=await(await fetch(base+'/api/jobs/'+initial.id)).json();if(!['running','queued'].includes(job.status))break;await delay(50);}
 assert.equal(job.status,'succeeded');assert.equal(job.result.kind,'image-storyboard');assert.equal(job.result.scenesWithImages,2);assert.equal(job.result.width,720);assert.equal(job.result.height,1280);assert.equal(job.sceneImages,undefined);
 const video=join(root,'data','jobs',job.id,'output.mp4');
 for(const [second,channel] of [[1,0],[14,2]]){const raw=join(root,'sample-'+second+'.rgb');await command('ffmpeg',['-v','error','-ss',String(second),'-i',video,'-vf','scale=1:1','-frames:v','1','-pix_fmt','rgb24','-f','rawvideo',raw]);const rgb=await readFile(raw);assert.equal(rgb.length,3);assert.ok(rgb[channel]>rgb[channel===0?2:0]+30,`Expected scene color at ${second}s, got ${[...rgb]}`);}
 const campaign=await(await post('/api/campaigns',{...input,platforms:['instagram']})).json();assert.equal(campaign.source.scenes[0].imageAssetId,ids[0]);const cut=await(await post('/api/campaigns/'+campaign.id+'/cut',{cutId:'cut-1'})).json();assert.deepEqual(cut.sceneImageIds,ids);
 assert.equal((await fetch(base+'/api/assets/'+ids[0],{method:'DELETE'})).status,409);
 assert.equal((await fetch(base+'/api/jobs/'+job.id,{method:'DELETE'})).status,200);assert.equal((await fetch(base+'/api/campaigns/'+campaign.id,{method:'DELETE'})).status,200);assert.equal((await fetch(base+'/api/assets/'+ids[0],{method:'DELETE'})).status,200);
});
