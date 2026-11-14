import {spawn} from 'node:child_process';
import {writeFile,stat} from 'node:fs/promises';
import {join} from 'node:path';

export function command(binary,args,{cwd,signal,timeout=120000}={}) {
  return new Promise((resolve,reject)=>{
    const child=spawn(binary,args,{cwd,stdio:['ignore','pipe','pipe'],shell:false});
    let output='';const abort=()=>child.kill('SIGKILL');if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
    const timer=setTimeout(()=>child.kill('SIGKILL'),timeout);
    child.stdout.on('data',d=>{output=(output+d).slice(-200000);});
    child.stderr.resume();
    child.on('error',e=>{clearTimeout(timer);reject(e);});
    child.on('close',code=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);code===0&&!signal?.aborted?resolve(output):reject(new Error(`Media process failed (${code})`));});
  });
}
export async function mediaAvailable(){try{await command('ffmpeg',['-version'],{timeout:5000});await command('ffprobe',['-version'],{timeout:5000});return true;}catch{return false;}}
const formats='wav,mp3,ogg,mov,matroska,webm,flac';
export async function probe(path,{safeAudio=false}={}){
  const args=['-v','error','-protocol_whitelist','file,pipe'];
  if(safeAudio)args.push('-format_whitelist',formats);
  args.push('-show_format','-show_streams','-of','json',path);
  return JSON.parse(await command('ffprobe',args,{timeout:15000}));
}
export async function normalizeAudio(source,target,maxDuration){
  const info=await probe(source,{safeAudio:true});
  const duration=Number(info.format?.duration);
  if(!info.streams?.some(s=>s.codec_type==='audio')||!Number.isFinite(duration)||duration<=0||duration>maxDuration)throw new Error('Áudio inválido ou acima do limite de duração.');
  await command('ffmpeg',['-nostdin','-v','error','-y','-protocol_whitelist','file,pipe','-format_whitelist',formats,'-i',source,'-map','0:a:0','-vn','-t',String(maxDuration),'-ac','1','-ar','24000','-c:a','pcm_s16le',target],{timeout:60000});
  const result=await probe(target);return Number(result.format.duration);
}
export const dimensions={'16:9':[1280,720],'9:16':[720,1280],'1:1':[720,720]};
export function assText(text){return String(text).replace(/[{}\\]/gu,'').replace(/[\r\n\u0000-\u001f]/gu,' ').trim();}
function clock(sec){const n=Math.round(sec*100);return `${Math.floor(n/360000)}:${String(Math.floor(n%360000/6000)).padStart(2,'0')}:${String(Math.floor(n%6000/100)).padStart(2,'0')}.${String(n%100).padStart(2,'0')}`;}
export function captions(project,duration){
  const [width,height]=dimensions[project.format];
  const scale=duration/project.duration;
  let ass=`[Script Info]\nScriptType: v4.00+\nPlayResX: ${width}\nPlayResY: ${height}\nWrapStyle: 0\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Main,DejaVu Sans,${project.format==='16:9'?36:32},&H00FFFFFF,&H00FFFFFF,&H0019100D,&H9019100D,0,0,0,0,100,100,0,0,1,2,0,5,65,65,45,1\nStyle: Top,DejaVu Sans,24,&H00FFBCA9,&H00FFBCA9,&H0019100D,&H0019100D,1,0,0,0,100,100,0,0,1,0,0,8,50,50,50,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
  ass+=`Dialogue: 0,${clock(0)},${clock(duration)},Top,,0,0,0,,AXON VOICE · STORYBOARD\n`;
  for(const scene of project.scenes)ass+=`Dialogue: 0,${clock(scene.start*scale)},${clock((scene.start+scene.duration)*scale)},Main,,0,0,0,,${assText(scene.narration)}\n`;
  return ass;
}
export async function renderVideo(project,directory,{audioPath,audioDuration,signal,maxDuration=600}={}){
  const duration=audioDuration??project.duration;
  if(!Number.isFinite(duration)||duration<=0||duration>maxDuration)throw new Error('Duração acima do limite de renderização.');
  const [width,height]=dimensions[project.format];
  await writeFile(join(directory,'captions.ass'),captions(project,duration));
  const args=['-nostdin','-hide_banner','-v','error','-y','-f','lavfi','-i',`color=c=0x101624:s=${width}x${height}:r=24:d=${duration}`];
  if(audioPath)args.push('-protocol_whitelist','file,pipe','-i',audioPath);
  args.push('-vf',`drawbox=x=0:y=0:w=iw:h=12:color=0xaa91ff:t=fill,ass=filename=captions.ass`,'-map','0:v:0');
  if(audioPath)args.push('-map','1:a:0','-c:a','aac','-b:a','128k');else args.push('-an');
  args.push('-t',String(duration),'-c:v','libx264','-preset','ultrafast','-crf','23','-pix_fmt','yuv420p','-threads','2','-movflags','+faststart','output.mp4');
  await command('ffmpeg',args,{cwd:directory,signal,timeout:Math.max(120000,duration*4000)});
  const target=join(directory,'output.mp4');const info=await probe(target);
  const video=info.streams?.find(s=>s.codec_type==='video');
  if(!video||video.width!==width||video.height!==height||Number(info.format?.duration)<duration-0.5)throw new Error('Arquivo exportado não passou na validação.');
  return {duration:Number(info.format.duration),bytes:(await stat(target)).size,width,height,hasAudio:info.streams.some(s=>s.codec_type==='audio'),subtitleTiming:audioPath?'scaled-estimate':'estimated',kind:'storyboard'};
}
