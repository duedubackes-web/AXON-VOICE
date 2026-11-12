export const MAX_TEXT_LENGTH = 3000;
export function validateText(text:unknown): string {
  if (typeof text!=="string") throw new Error("Texto inválido.");
  const value=text.trim();
  if (!value) throw new Error("Digite um texto para gerar áudio.");
  if (value.length>MAX_TEXT_LENGTH) throw new Error("Texto acima do limite de 3.000 caracteres.");
  return value;
}
export function providerConfigured():boolean {return Boolean(process.env.OPENAI_API_KEY);}
