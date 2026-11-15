export function workspaceSummary({jobs,campaigns,assets,mediaAvailable}){
 const exports=jobs.list(),campaignList=campaigns.list(),images=assets.list();
 return {schemaVersion:1,counts:{campaigns:campaignList.length,approvedCampaigns:campaignList.filter(c=>c.status==='approved').length,images:images.length,exports:exports.length,readyExports:exports.filter(j=>j.status==='succeeded').length,pendingExports:exports.filter(j=>['queued','running'].includes(j.status)).length,failedExports:exports.filter(j=>j.status==='failed').length},mediaAvailable,
 recentCampaigns:campaignList.slice(0,5).map(c=>({id:c.id,title:c.title,status:c.status,revision:c.revision})),
 nextSteps:[{route:'studio',label:'Escrever e planejar um roteiro'},{route:'mediaLibrary',label:'Escolher imagens para as cenas'},{route:'campaigns',label:'Revisar textos e cortes'},{route:'integrations',label:'Abrir os acessos oficiais e preparar a distribuição'}],
 connectionNotice:'As conexões no ChatGPT são separadas das credenciais do servidor AXON.'};
}
