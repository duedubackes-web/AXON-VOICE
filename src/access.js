import {createHash,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
const hash=value=>createHash('sha256').update(value).digest();
export function createAccess({password='',publicOrigin='',secureCookies=publicOrigin.startsWith('https://')}={}){
  const secret=randomBytes(32);const failures=new Map();
  function token(){const expires=String(Date.now()+8*3600*1000);return expires+'.'+createHmac('sha256',secret).update(expires).digest('hex');}
  function valid(req){if(!password)return true;const cookie=req.headers.cookie?.split('; ').find(c=>c.startsWith('axon_session='))?.slice(13);if(!cookie)return false;const [expires,sig]=cookie.split('.');if(!/^\d{13}$/u.test(expires??'')||!sig||!/^([0-9a-f]{64})$/u.test(sig)||Number(expires)<Date.now())return false;return timingSafeEqual(Buffer.from(sig,'hex'),createHmac('sha256',secret).update(expires).digest());}
  return {enabled:Boolean(password),valid,
    sameOrigin(req){if(req.headers['sec-fetch-site']==='cross-site')return false;const origin=req.headers.origin;return !origin||origin===(publicOrigin||`http://${req.headers.host}`)||(!publicOrigin&&origin===`https://${req.headers.host}`);},
    login(req,value){const ip=req.socket.remoteAddress;const record=failures.get(ip)??{count:0,until:Date.now()+60000};if(record.until<Date.now()){record.count=0;record.until=Date.now()+60000;}if(record.count>=5)return {status:429,error:'Muitas tentativas. Aguarde um minuto.'};if(typeof value!=='string'||!timingSafeEqual(hash(value),hash(password))){record.count++;failures.set(ip,record);return {status:401,error:'Senha incorreta.'};}failures.delete(ip);return {status:200,cookie:`axon_session=${token()}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secureCookies?'; Secure':''}`};}
  };
}
