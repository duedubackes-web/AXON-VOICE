export function setupWorkspace({api,status,openCampaign}){
 const $=id=>document.getElementById(id);let dirty=true;
 async function refresh(){
  const summary=await api('/api/workspace');dirty=false;
  for(const [id,value] of Object.entries({campaignCount:summary.counts.campaigns,imageCount:summary.counts.images,readyCount:summary.counts.readyExports,pendingCount:summary.counts.pendingExports}))$(id).textContent=String(value);
  $('workspaceHealth').textContent=summary.mediaAvailable?'Renderizador disponível neste servidor':'Planejamento disponível; FFmpeg ausente neste servidor';
  const recent=$('recentCampaigns');recent.replaceChildren();if(!summary.recentCampaigns.length){const p=document.createElement('p');p.className='hint';p.textContent='Sua primeira campanha começa com um roteiro no Estúdio.';recent.append(p);}
  for(const campaign of summary.recentCampaigns){const card=document.createElement('article'),h=document.createElement('h3'),p=document.createElement('p'),button=document.createElement('button');h.textContent=campaign.title;p.className='hint';p.textContent=`Revisão ${campaign.revision} · ${campaign.status==='approved'?'Aprovada':'Rascunho'}`;button.textContent='Abrir campanha';button.className='secondary';button.onclick=()=>openCampaign(campaign.id).catch(e=>status(e.message));card.append(h,p,button);recent.append(card);}
 }
 $('refreshWorkspace').onclick=()=>refresh().catch(e=>status(e.message));
 return {refresh,invalidate(){dirty=true;},async enter(){if(dirty)await refresh();}};
}
