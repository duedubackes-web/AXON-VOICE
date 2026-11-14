import {readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
for(const directory of ['src','public','scripts']){
 for(const name of await readdir(directory))if(name.endsWith('.js')){
  const result=spawnSync(process.execPath,['--check',directory+'/'+name],{stdio:'inherit'});
  if(result.status!==0)process.exit(result.status??1);
 }
}
const result=spawnSync(process.execPath,['--check','server.js'],{stdio:'inherit'});process.exitCode=result.status??1;
