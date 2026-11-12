import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { regions, emotions, regionalGuide } from "@/lib/regions";
import { validateText } from "@/lib/voice";

export const runtime="nodejs";
const schema=z.object({
 text:z.string(), region:z.enum(["neutral","gaucho","catarinense","carioca","paulista","mineiro","baiano","pernambucano"]),
 emotion:z.enum(["natural","alegre","serio","acolhedor"]), intensity:z.number().min(0).max(100)
});
export async function POST(request:NextRequest){
 try{
  const length=Number(request.headers.get("content-length")||0);
  if(length>12000) return NextResponse.json({error:"Requisição muito grande."},{status:413});
  const data=schema.safeParse(await request.json());
  if(!data.success) return NextResponse.json({error:"Parâmetros inválidos."},{status:400});
  const text=validateText(data.data.text);
  const apiKey=process.env.OPENAI_API_KEY;
  if(!apiKey) return NextResponse.json({error:"Provedor de áudio não configurado. Adicione OPENAI_API_KEY no ambiente do servidor."},{status:503});
  const voice=process.env.OPENAI_TTS_VOICE||"alloy";
  const model=process.env.OPENAI_TTS_MODEL||"tts-1";
  // 'instructions' are supported by newer TTS models, not by tts-1 or tts-1-hd.
  const supportsInstructions=!["tts-1","tts-1-hd"].includes(model);
  const body:Record<string,unknown>={model,voice,input:text,response_format:"mp3"};
  if(supportsInstructions) body.instructions=regionalGuide(data.data.region,data.data.intensity,data.data.emotion);
  const abort=new AbortController(); const timeout=setTimeout(()=>abort.abort(),30000);
  let upstream:Response;
  try{
   upstream=await fetch("https://api.openai.com/v1/audio/speech",{
    method:"POST",headers:{"Authorization":`Bearer ${apiKey}`,"Content-Type":"application/json"},
    body:JSON.stringify(body),signal:abort.signal,cache:"no-store"
   });
  }finally{clearTimeout(timeout);}
  if(!upstream.ok) return NextResponse.json({error:"O provedor de voz não concluiu a geração. Verifique a configuração e tente novamente."},{status:502});
  return new NextResponse(await upstream.arrayBuffer(),{headers:{"Content-Type":"audio/mpeg","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
 }catch(err){
  const message=err instanceof Error?err.message:"Erro ao gerar áudio.";
  return NextResponse.json({error:message.startsWith("Texto")||message.startsWith("Digite")?message:"Não foi possível gerar o áudio."},{status:400});
 }
}
