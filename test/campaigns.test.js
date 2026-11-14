import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {CampaignStore,createCampaign,validateBrand,defaultBrand,csv,dispatchPayload} from '../src/campaigns.js';
const input=()=>({title:'Uma ideia original',script:Array(250).fill('Uma história para compartilhar.').join(' '),platforms:['youtube','instagram','tiktok','linkedin','whatsapp']});
test('campaigns preserve source, produce bounded scene cuts, brand snapshot and distinct tracking links',()=>{
 const brand=validateBrand({...defaultBrand,name:'AXON',website:'https://example.com/?utm_source=old',hashtags:['#Criatividade']});
 const c=createCampaign(input(),brand);assert.equal(c.posts.length,5);assert.ok(c.cuts.length>1);assert.ok(c.cuts.every(cut=>cut.duration<=60&&cut.duration>0));
 for(const cut of c.cuts){const scenes=c.source.scenes.filter(s=>cut.sceneIds.includes(s.id));assert.equal(scenes.map(s=>s.narration).join(' '),cut.script);assert.equal(scenes[0].start,cut.start);assert.equal(scenes.at(-1).start+scenes.at(-1).duration,cut.end);}
 assert.equal(new Set(c.posts.map(p=>p.trackedUrl)).size,5);assert.equal(new URL(c.posts[2].trackedUrl).searchParams.get('utm_source'),'tiktok');brand.name='Changed';assert.equal(c.brand.name,'AXON');assert.equal(c.status,'draft');assert.equal(c.approval,null);
});
test('brand and platform validation reject invalid content; CSV neutralizes spreadsheet formulas',()=>{
 assert.throws(()=>validateBrand({...defaultBrand,website:'javascript:alert(1)'}));assert.throws(()=>validateBrand({...defaultBrand,hashtags:['invalid hashtag']}));
 assert.throws(()=>createCampaign({...input(),platforms:['__proto__']},defaultBrand));assert.throws(()=>createCampaign({...input(),platforms:['youtube','youtube']},defaultBrand));
 const c=createCampaign({...input(),title:'=HYPERLINK(1)'},defaultBrand);assert.match(csv(c),/"'=HYPERLINK\(1\)"/);
});
test('approval follows revision, dispatch is at most one attempt per revision and unknown results do not auto-retry',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'axon-campaigns-'));let sent=0;
 try{const store=await new CampaignStore(dir).init();await store.saveBrand({...defaultBrand,avoid:['proibido']});let c=await store.create(input());
 await assert.rejects(()=>store.dispatch(c.id,1,'send-reviewed-campaign',{configured:true}),/Aprove/);
 c=await store.approve(c.id,1,'reviewed-content-and-rights');
 const integration={configured:true,send:async event=>{sent++;assert.equal(event.publicationRequested,false);assert.equal(event.revision,1);throw Error('Timeout');}};
 const first=await store.dispatch(c.id,1,'send-reviewed-campaign',integration);assert.equal(first.delivery.status,'unknown');
 const second=await store.dispatch(c.id,1,'send-reviewed-campaign',integration);assert.equal(second.reused,true);assert.equal(sent,1);
 c=await store.update(c.id,{revision:1,posts:c.posts.map(p=>({...p,caption:'Texto proibido'}))});assert.equal(c.revision,2);assert.equal(c.approval,null);assert.equal(c.warnings.length,1);
 await assert.rejects(()=>store.approve(c.id,2,'reviewed-content-and-rights'),/termos/);
 await assert.rejects(()=>store.update(c.id,{revision:1,posts:c.posts}),/mudou/);
 c=await store.update(c.id,{revision:2,posts:c.posts.map(p=>({...p,caption:'Texto revisado'}))});c=await store.approve(c.id,3,'reviewed-content-and-rights');
 const delivered=await store.dispatch(c.id,3,'send-reviewed-campaign',{configured:true,send:async()=>({accepted:true,status:202})});assert.equal(delivered.delivery.status,'delivered');assert.equal(dispatchPayload(c,'event').publicationRequested,false);
 const reopened=await new CampaignStore(dir).init();assert.equal(reopened.get(c.id).revision,3);assert.equal(reopened.get(c.id).deliveries.length,2);assert.equal(reopened.brand.avoid[0],'proibido');
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('an interrupted delivery is recovered as unknown and is not resent',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'axon-delivery-recovery-'));
 try{const original=await new CampaignStore(dir).init();let c=await original.create(input());c=await original.approve(c.id,1,'reviewed-content-and-rights');c.deliveries.push({eventId:'interrupted-event',revision:1,status:'sending'});await original.persist(c);
 const recovered=await new CampaignStore(dir).init();let sent=false;const result=await recovered.dispatch(c.id,1,'send-reviewed-campaign',{configured:true,send:async()=>{sent=true;}});assert.equal(result.delivery.status,'unknown');assert.equal(result.reused,true);assert.equal(sent,false);
 }finally{await rm(dir,{recursive:true,force:true});}
});
