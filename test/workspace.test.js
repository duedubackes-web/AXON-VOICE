import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {makeServer} from '../server.js';
import {resolveView} from '../public/navigation.js';
import {selectIntegrations} from '../public/integration-hub.js';
import {integrationCatalog,createAutomation} from '../src/integrations.js';
test('direct views, old bookmarks and unknown fragments resolve to a valid workspace',()=>{
 assert.equal(resolveView('/integrations',''),'integrations');assert.equal(resolveView('/','\u0023integrations'),'integrations');assert.equal(resolveView('/integrations','#studio'),'studio');assert.equal(resolveView('/','#editor'),'studio');assert.equal(resolveView('/','#result'),'studio');assert.equal(resolveView('/','#unknown'),'overview');assert.equal(resolveView('/invalid',''),'overview');assert.equal(resolveView('/','#constructor'),'overview');
});
test('integration search is accent insensitive and keeps creative providers ahead of exports',()=>{
 const items=integrationCatalog(createAutomation({env:{}})).integrations;
 assert.equal(selectIntegrations(items,'metricool').length,1);assert.equal(selectIntegrations(items,'','creative').length,2);assert.equal(selectIntegrations(items,'','social').length,5);assert.equal(selectIntegrations(items,'','automation')[0].id,'automation');assert.ok(selectIntegrations(items)[0].access);assert.equal(selectIntegrations(items,'inexistente').length,0);
 assert.equal(selectIntegrations([{id:'automation',name:'Automação',purpose:'Entrega revisada'}],'automacao').length,1);
});
test('workspace deep links serve the real app and summary counts persisted campaigns without leaking paths',{timeout:30000},async t=>{
 const root=await mkdtemp(join(tmpdir(),'axon-workspace-'));const server=makeServer({dataDir:root});await server.ready;await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{await server.shutdown();await new Promise(r=>server.close(r));await rm(root,{recursive:true,force:true});});const base=`http://127.0.0.1:${server.address().port}`;
 for(const path of ['/integrations','/studio','/overview','/library','/campaigns','/exports','/brand']){const response=await fetch(base+path);assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/text\/html/);}
 let summary=await(await fetch(base+'/api/workspace')).json();assert.equal(summary.counts.campaigns,0);assert.equal(summary.counts.images,0);
 const response=await fetch(base+'/api/campaigns',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'Campanha organizada',script:'Uma ideia original.',platforms:['youtube']})});assert.equal(response.status,201);
 summary=await(await fetch(base+'/api/workspace')).json();assert.equal(summary.counts.campaigns,1);assert.equal(summary.counts.approvedCampaigns,0);assert.equal(summary.recentCampaigns[0].title,'Campanha organizada');assert.equal(JSON.stringify(summary).includes(root),false);assert.equal((await fetch(base+'/guides/automation')).status,200);
});
