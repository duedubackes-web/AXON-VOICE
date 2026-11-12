export type RegionKey = "neutral" | "gaucho" | "catarinense" | "carioca" | "paulista" | "mineiro" | "baiano" | "pernambucano";
export type Emotion = "natural" | "alegre" | "serio" | "acolhedor";
export const regions: {id:RegionKey; label:string; detail:string; samples:string[]}[] = [
  {id:"neutral",label:"Português brasileiro",detail:"Pronúncia padrão",samples:[]},
  {id:"gaucho",label:"Gaúcho",detail:"Rio Grande do Sul",samples:["bah","tchê","tri"]},
  {id:"catarinense",label:"Catarinense",detail:"Santa Catarina",samples:["manezinho","querido","ó-lhó-lhó"]},
  {id:"carioca",label:"Carioca",detail:"Rio de Janeiro",samples:["coé","maneiro","bolado"]},
  {id:"paulista",label:"Paulista",detail:"São Paulo",samples:["mano","da hora","rolê"]},
  {id:"mineiro",label:"Mineiro",detail:"Minas Gerais",samples:["uai","sô","trem"]},
  {id:"baiano",label:"Baiano",detail:"Bahia",samples:["meu rei","massa","oxente"]},
  {id:"pernambucano",label:"Pernambucano",detail:"Pernambuco",samples:["visse","arretado","oxe"]}
];
export const emotions: {id:Emotion; label:string}[] = [
  {id:"natural",label:"Natural"}, {id:"alegre",label:"Animada"},
  {id:"serio",label:"Profissional"}, {id:"acolhedor",label:"Acolhedora"}
];
export function regionalGuide(region:RegionKey, intensity:number, emotion:Emotion) {
  const item=regions.find(r=>r.id===region)??regions[0];
  const degree=intensity<30?"sutil":intensity<70?"moderada":"marcante";
  return `Leia em português brasileiro com estilo ${emotion}, influência regional ${item.label} ${degree}. Preserve o texto literalmente; não acrescente gírias. Evite caricaturas e estereótipos. A naturalidade e a inteligibilidade vêm primeiro.`;
}
