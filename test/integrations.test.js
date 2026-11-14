import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createHmac} from 'node:crypto';
import {createAutomation,isPublicIP,webhookConfig,integrationCatalog} from '../src/integrations.js';
const env={AXON_AUTOMATION_WEBHOOK_URL:'https://workflow.example.com/webhook/axon',AXON_AUTOMATION_ALLOWED_HOSTS:'workflow.example.com',AXON_AUTOMATION_SIGNING_SECRET:'s'.repeat(32),AXON_AUTOMATION_TOKEN:'t'.repeat(24)};
test('webhook requires exact allowlist, HTTPS and secrets; private and reserved addresses are blocked',()=>{
 for(const address of ['127.0.0.1','10.1.1.1','172.16.0.1','192.168.0.1','169.254.169.254','100.64.0.1','::1','::ffff:127.0.0.1','fc00::1','2001:0db8::1','2001:db8::1','3fff::1'])assert.equal(isPublicIP(address),false,address);
 assert.equal(isPublicIP('8.8.8.8'),true);assert.equal(isPublicIP('2606:4700:4700::1111'),true);
 for(const url of ['http://workflow.example.com/x','https://workflow.example.com.attacker.com/x','https://user:pass@workflow.example.com/x','https://workflow.example.com:8443/x'])assert.equal(webhookConfig({...env,AXON_AUTOMATION_WEBHOOK_URL:url}),null);
 assert.equal(webhookConfig({}),null);assert.equal(integrationCatalog(createAutomation({env:{}})).automaticPublishing,false);
});
test('outbound envelope is signed, uses a validated pinned IP and never follows a redirect',async()=>{
 let calls=0;const automation=createAutomation({env,lookup:async()=>[{address:'8.8.8.8',family:4}],transport:(url,options,callback)=>{
 calls++;assert.equal(url.hostname,'workflow.example.com');options.lookup('workflow.example.com',{all:true},(_e,records)=>assert.equal(records[0].address,'8.8.8.8'));
 const req=new EventEmitter();req.destroy=error=>req.emit('error',error);req.end=body=>{const expected='sha256='+createHmac('sha256',env.AXON_AUTOMATION_SIGNING_SECRET).update(options.headers['X-Axon-Timestamp']+'.'+body).digest('hex');assert.equal(options.headers['X-Axon-Signature'],expected);assert.equal(options.headers['X-Axon-Event-Id'],'event-1');callback({statusCode:302,resume(){}});req.emit('close');};return req;
 }});
 const response=await automation.send({eventId:'event-1',publicationRequested:false});assert.equal(response.accepted,false);assert.equal(calls,1);
 let attempted=false;const denied=createAutomation({env,lookup:async()=>[{address:'127.0.0.1',family:4}],transport:()=>{attempted=true;}});await assert.rejects(()=>denied.send({}));assert.equal(attempted,false);
});
