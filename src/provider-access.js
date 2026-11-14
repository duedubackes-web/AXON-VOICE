// Public destinations checked against the providers' official documentation on 2026-11-14.
// No account IDs, personal workspace details, or credentials belong in this registry.
export const providerAccess={
 metricool:{
  desktopNote:'No computador, use o navegador. Os downloads abaixo são para celular.',
  links:[
   {label:'Criar conta Metricool',url:'https://app.metricool.com/register'},
   {label:'Entrar no Metricool',url:'https://app.metricool.com/login'},
   {label:'Conectar Metricool ao ChatGPT',url:'https://chatgpt.com/apps/metricool-for-social-media/asdk_app_69d73fc8aa5c8191bec1583760b130c7'},
   {label:'Baixar para Android',url:'https://play.google.com/store/apps/details?id=com.ionicframework.metricool185346'},
   {label:'Baixar para iPhone',url:'https://apps.apple.com/us/app/metricool/id1072510529'},
   {label:'Guia oficial de autorização',url:'https://help.metricool.com/pt/como-conectar-o-mcp-do-metricool-ao-chatgpt-0lrl3'}
  ],
  steps:['Crie sua conta ou entre pelo site oficial.','Vincule a rede social desejada à sua marca no Metricool.','Abra a conexão do Metricool no ChatGPT e conclua o fluxo oficial de autorização.','Depois de conectar, peça ao assistente para consultar as marcas. Publicar exige definir conta, conteúdo e horário.'],
  nextAction:'Se o Metricool informar que não há redes conectadas, vincule pelo menos uma antes de consultar dados sociais.'
 },
 runway:{
  desktopNote:'No computador, use o Runway no navegador. Os aplicativos abaixo são móveis.',
  links:[
   {label:'Criar conta Runway',url:'https://app.runwayml.com/signup'},
   {label:'Abrir Runway',url:'https://app.runwayml.com/'},
   {label:'Conectar Runway ao ChatGPT',url:'https://chatgpt.com/plugins/plugin_asdk_app_6a05e3b201788191be12b590b43e6ce3'},
   {label:'Baixar para Android',url:'https://play.google.com/store/apps/details?id=com.runwayml.prod'},
   {label:'Baixar para iPhone',url:'https://apps.apple.com/us/app/runway-ai-image-video/id1665024375'},
   {label:'Guia oficial de conexão',url:'https://runway.com/mcp'}
  ],
  steps:['Crie sua conta e conclua a verificação solicitada pelo Runway.','Abra a conexão do Runway no ChatGPT, entre na conta e escolha o workspace.','Confirme as capacidades do workspace antes de iniciar uma geração.','Abra uma campanha no AXON e baixe o brief de cenas. Revise o custo e o conteúdo antes de gerar.'],
  nextAction:'A autenticação e a disponibilidade de modelos são verificações separadas. O plano pode limitar a geração de vídeo.'
 }
};
export function providerBrief(campaign,provider){
 if(!Object.hasOwn(providerAccess,provider))throw Object.assign(new Error('Provedor não encontrado.'),{status:404});
 const header=[`AXON VOICE — ${provider==='runway'?'BRIEF DE CENAS PARA RUNWAY':'GUIA DE POSTAGEM PARA METRICOOL'}`,`Campanha: ${campaign.title}`,`ID: ${campaign.id}`,`Revisão: ${campaign.revision}`,`Estado: ${campaign.status==='approved'?'Aprovada':'Rascunho — revisar antes de usar'}`,`Marca: ${campaign.brand.name}`,`Público: ${campaign.brand.audience}`,`Tom editorial: ${campaign.brand.tone}`,'Material para uso manual. Nenhum conteúdo foi enviado, gerado ou publicado por este download.',''];
 if(provider==='runway'){
  header.push(`Formato de referência: ${campaign.source.format}`,`Direção vocal: ${campaign.source.voiceDirection}`,`Pronúncia: ${campaign.brand.pronunciation}`,'As durações abaixo são estimativas do roteiro; ajuste cada geração aos limites do modelo.','Os IDs de imagem referem-se à biblioteca local AXON; não são URLs públicas. Envie ao provedor apenas arquivos autorizados.','');
  for(const scene of campaign.source.scenes)header.push(`${scene.id} | ${scene.start}s–${scene.start+scene.duration}s`,`Direção visual: ${scene.visualPrompt}`,`Narração de referência: ${scene.narration}`,`Imagem local: ${scene.imageAssetId??'sem imagem selecionada'}`,'');
 }else{
  header.push('Este arquivo não é um formato de importação nativo do Metricool. Use os textos no editor ou entregue o pacote ao assistente após conectar a conta.','Escolha a marca, os perfis, os arquivos de mídia, o fuso e o horário no Metricool antes de publicar.','');
  for(const item of campaign.posts)header.push(`REDE: ${item.platform}`,`Título: ${item.title}`,`Formato sugerido: ${item.format}`,'Texto:',item.caption,`Link rastreado: ${item.trackedUrl??''}`,'');
 }
 return header.join('\n');
}
