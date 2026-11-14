import {platforms,csv} from './campaigns.js';
import {integrationCatalog} from './integrations.js';
export async function ecosystemRoutes({req,res,send,json,campaigns,automation}){
 const path=req.url;
 if(req.method==='GET'&&path==='/api/integrations'){send(200,integrationCatalog(automation));return true;}
 if(req.method==='GET'&&path==='/api/brand'){send(200,campaigns.brand);return true;}
 if(req.method==='PUT'&&path==='/api/brand'){send(200,await campaigns.saveBrand(await json(req)));return true;}
 if(req.method==='GET'&&path==='/api/platforms'){send(200,platforms);return true;}
 if(req.method==='GET'&&path==='/api/campaigns'){send(200,campaigns.list());return true;}
 if(req.method==='POST'&&path==='/api/campaigns'){send(201,await campaigns.create(await json(req)));return true;}
 const match=path?.match(/^\/api\/campaigns\/([0-9a-f-]+)(?:\/(approve|dispatch|csv|json|cut))?$/u);if(!match)return false;
 const [,id,action]=match;
 if(req.method==='GET'&&!action){send(200,campaigns.get(id));return true;}
 if(req.method==='PUT'&&!action){send(200,await campaigns.update(id,await json(req)));return true;}
 if(req.method==='DELETE'&&!action){await campaigns.remove(id);send(200,{deleted:true});return true;}
 if(req.method==='GET'&&action==='json'){send(200,campaigns.get(id),'application/json',{'Content-Disposition':`attachment; filename="axon-campaign-${id}.json"`});return true;}
 if(req.method==='GET'&&action==='csv'){send(200,csv(campaigns.get(id)),'text/csv',{'Content-Disposition':`attachment; filename="axon-campaign-${id}.csv"`});return true;}
 if(req.method==='POST'&&action==='approve'){const input=await json(req);send(200,await campaigns.approve(id,input.revision,input.confirm));return true;}
 if(req.method==='POST'&&action==='dispatch'){const input=await json(req);send(200,await campaigns.dispatch(id,input.revision,input.confirm,automation));return true;}
 if(req.method==='POST'&&action==='cut'){const input=await json(req),campaign=campaigns.get(id);const cut=campaign.cuts.find(c=>c.id===input.cutId);if(!cut){send(404,{error:'Corte não encontrado.'});return true;}send(200,{title:campaign.title+' · '+cut.id,script:cut.script,format:'9:16',region:campaign.source.region,sourceCampaignId:id,sourceSceneIds:cut.sceneIds,notice:'Roteiro de corte; o arquivo de vídeo ainda precisa ser renderizado.'});return true;}
 return false;
}
