import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {makeServer} from '../server.js';
import {providerAccess,providerBrief} from '../src/provider-access.js';
import {createCampaign,defaultBrand} from '../src/campaigns.js';
test('provider destinations stay on verified official hosts and exports preserve a draft without pretending to execute',()=>{
 const allowed=new Set(['app.metricool.com','app.runwayml.com','chatgpt.com','play.google.com','apps.apple.com','help.metricool.com','runway.com']);
 for(const provider of Object.values(providerAccess))for(const link of provider.links){const url=new URL(link.url);assert.equal(url.protocol,'https:');assert.equal(url.username,'');assert.ok(allowed.has(url.hostname));}
 const c=createCampaign({title:'Meu filme',script:'Uma história original.',platforms:['youtube']},defaultBrand);c.source.scenes[0].visualPrompt='Câmera se aproxima da cidade.';
 const runway=providerBrief(c,'runway');assert.match(runway,/Rascunho/);assert.match(runway,/Câmera se aproxima da cidade/);assert.match(runway,/Nenhum conteúdo foi enviado/);
 const metricool=providerBrief(c,'metricool');assert.match(metricool,/não é um formato de importação nativo/);assert.match(metricool,/youtube/);assert.throws(()=>providerBrief(c,'other'));
});
test('authenticated download routes return provider briefs and catalog links, without account credentials',{timeout:30000},async t=>{
 const root=await mkdtemp(join(tmpdir(),'axon-access-center-'));const server=makeServer({dataDir:root});await server.ready;await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{await server.shutdown();await new Promise(r=>server.close(r));await rm(root,{recursive:true,force:true});});const base=`http://127.0.0.1:${server.address().port}`;
 const catalog=await(await fetch(base+'/api/integrations')).json();for(const id of ['metricool','runway']){const item=catalog.integrations.find(i=>i.id===id);assert.equal(item.status,'external-status-not-monitored');assert.ok(item.access.links.length>=4);}
 const c=await(await fetch(base+'/api/campaigns',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'Campanha',script:'Uma história.',platforms:['youtube']})})).json();
 for(const provider of ['runway','metricool']){const response=await fetch(base+`/api/campaigns/${c.id}/brief/${provider}`);assert.equal(response.status,200);assert.match(response.headers.get('content-disposition'),new RegExp(provider));assert.match(response.headers.get('content-type'),/text\/plain/);assert.match(await response.text(),/Campanha/);}
 assert.equal((await fetch(base+`/api/campaigns/${c.id}/brief/unknown`)).status,404);
});
