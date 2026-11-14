import {lookup as dnsLookup} from 'node:dns/promises';
import {request} from 'node:https';
import {isIP} from 'node:net';
import {createHmac} from 'node:crypto';

// Outbound delivery is allowed only to an administrator-configured HTTPS host.
export function isPublicIP(address){
 if(isIP(address)===4){const [a,b]=address.split('.').map(Number);return !(a===0||a===10||a===127||a>=224||(a===100&&b>=64&&b<=127)||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&(b===0||b===168))||(a===198&&(b===18||b===19||b===51))||(a===203&&b===0));}
 if(isIP(address)===6){const normalized=address.toLowerCase();if(!/^[23][0-9a-f]{3}:/u.test(normalized)||normalized.startsWith('2002:')||normalized.startsWith('3fff:'))return false;const parts=normalized.split(':');if(parts[0]==='2001'&&(parseInt(parts[1]||'0',16)<0x200||parseInt(parts[1],16)===0xdb8))return false;return true;}
 return false;
}
export function webhookConfig(env=process.env){
 try{const url=new URL(env.AXON_AUTOMATION_WEBHOOK_URL);const hosts=(env.AXON_AUTOMATION_ALLOWED_HOSTS??'').split(',').map(h=>h.trim().toLowerCase()).filter(Boolean);
 if(url.protocol!=='https:'||url.username||url.password||url.hash||(url.port&&url.port!=='443')||!hosts.includes(url.hostname.toLowerCase())||isIP(url.hostname.replace(/^\[|\]$/gu,''))||url.hostname==='localhost'||url.hostname.endsWith('.localhost')||url.hostname.endsWith('.local'))return null;
 if((env.AXON_AUTOMATION_SIGNING_SECRET??'').length<32||(env.AXON_AUTOMATION_TOKEN??'').length<24)return null;
 return {url,secret:env.AXON_AUTOMATION_SIGNING_SECRET,token:env.AXON_AUTOMATION_TOKEN};}catch{return null;}
}
export function sign(secret,timestamp,body){return 'sha256='+createHmac('sha256',secret).update(timestamp+'.'+body).digest('hex');}
export function createAutomation({env=process.env,lookup=dnsLookup,transport=request}={}){
 const config=webhookConfig(env);
 return {configured:Boolean(config),
  status(){return {id:'automation',name:'n8n / workflow HTTPS',status:config?'configured-not-verified':'not-configured',purpose:'Enviar campanha aprovada ao workflow configurado',directSocialPublishing:false};},
  async send(event){
   if(!config)throw Error('Automação não configurada.');
   let timer;const addresses=await Promise.race([lookup(config.url.hostname,{all:true}),new Promise((_resolve,reject)=>{timer=setTimeout(()=>reject(Error('DNS timeout')),5000);})]).finally(()=>clearTimeout(timer));if(!addresses.length||addresses.some(r=>!isPublicIP(r.address)))throw Error('Destino de rede não permitido.');
   const address=addresses[0],body=JSON.stringify(event),timestamp=String(Math.floor(Date.now()/1000));
   return new Promise((resolve,reject)=>{
    // Pin the validated IP in the TLS request to prevent DNS rebinding.
    const req=transport(config.url,{method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body),'X-Axon-Token':config.token,'X-Axon-Event-Id':event.eventId,'X-Axon-Timestamp':timestamp,'X-Axon-Signature':sign(config.secret,timestamp,body)},lookup:(_host,_options,callback)=>_options?.all?callback(null,[address]):callback(null,address.address,address.family),servername:config.url.hostname},res=>{res.resume();resolve({accepted:res.statusCode>=200&&res.statusCode<300,status:res.statusCode});});
    const timer=setTimeout(()=>req.destroy(Error('Timeout de automação.')),15000);req.on('error',reject);req.on('close',()=>clearTimeout(timer));req.end(body);
   });
  }
 };
}
export function integrationCatalog(automation){return {automaticPublishing:false,integrations:[automation.status(),...[
 ['youtube','YouTube'],['instagram','Instagram'],['tiktok','TikTok'],['linkedin','LinkedIn'],['whatsapp','WhatsApp']
 ].map(([id,name])=>({id,name,status:'export-ready',purpose:'Pacote editorial para revisão e publicação manual',directSocialPublishing:false})),{id:'metricool',name:'Metricool',status:'external-connection-required',purpose:'Gestão social via conexão externa; não integrado ao runtime AXON',directSocialPublishing:false},{id:'runway',name:'Runway',status:'external-connection-required',purpose:'Geração de vídeo via conexão externa; não integrado ao runtime AXON',directSocialPublishing:false}]};}
