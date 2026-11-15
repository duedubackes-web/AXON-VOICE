const integrationCategory=i=>i.access?'creative':i.id==='automation'?'automation':'social';
const searchable=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/gu,'').toLocaleLowerCase('pt-BR');
export function selectIntegrations(integrations,search='',filter='all'){
 const query=searchable(search).trim();const priority={creative:0,automation:1,social:2};
 return integrations.filter(i=>(filter==='all'||integrationCategory(i)===filter)&&searchable(`${i.name} ${i.purpose}`).includes(query)).sort((a,b)=>priority[integrationCategory(a)]-priority[integrationCategory(b)]);
}
const $=id=>document.getElementById(id);
const node=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
export function setupIntegrationHub({api,status}){
 let catalog=null;

 function render(){
  if(!catalog)return;const search=$('integrationSearch').value.trim().toLocaleLowerCase('pt-BR'),filter=$('integrationFilter').value;
  const items=selectIntegrations(catalog.integrations,search,filter);
  $('integrationResults').textContent=`${items.length} de ${catalog.integrations.length} integrações exibidas`;
  $('integrationList').replaceChildren(...items.map(i=>{
   const card=node('article');const names={'not-configured':'Configuração necessária','configured-not-verified':'Configurado no servidor · destino não testado','export-ready':'Pacote editorial disponível','external-status-not-monitored':'Acesso externo · confira o estado na conversa'};
   card.append(node('h3',i.name),node('p',names[i.status]??i.status,'job-status'),node('p',i.purpose,'hint'));
   if(i.access){card.classList.add('provider-access');const primary=i.access.links.find(l=>l.url.startsWith('https://app.'));if(primary){const open=node('a','Abrir '+i.name,'job-download');open.href=i.access.links.find(l=>/Entrar|Abrir Runway/u.test(l.label))?.url??primary.url;open.target='_blank';open.rel='noopener noreferrer';card.append(open);}
    card.append(node('p',i.access.desktopNote,'hint'));const details=node('details'),summary=node('summary','Cadastro, downloads e autorização');details.append(summary);const links=node('div',undefined,'provider-links');for(const entry of i.access.links){const a=node('a',entry.label,'provider-link');a.href=entry.url;a.target='_blank';a.rel='noopener noreferrer';links.append(a);}const steps=node('ol');for(const text of i.access.steps)steps.append(node('li',text));details.append(links,steps);card.append(details,node('p',i.access.nextAction,'hint'),node('p','A página AXON não monitora a conexão do ChatGPT nem recebe automaticamente suas credenciais.','hint'));
   }else if(i.id==='automation'){const a=node('a','Ver instruções de automação','provider-link');a.href='/guides/automation';a.target='_blank';a.rel='noopener noreferrer';card.append(a);}
   else{const a=node('a','Preparar campanha','provider-link');a.href='#campaigns';card.append(a);}
   return card;
  }));
  if(!items.length)$('integrationList').append(node('p','Nenhuma integração corresponde à busca. Limpe os filtros para ver todas.','hint'));
 }
 $('integrationSearch').oninput=render;$('integrationFilter').onchange=render;
 async function refresh(){catalog=await api('/api/integrations');render();}
 $('refreshIntegrations').onclick=()=>refresh().catch(e=>status(e.message));
 return {refresh,setCatalog(value){catalog=value;render();}};
}
