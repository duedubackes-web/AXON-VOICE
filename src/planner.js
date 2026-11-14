export const regions = {
  neutral: {name:'Brasileiro neutro',direction:'Dicção clara e ritmo natural.'},
  sul: {name:'Sul',direction:'Referência regional sulista; valide com locutores locais, sem caricatura.'},
  nordeste: {name:'Nordeste',direction:'Escolha uma variedade local com o locutor; Nordeste não é um sotaque único.'},
  minas: {name:'Minas Gerais',direction:'Conversa acolhedora; preservar a identidade do locutor.'},
  rio: {name:'Rio de Janeiro',direction:'Conversação espontânea; intensidade definida pelo locutor.'},
  sao_paulo: {name:'São Paulo',direction:'Ritmo conversacional; variedade escolhida pelo locutor.'}
};
export function plan(input) {
  if (!input || typeof input.script !== 'string' || !input.script.trim() || input.script.length > 60000) throw new Error('Informe um roteiro entre 1 e 60.000 caracteres.');
  const region = input.region ?? 'neutral';
  if (!Object.hasOwn(regions,region)) throw new Error('Perfil regional inválido.');
  const format = input.format ?? '16:9';
  if (!['16:9','9:16','1:1'].includes(format)) throw new Error('Formato inválido.');
  const sentences = input.script.trim().match(/[^.!?]+[.!?]+|[^.!?]+$/gu) ?? [];
  const scenes=[]; let text='';
  for (const sentence of sentences) {
    const words=sentence.trim().split(/\s+/u);
    // Split oversized sentences too: no scene can exceed the narration budget.
    for (const word of words) {
      if (text && text.split(/\s+/u).length >= 32) {scenes.push(text);text='';}
      text += (text?' ':'')+word;
    }
  }
  if(text) scenes.push(text);
  let cursor=0;
  const timeline=scenes.map((narration,i)=>{const duration=Math.max(3,Math.ceil(narration.split(/\s+/u).length/2.5));const scene={id:`scene-${i+1}`,start:cursor,duration,narration,visualPrompt:`Plano ${i+1}: ${narration}`,status:'planned'};cursor+=duration;return scene;});
  return {schemaVersion:1,title:String(input.title??'Novo projeto').slice(0,120),format,region,voiceDirection:regions[region].direction,duration:cursor,scenes:timeline,renderStatus:'not-configured',notice:'Planejamento determinístico. Nenhum áudio ou vídeo de IA foi gerado.'};
}
function stamp(sec){const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return [h,m,s].map(v=>String(v).padStart(2,'0')).join(':')+',000';}
export function srt(project){return project.scenes.map((s,i)=>`${i+1}\n${stamp(s.start)} --> ${stamp(s.start+s.duration)}\n${s.narration}\n`).join('\n');}
