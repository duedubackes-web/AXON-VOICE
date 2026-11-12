"use client";
import {useState} from "react";
import {Bot,MessageCircle,Send,X,Loader2,Copy} from "lucide-react";
import {agentRoles,type AgentRole} from "@/lib/agents";
type Message={role:"user"|"assistant";content:string};
export default function AgentChat({onUseText}:{onUseText:(text:string)=>void}){
 const [open,setOpen]=useState(false),[role,setRole]=useState<AgentRole>("roteirista"),[input,setInput]=useState("");
 const [messages,setMessages]=useState<Message[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function send(){
  const value=input.trim();if(!value||busy)return;
  const next:Message[]=[...messages,{role:"user",content:value}].slice(-12);
  setMessages(next);setInput("");setBusy(true);setError("");
  try{
   const res=await fetch("/api/agent",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({role,messages:next})});
   const body=await res.json();if(!res.ok)throw new Error(body.error||"Erro de comunicação.");
   setMessages([...next,{role:"assistant",content:body.answer}].slice(-12));
  }catch(e){setError(e instanceof Error?e.message:"Falha no assistente.");}finally{setBusy(false);}
 }
 return <div className="agent-anchor">
  {open&&<section className="agent-panel" aria-label="Chat com agentes AXON">
   <div className="agent-head"><span><Bot size={19}/> AXON Brain <small>Copiloto criativo • IA</small></span><button aria-label="Fechar chat" onClick={()=>setOpen(false)}><X size={18}/></button></div>
   <label htmlFor="agent-role">Especialista</label>
   <select id="agent-role" value={role} onChange={e=>{setRole(e.target.value as AgentRole);setMessages([]);setError("");}}>{Object.entries(agentRoles).map(([id,a])=><option key={id} value={id}>{a.name} — {a.purpose}</option>)}</select>
   <div className="agent-messages" aria-live="polite">{messages.length===0?<p>Olá! Sou seu copiloto criativo. Posso sugerir roteiros, expressões regionais e direção de voz. Não executo ações externas automaticamente.</p>:messages.map((m,i)=><div className={"agent-message "+m.role} key={i}><strong>{m.role==="user"?"Você":agentRoles[role].name}</strong><p>{m.content}</p>{m.role==="assistant"&&<button title="Usar resposta como roteiro" onClick={()=>onUseText(m.content.slice(0,3000))}><Copy size={13}/> Usar no editor</button>}</div>)}</div>
   {error&&<p role="alert" className="agent-error">{error}</p>}
   <form onSubmit={e=>{e.preventDefault();void send()}} className="agent-form"><input aria-label="Mensagem para o agente" maxLength={3000} placeholder="Escreva sua ideia..." value={input} onChange={e=>setInput(e.target.value)}/><button type="submit" disabled={busy||!input.trim()} aria-label="Enviar mensagem">{busy?<Loader2 size={17}/>:<Send size={17}/>}</button></form>
   <small className="agent-disclaimer">Confira as sugestões antes de usar. Não insira dados sensíveis.</small>
  </section>}
  <button className="agent-fab" onClick={()=>setOpen(!open)} aria-label={open?"Fechar copiloto AXON":"Abrir copiloto AXON"}>{open?<X size={23}/>:<MessageCircle size={23}/>} <span>{open?"Fechar":"AXON Brain"}</span></button>
 </div>;
}
