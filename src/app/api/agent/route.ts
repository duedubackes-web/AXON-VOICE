import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {buildAgentInstructions,safeRole} from "@/lib/agents";
export const runtime="nodejs";
const schema=z.object({
 role:z.enum(["roteirista","regionalista","diretor","suporte"]),
 messages:z.array(z.object({role:z.enum(["user","assistant"]),content:z.string().min(1).max(3000)})).min(1).max(12)
});
export async function POST(request:NextRequest){
 try{
  if(Number(request.headers.get("content-length")||0)>35000)return NextResponse.json({error:"Mensagem muito grande."},{status:413});
  const parsed=schema.safeParse(await request.json());
  if(!parsed.success||parsed.data.messages.at(-1)?.role!=="user")return NextResponse.json({error:"Conversa inválida."},{status:400});
  const apiKey=process.env.OPENAI_API_KEY;
  if(!apiKey)return NextResponse.json({error:"Assistente indisponível: configure OPENAI_API_KEY no servidor."},{status:503});
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),25000);
  let response:Response;
  try{
   response=await fetch("https://api.openai.com/v1/chat/completions",{
    method:"POST",cache:"no-store",signal:controller.signal,
    headers:{"Authorization":`Bearer ${apiKey}`,"Content-Type":"application/json"},
    body:JSON.stringify({model:process.env.OPENAI_CHAT_MODEL||"gpt-4o-mini",temperature:0.5,max_tokens:600,
      messages:[{role:"system",content:buildAgentInstructions(safeRole(parsed.data.role))},...parsed.data.messages]})
   });
  }finally{clearTimeout(timer);}
  if(!response.ok)return NextResponse.json({error:"O assistente não conseguiu responder."},{status:502});
  const data=await response.json();
  const answer=data?.choices?.[0]?.message?.content;
  if(typeof answer!=="string"||!answer.trim())return NextResponse.json({error:"Resposta vazia do assistente."},{status:502});
  return NextResponse.json({answer:answer.slice(0,6000)},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Falha ao processar a conversa."},{status:400});}
}
