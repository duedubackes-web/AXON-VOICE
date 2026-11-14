import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,mkdir,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {plan} from '../src/planner.js';
import {renderVideo,mediaAvailable,command,normalizeAudio,assText,probe} from '../src/media.js';
const available=await mediaAvailable();
test('ASS text cannot inject subtitle commands',()=>{assert.equal(assText('Olá {\\pos(0,0)}\n%s'),'Olá pos(0,0) %s');});
test('real MP4 exports all formats, validates narration and handles a minute-long storyboard',{skip:!available,timeout:90000},async()=>{
 const dir=await mkdtemp(join(tmpdir(),'axon-media-'));
 try{
  const raw=join(dir,'source.wav');await command('ffmpeg',['-v','error','-f','lavfi','-i','sine=frequency=220:duration=3',raw]);
  const audio=join(dir,'audio.wav');const duration=await normalizeAudio(raw,audio,600);assert.equal(duration,3);
  await assert.rejects(()=>normalizeAudio(raw,join(dir,'invalid.wav'),1));
  for(const format of ['16:9','9:16','1:1']){
   const target=join(dir,format.replace(':','-'));await mkdir(target);const p=plan({script:'Olá, Brasil. Uma história original.',format});const result=await renderVideo(p,target,{audioPath:audio,audioDuration:duration});assert.equal(result.hasAudio,true);assert.equal(result.kind,'storyboard');assert.equal(result.subtitleTiming,'scaled-estimate');assert.ok(result.bytes>1000);assert.ok(result.duration>=3);const buffer=await readFile(join(target,'output.mp4'));assert.equal(buffer.subarray(4,8).toString(),'ftyp');
  }
  const target=join(dir,'long');await mkdir(target);const p=plan({script:Array(160).fill('história').join(' ')});assert.ok(p.duration>=60);const result=await renderVideo(p,target);assert.equal(result.hasAudio,false);assert.ok(result.duration>=60);assert.equal((await probe(join(target,'output.mp4'))).streams[0].codec_name,'h264');
 }finally{await rm(dir,{recursive:true,force:true});}
});
