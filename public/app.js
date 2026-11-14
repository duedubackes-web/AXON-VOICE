const $=id=>document.getElementById(id);
let project;
const db=new Promise((resolve,reject)=>{const r=indexedDB.open('axon-studio',1);r.onupgradeneeded=()=>r.result.createObjectStore('projects');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
async function save(value){const d=await db;await new Promise((resolve,reject)=>{const t=d.transaction('projects','readwrite');t.objectStore('projects').put(value,'latest');t.oncomplete=resolve;t.onerror=()=>reject(t.error);});}
async function latest(){const d=await db;return new Promise((resolve,reject)=>{const r=d.transaction('projects').objectStore('projects').get('latest');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
const status=text=>$('status').textContent=text;
function show(){
 $('result').hidden=false;$('projectTitle').textContent=project.title;$('duration').textContent=`${project.scenes.length} cenas · ${project.duration}s estimados`;$('direction').textContent=project.voiceDirection;
 $('scenes').replaceChildren(...project.scenes.map((scene,i)=>{const card=document.createElement('article');const h=document.createElement('h3');h.textContent=`CENA ${i+1} · ${scene.start}s — ${scene.start+scene.duration}s`;const p=document.createElement('p');p.textContent=scene.narration;const label=document.createElement('label');label.textContent='Direção visual';const input=document.createElement('textarea');input.rows=2;input.maxLength=2000;input.value=scene.visualPrompt;input.onchange=async()=>{scene.visualPrompt=input.value;try{await save(project);status('Direção visual salva neste navegador.');}catch{status('Não foi possível salvar. Exporte o projeto para preservar as alterações.');}};label.append(input);card.append(h,p,label);return card;}));
}
function download(content,type,name){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function time(n){return [Math.floor(n/3600),Math.floor(n%3600/60),n%60].map(v=>String(v).padStart(2,'0')).join(':')+',000';}
$('script').oninput=()=>$('count').textContent=$('script').value.length+' caracteres';
$('editor').onsubmit=async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;try{const r=await fetch('/api/plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:$('title').value,script:$('script').value,region:$('region').value,format:$('format').value})});const data=await r.json();if(!r.ok)throw Error(data.error);project=data;show();try{await save(project);status('Planejamento salvo neste navegador. Áudio e vídeo de IA ainda não estão conectados.');}catch{status('Planejamento criado. Armazenamento indisponível; exporte o projeto.');}}catch(error){status(error.message);}finally{b.disabled=false;}};
$('restore').onclick=async()=>{try{const p=await latest();if(!p)return status('Nenhum projeto salvo neste navegador.');project=p;$('title').value=p.title;$('format').value=p.format;$('region').value=p.region;$('script').value=p.scenes.map(s=>s.narration).join(' ');$('script').oninput();show();status('Último projeto recuperado.');}catch{status('Armazenamento local indisponível.');}};
$('json').onclick=()=>download(JSON.stringify(project,null,2),'application/json','axon-project.json');
$('srt').onclick=()=>download(project.scenes.map((s,i)=>`${i+1}\n${time(s.start)} --> ${time(s.start+s.duration)}\n${s.narration}\n`).join('\n'),'text/plain','axon-estimated.srt');
$('speak').onclick=()=>{if(!('speechSynthesis' in window))return status('Este navegador não oferece síntese de voz.');speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(project.scenes.map(s=>s.narration).join(' '));u.lang='pt-BR';u.onerror=()=>status('Prévia indisponível. Verifique as vozes instaladas no navegador.');speechSynthesis.speak(u);status('Prévia do navegador solicitada; sem garantia de sotaque regional.');};
$('stop').onclick=()=>{window.speechSynthesis?.cancel();status('Prévia interrompida.');};
let capabilities,uploadedAudio=null,pollTimer=null,renderAttempt=null;
async function api(url,options={}){const r=await fetch(url,options);let value;try{value=await r.json();}catch{throw Error('Servidor retornou uma resposta inválida.');}if(!r.ok){if(r.status===401){$('workspace').hidden=true;$('unlock').hidden=false;clearTimeout(pollTimer);}throw Error(value.error??'Não foi possível concluir.');}return value;}
const post=value=>({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});
function errorText(error){status(error.message);}
async function init(){
 try{const session=await api('/api/session');$('unlock').hidden=!session.locked;$('workspace').hidden=session.locked;if(session.locked)return;
 capabilities=await api('/api/capabilities');$('region').replaceChildren();for(const [id,r] of Object.entries(capabilities.regions)){const option=document.createElement('option');option.value=id;option.textContent=r.name;$('region').append(option);}
 $('renderLimit').textContent=`Exportação até ${capabilities.maxDuration/60} minutos por trabalho. Áudio até ${Math.floor(capabilities.maxUploadBytes/1024/1024)} MB. Requer FFmpeg no servidor.`;
 $('renderVideo').disabled=!capabilities.storyboardVideo;$('uploadAudio').disabled=!capabilities.ownNarration;
 if(!capabilities.storyboardVideo)status('Planejamento disponível. Instale FFmpeg e FFprobe para habilitar exportações.');
 await refreshJobs();
 }catch(error){errorText(error);}
}
$('login').onsubmit=async event=>{event.preventDefault();const button=event.submitter;button.disabled=true;try{await api('/api/login',post({password:$('password').value}));$('password').value='';await init();status('Estúdio desbloqueado.');}catch(error){errorText(error);}finally{button.disabled=false;}};
$('uploadAudio').onclick=async()=>{
 if(!$('rights').checked)return status('Confirme a autorização para usar esta gravação.');const file=$('audioFile').files[0];if(!file)return status('Selecione um arquivo de áudio.');if(file.size>capabilities.maxUploadBytes)return status('O arquivo excede o limite de upload.');
 const button=$('uploadAudio');button.disabled=true;
 try{const previous=uploadedAudio;uploadedAudio=await api('/api/audio',{method:'POST',headers:{'Content-Type':'application/octet-stream','X-Axon-Consent':'own-or-licensed'},body:file});$('audioStatus').textContent=`Narração carregada · ${Math.round(uploadedAudio.duration)} segundos. Os tempos das legendas serão estimados.`;status('Narração validada e pronta para a exportação.');if(previous)await api('/api/audio/'+previous.id,{method:'DELETE'}).catch(()=>{});}catch(error){errorText(error);}finally{button.disabled=false;}
};
$('clearAudio').onclick=async()=>{try{if(uploadedAudio)await api('/api/audio/'+uploadedAudio.id,{method:'DELETE'});uploadedAudio=null;$('audioFile').value='';$('audioStatus').textContent='Sem áudio: o MP4 será silencioso.';}catch(error){errorText(error);}};
$('renderVideo').onclick=async()=>{
 if(!project)return;const button=$('renderVideo');button.disabled=true;
 const input={title:project.title,script:project.scenes.map(s=>s.narration).join(' '),region:project.region,format:project.format,visualPrompts:project.scenes.map(s=>s.visualPrompt),audioId:uploadedAudio?.id};
 const signature=JSON.stringify(input);if(renderAttempt?.signature!==signature)renderAttempt={signature,key:crypto.randomUUID()};
 try{const job=await api('/api/jobs',{...post(input),headers:{'Content-Type':'application/json','Idempotency-Key':renderAttempt.key}});status('Exportação '+job.id.slice(0,8)+' · acompanhe abaixo.');await refreshJobs();}catch(error){errorText(error);}finally{button.disabled=false;}
};
const states={queued:'Na fila',running:'Renderizando',succeeded:'Pronto para baixar',failed:'Falhou',cancelled:'Cancelado'};
async function refreshJobs(){
 clearTimeout(pollTimer);const jobs=await api('/api/jobs');$('jobs').replaceChildren(...jobs.map(job=>{
 const article=document.createElement('article'),h=document.createElement('h3'),p=document.createElement('p'),actions=document.createElement('div');h.textContent=`Exportação ${job.id.slice(0,8)}`;p.className='job-status';p.textContent=states[job.status]??job.status;actions.className='actions';article.append(h,p);
 if(job.result){const details=document.createElement('p');details.textContent=`${job.result.width} × ${job.result.height} · ${Math.round(job.result.duration)}s · ${job.result.hasAudio?'com narração':'sem áudio'} · storyboard`;article.append(details);}
 if(job.error){const message=document.createElement('p');message.textContent=job.error;article.append(message);}
 if(job.status==='succeeded'){const a=document.createElement('a');a.href='/api/jobs/'+job.id+'/file';a.className='job-download';a.textContent='Baixar MP4';actions.append(a);}
 if(['failed','cancelled'].includes(job.status)){const retry=document.createElement('button');retry.className='secondary';retry.textContent='Tentar novamente';retry.onclick=async()=>{retry.disabled=true;try{await api('/api/jobs/'+job.id+'/retry',{method:'POST'});await refreshJobs();}catch(error){errorText(error);retry.disabled=false;}};actions.append(retry);}
 const b=document.createElement('button');b.className='secondary';const pending=['queued','running'].includes(job.status);b.textContent=pending?'Cancelar':'Excluir exportação';b.onclick=async()=>{b.disabled=true;try{await api('/api/jobs/'+job.id+(pending?'/cancel':''),{method:pending?'POST':'DELETE'});await refreshJobs();}catch(error){errorText(error);b.disabled=false;}};actions.append(b);article.append(actions);return article;
 }));
 if(jobs.some(j=>['queued','running'].includes(j.status)))pollTimer=setTimeout(()=>refreshJobs().catch(errorText),2000);
}
$('refreshJobs').onclick=()=>refreshJobs().catch(errorText);
await init();
