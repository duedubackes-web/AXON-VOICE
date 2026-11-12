export type IntegrationId="n8n"|"supabase"|"vercel"|"webhook"|"grok";
export const integrationCatalog:Record<IntegrationId,{name:string;purpose:string;status:"planned"|"optional";docs:string}>={
 n8n:{name:"n8n",purpose:"Automações com aprovação humana",status:"planned",docs:"https://docs.n8n.io/"},
 supabase:{name:"Supabase",purpose:"Autenticação e histórico com RLS",status:"planned",docs:"https://supabase.com/docs"},
 vercel:{name:"Vercel",purpose:"Hospedagem e variáveis seguras",status:"optional",docs:"https://vercel.com/docs"},
 webhook:{name:"Webhooks",purpose:"Eventos assinados para sistemas externos",status:"planned",docs:"https://developer.mozilla.org/en-US/docs/Web/HTTP"},
 grok:{name:"Grok (xAI)",purpose:"Possível provedor adicional para agentes, após validação",status:"planned",docs:"https://docs.x.ai/"}
};
