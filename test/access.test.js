import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {makeServer} from '../server.js';
test('private studio denies unauthenticated API access and issues HttpOnly sessions',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'axon-access-'));const server=makeServer({dataDir:dir,password:'a-private-test-password'});await server.ready;await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{await server.shutdown();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});});
 const base=`http://127.0.0.1:${server.address().port}`;
 assert.equal((await fetch(base+'/api/jobs')).status,401);
 const login=await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:'a-private-test-password'})});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Strict/);
 assert.equal((await fetch(base+'/api/jobs',{headers:{Cookie:cookie}})).status,200);
 assert.equal((await fetch(base+'/api/audio',{method:'POST',headers:{Cookie:cookie,'Content-Type':'audio/wav'},body:'not an audio'})).status,400);
 assert.equal((await fetch(base+'/api/jobs',{method:'POST',headers:{Cookie:cookie,Origin:'https://foreign.example','Content-Type':'application/json'},body:'{}'})).status,403);
 for(let i=0;i<5;i++)assert.equal((await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"password":"bad"}'})).status,401);
 assert.equal((await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"password":"bad"}'})).status,429);
});
