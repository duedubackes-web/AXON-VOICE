import {mkdir,readdir,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {atomicJSON,validId} from './jobs.js';
import {plan} from './planner.js';
export const platforms={
 youtube:{name:'YouTube',format:'16:9',captionBudget:1600},
 instagram:{name:'Instagram',format:'9:16',captionBudget:700},
 tiktok:{name:'TikTok',format:'9:16',captionBudget:350},
 linkedin:{name:'LinkedIn',format:'16:9',captionBudget:1000},
 whatsapp:{name:'WhatsApp',format:'9:16',captionBudget:450}
};
export const defaultBrand={name:'Minha marca',audience:'',tone:'Claro e acolhedor',cta:'Conheça a história completa.',website:'',hashtags:[],avoid:[],pronunciation:''};
const error=(message,status=400)=>Object.assign(new Error(message),{status});
function string(value,max,name){if(typeof value!=='string'||value.length>max)throw error(`${name}: texto inválido ou muito longo.`);return value.trim();}
export function validateBrand(input){
 if(!input||typeof input!=='object')throw error('Marca inválida.');
 const result={};for(const [key,max] of Object.entries({name:100,audience:300,tone:200,cta:300,website:1000,pronunciation:2000}))result[key]=string(input[key]??defaultBrand[key],max,key);
 if(!result.name)throw error('Informe o nome da marca.');
 if(result.website){let url;try{url=new URL(result.website);}catch{throw error('Endereço da marca inválido.');}if(url.protocol!=='https:'||url.username||url.password)throw error('Use um endereço HTTPS sem credenciais.');result.website=url.href;}
 for(const key of ['hashtags','avoid']){if(!Array.isArray(input[key]??[])||(input[key]??[]).length>20)throw error('Use até 20 termos por lista.');result[key]=[...new Set((input[key]??[]).map(value=>string(value,60,key)).filter(Boolean))];}
 result.hashtags=result.hashtags.map(t=>t.replace(/^#/u,''));if(result.hashtags.some(t=>!(/^[\p{L}\p{N}_]+$/u.test(t))))throw error('Hashtags devem conter apenas letras, números e sublinhado.');return result;
}
const clip=(text,max)=>Array.from(text).slice(0,max).join('');
export function trackedLink(website,platform,campaign){if(!website)return '';const url=new URL(website);url.searchParams.set('utm_source',platform);url.searchParams.set('utm_medium','social');url.searchParams.set('utm_campaign',campaign);return url.href;}
export function suggestCuts(project,maxSeconds=60){
 const cuts=[];let group=[],duration=0;
 const flush=()=>{if(!group.length)return;cuts.push({id:`cut-${cuts.length+1}`,start:group[0].start,end:group.at(-1).start+group.at(-1).duration,duration,sceneIds:group.map(s=>s.id),script:group.map(s=>s.narration).join(' '),format:'9:16',reason:'Agrupamento por duração e limites de cena; revise o contexto antes de publicar.'});group=[];duration=0;};
 for(const scene of project.scenes){if(duration+scene.duration>maxSeconds)flush();group.push(scene);duration+=scene.duration;}flush();return cuts.slice(0,12);
}
export function campaignWarnings(campaign){
 const text=[...campaign.posts.map(p=>p.title+' '+p.caption),...campaign.source.scenes.map(s=>s.narration)].join(' ').toLocaleLowerCase('pt-BR');
 return campaign.brand.avoid.filter(term=>text.includes(term.toLocaleLowerCase('pt-BR'))).map(term=>`Revisar termo da marca: ${term}`);
}
export function createCampaign(input,brand){
 if(!input||!Array.isArray(input.platforms)||!input.platforms.length||input.platforms.length>5||new Set(input.platforms).size!==input.platforms.length||input.platforms.some(id=>!Object.hasOwn(platforms,id)))throw error('Selecione plataformas válidas.');
 let project;try{project=plan(input);}catch(e){throw error(e.message);}if(input.visualPrompts!==undefined){if(!Array.isArray(input.visualPrompts)||input.visualPrompts.length!==project.scenes.length||input.visualPrompts.some(v=>typeof v!=='string'||v.length>2000))throw error('Direções visuais inválidas.');project.scenes.forEach((s,i)=>s.visualPrompt=input.visualPrompts[i]);}const id=randomUUID();const script=project.scenes.map(s=>s.narration).join(' ');
 const campaign={id,schemaVersion:1,revision:1,title:project.title,createdAt:new Date().toISOString(),status:'draft',brand:structuredClone(brand),source:project,cuts:suggestCuts(project),posts:input.platforms.map(platform=>{
  const spec=platforms[platform],url=trackedLink(brand.website,platform,id),hashtags=brand.hashtags.slice(0,5).map(t=>'#'+t).join(' ');
  const tail=[brand.cta,url,hashtags].filter(Boolean).join('\n');
  return {platform,title:clip(project.title,70),format:spec.format,caption:[clip(script,Math.max(0,spec.captionBudget-tail.length-2)),tail].filter(Boolean).join('\n\n'),trackedUrl:url};
 }),approval:null,deliveries:[],notice:'Adaptação por regras editoriais. Não é texto gerado por IA nem publicação nas redes.'};
 campaign.warnings=campaignWarnings(campaign);return campaign;
}
export function csv(campaign){const cell=value=>'"'+String(/^[\s\u0000-\u001f]*[=+@-]|^[\t\r\n]/u.test(String(value))?"'"+value:value).replaceAll('"','""')+'"';return [['platform','title','caption','format','tracked_url'],...campaign.posts.map(p=>[p.platform,p.title,p.caption,p.format,p.trackedUrl])].map(row=>row.map(cell).join(',')).join('\r\n');}
export function dispatchPayload(campaign,eventId){return {event:'axon.campaign.approved',schemaVersion:1,eventId,campaignId:campaign.id,revision:campaign.revision,title:campaign.title,brand:campaign.brand,posts:campaign.posts,cuts:campaign.cuts,approvedAt:campaign.approval.approvedAt,publicationRequested:false};}
export class CampaignStore {
 constructor(root){this.root=root;this.chain=Promise.resolve();this.campaigns=new Map();this.brand=structuredClone(defaultBrand);}
 serial(action){const task=this.chain.then(action);this.chain=task.catch(()=>{});return task;}
 async init(){await mkdir(join(this.root,'campaigns'),{recursive:true,mode:0o700});try{this.brand=validateBrand(JSON.parse(await readFile(join(this.root,'brand.json'),'utf8')));}catch{}for(const file of await readdir(join(this.root,'campaigns'))){const id=file.replace(/\.json$/u,'');if(!validId(id))continue;try{const c=JSON.parse(await readFile(join(this.root,'campaigns',file),'utf8'));if(c.id!==id)continue;let changed=false;for(const d of c.deliveries??[]){if(d.status==='sending'){d.status='unknown';changed=true;}}if(changed)await this.persist(c);this.campaigns.set(id,c);}catch{}}return this;}
 async persist(c){await atomicJSON(join(this.root,'campaigns',c.id+'.json'),c);}
 get(id){const c=this.campaigns.get(id);if(!c)throw error('Campanha não encontrada.',404);return structuredClone(c);}
 list(){return [...this.campaigns.values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(c=>({id:c.id,title:c.title,revision:c.revision,status:c.status,createdAt:c.createdAt,platforms:c.posts.map(p=>p.platform),warnings:c.warnings,deliveries:c.deliveries}));}
 async saveBrand(input){return this.serial(async()=>{const brand=validateBrand(input);await atomicJSON(join(this.root,'brand.json'),brand);this.brand=brand;return structuredClone(brand);});}
 async create(input){return this.serial(async()=>{if(this.campaigns.size>=100)throw error('Limite de 100 campanhas atingido.',409);const c=createCampaign(input,this.brand);await this.persist(c);this.campaigns.set(c.id,c);return structuredClone(c);});}
 async update(id,input){return this.serial(async()=>{const c=this.get(id);if(input.revision!==c.revision)throw error('A campanha mudou. Reabra antes de editar.',409);if(!Array.isArray(input.posts)||input.posts.length!==c.posts.length)throw error('Publicações inválidas.');
 c.posts=c.posts.map((original,i)=>{const edit=input.posts[i];if(!edit||edit.platform!==original.platform)throw error('Plataforma inválida.');return {...original,title:string(edit.title,120,'Título'),caption:string(edit.caption,5000,'Legenda')};});
 c.revision++;c.status='draft';c.approval=null;c.warnings=campaignWarnings(c);await this.persist(c);this.campaigns.set(id,c);return structuredClone(c);});}
 async approve(id,revision,confirm){return this.serial(async()=>{const c=this.get(id);if(c.revision!==revision)throw error('A revisão mudou. Reabra a campanha.',409);if(confirm!=='reviewed-content-and-rights')throw error('Revise o conteúdo e confirme os direitos de uso.');if(c.warnings.length)throw error('Remova os termos sinalizados antes de aprovar.',409);c.status='approved';c.approval={revision,approvedAt:new Date().toISOString()};await this.persist(c);this.campaigns.set(id,c);return structuredClone(c);});}
 async dispatch(id,revision,confirm,integration){return this.serial(async()=>{
 const c=this.get(id);if(c.revision!==revision||c.approval?.revision!==revision)throw error('Aprove a revisão atual antes de enviar.',409);
 if(confirm!=='send-reviewed-campaign')throw error('Confirme o envio desta campanha ao workflow.');
 if(!integration.configured)throw error('Configure a integração de automação no servidor.',503);
 const previous=c.deliveries.find(d=>d.revision===revision);if(previous)return {campaign:c,delivery:previous,reused:true};
 const eventId=randomUUID(),delivery={eventId,revision,status:'sending',createdAt:new Date().toISOString()};c.deliveries.push(delivery);await this.persist(c);this.campaigns.set(id,c);
 try{const response=await integration.send(dispatchPayload(c,eventId));delivery.status=response.accepted?'delivered':'unknown';delivery.httpStatus=response.status;}catch{delivery.status='unknown';}
 delivery.finishedAt=new Date().toISOString();await this.persist(c);this.campaigns.set(id,c);return {campaign:structuredClone(c),delivery:structuredClone(delivery),reused:false};
 });}
 async remove(id){return this.serial(async()=>{this.get(id);await rm(join(this.root,'campaigns',id+'.json'));this.campaigns.delete(id);});}
}
