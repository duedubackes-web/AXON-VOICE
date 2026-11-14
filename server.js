import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {plan,regions} from './src/planner.js';
const files={'/':['index.html','text/html'],'/app.js':['app.js','text/javascript'],'/style.css':['style.css','text/css']};
export function makeServer(){return createServer(async(req,res)=>{
  const headers={'Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'",'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'};
  const send=(status,data,type='application/json')=>{res.writeHead(status,{...headers,'Content-Type':type+'; charset=utf-8'});res.end(type==='application/json'?JSON.stringify(data):data);};
  try{
    if(req.method==='GET' && req.url==='/api/capabilities')return send(200,{regions,planning:true,aiVoice:false,aiVideo:false,storage:'browser-indexeddb',authentication:false});
    if(req.method==='POST' && req.url==='/api/plan'){
      if(req.headers.origin && req.headers.origin!==`http://${req.headers.host}` && req.headers.origin!==`https://${req.headers.host}`)return send(403,{error:'Origem não permitida.'});
      if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'Envie JSON.'});
      let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>260000)return send(413,{error:'Roteiro muito grande.'});}
      try{return send(200,plan(JSON.parse(body)));}catch{return send(400,{error:'Roteiro ou opções inválidos.'});}
    }
    if(req.method==='GET' && files[req.url]){const [file,type]=files[req.url];return send(200,await readFile(fileURLToPath(new URL('./public/'+file,import.meta.url))),type);}
    return send(404,{error:'Não encontrado.'});
  }catch{return send(500,{error:'Não foi possível processar a solicitação.'});}
});}
if(process.argv[1]===fileURLToPath(import.meta.url))makeServer().listen(Number(process.env.PORT??3000),process.env.HOST??'127.0.0.1',()=>console.log('AXON-VOICE iniciado na porta '+(process.env.PORT??3000)));
