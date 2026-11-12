"use client";
import AgentChat from "@/components/AgentChat";
import {useEffect,useRef,useState} from "react";
import {AudioLines,Play,Pause,Download,Volume2,Mic2,SlidersHorizontal,Globe2,ShieldCheck,Sparkles,ArrowRight,Loader2} from "lucide-react";
import {regions,emotions,type Emotion,type RegionKey} from "@/lib/regions";
export default function Home(){
 const [text,setText]=useState("Bem-vindo ao AXON VOICE. Uma nova forma de criar histórias, com vozes que respeitam a diversidade do Brasil.");
 const [region,setRegion]=useState<RegionKey>("neutral");
 const [emotion,setEmotion]=useState<Emotion>("natural");
 const [intensity,setIntensity]=useState(45);
 const [loading,setLoading]=useState(false);
 const [playing,setPlaying]=useState(false);
 const [error,setError]=useState("");
 const [audioUrl,setAudioUrl]=useState("");
 const audio=useRef<HTMLAudioElement>(null);
 const objectUrl=useRef("");
 useEffect(()=>()=>{if(objectUrl.current)URL.revokeObjectURL(objectUrl.current)},[]);
 async function generate(){
  setError("");setLoading(true);
  try{
   const response=await fetch("/api/tts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text,region,emotion,intensity})});
   if(!response.ok){const body=await response.json();throw new Error(body.error||"Erro na geração.")}
   const blob=await response.blob();
   if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);
   const url=URL.createObjectURL(blob);objectUrl.current=url;setAudioUrl(url);setPlaying(false);
  }catch(e){setError(e instanceof Error?e.message:"Erro inesperado.");}finally{setLoading(false);}
 }
 async function togglePlayback(){if(!audio.current)return;if(audio.current.paused){await audio.current.play();setPlaying(true)}else{audio.current.pause();setPlaying(false)}}
 const chosen=regions.find(r=>r.id===region)!;
 return <main className="app-shell">
  <aside className="sidebar">
   <div className="brand"><div className="brand-icon"><AudioLines size={25}/></div><span>AXON <b>VOICE</b><small>CREATIVE AUDIO INTELLIGENCE</small></span></div>
   <div className="nav-title">WORKSPACE</div>
   <div className="nav-item active"><Mic2 size={18}/> Estúdio de voz</div>
   <div className="nav-item"><Globe2 size={18}/> Idiomas & regiões <span className="soon">NOVO</span></div>
   <div className="nav-item disabled"><SlidersHorizontal size={18}/> Biblioteca <span className="soon">EM BREVE</span></div>
   <div className="sidebar-bottom"><ShieldCheck size={18}/><span>Vozes com responsabilidade<small>Clonagem só com consentimento</small></span></div>
  </aside>
  <section className="workspace">
   <header className="topbar"><span>AXON / STUDIO</span><span className="stage">ALPHA 0.1</span></header>
   <div className="content">
    <div className="eyebrow"><Sparkles size={15}/> ESTÚDIO DE VOZ COM IA</div>
    <h1>Sua história merece <em>uma voz única.</em></h1>
    <p className="lead">Transforme palavras em áudio e explore as nuances do português brasileiro. Do sul ao nordeste, uma identidade sonora de cada vez.</p>
    <div className="studio-grid">
     <div className="panel editor">
      <div className="panel-heading"><span><span className="num">01</span> Seu roteiro</span><span className="muted">TEXTO PARA VOZ</span></div>
      <label className="field-label" htmlFor="script">O que vamos narrar?</label>
      <textarea id="script" maxLength={3000} value={text} onChange={e=>setText(e.target.value)} placeholder="Digite seu roteiro..."/>
      <div className="editor-footer"><span>{text.length} / 3.000 caracteres</span><span>Português (Brasil)</span></div>
     </div>
     <div className="panel settings">
      <div className="panel-heading"><span><span className="num">02</span> Direção vocal</span><SlidersHorizontal size={18}/></div>
      <label className="field-label" htmlFor="region">Identidade regional</label>
      <select id="region" value={region} onChange={e=>setRegion(e.target.value as RegionKey)}>{regions.map(r=><option key={r.id} value={r.id}>{r.label} — {r.detail}</option>)}</select>
      <div className="chips">{chosen.samples.length?chosen.samples.map(s=><span key={s}>{s}</span>):<span>Pronúncia brasileira neutra</span>}</div>
      <label className="field-label" htmlFor="emotion">Interpretação</label>
      <select id="emotion" value={emotion} onChange={e=>setEmotion(e.target.value as Emotion)}>{emotions.map(e=><option key={e.id} value={e.id}>{e.label}</option>)}</select>
      <div className="range-head"><label className="field-label" htmlFor="intensity">Intensidade regional</label><b>{intensity}%</b></div>
      <input id="intensity" type="range" min="0" max="100" step="5" value={intensity} onChange={e=>setIntensity(Number(e.target.value))}/>
      <p className="note">A fidelidade regional depende do motor de voz. Gírias são referências linguísticas, não inserções automáticas no texto.</p>
     </div>
    </div>
    <div className="actions"><button className="primary" disabled={loading||!text.trim()} onClick={generate}>{loading?<Loader2 className="spin" size={18}/>:<AudioLines size={19}/>} {loading?"Gerando áudio...":"Gerar áudio"} <ArrowRight size={18}/></button><span className="muted">Áudio gerado por IA • Não represente vozes reais sem autorização</span></div>
    {error&&<div role="alert" className="error">{error}</div>}
    <div className="result panel">
     <div><div className="result-label"><Volume2 size={19}/> RESULTADO DO ESTÚDIO</div><strong>{audioUrl?"Seu áudio está pronto":"Sua próxima criação começa aqui"}</strong><p>{audioUrl?"Escute e baixe sua narração em MP3.":"Insira seu texto, escolha as características e gere sua primeira narração."}</p></div>
     <div className="audio-actions">
      <audio ref={audio} src={audioUrl||undefined} onEnded={()=>setPlaying(false)}/>
      <button className="secondary" disabled={!audioUrl} onClick={togglePlayback} aria-label={playing?"Pausar áudio":"Reproduzir áudio"}>{playing?<Pause size={18}/>:<Play size={18}/>}</button>
      <a className={"secondary "+(!audioUrl?"disabled-link":"")} href={audioUrl||undefined} download="axon-voice.mp3" aria-disabled={!audioUrl}><Download size={18}/> MP3</a>
     </div>
    </div>
    <footer>AXON VOICE © 2026 <span>Originalidade vocal • Segurança • Diversidade cultural</span></footer>
   </div>
  </section>
  <AgentChat onUseText={setText}/>
 </main>;
}
