# AXON VOICE 🎙️

**AI Voice Studio com identidade brasileira.** Um estúdio original de síntese de áudio, configurável por sotaque regional, emoção e intensidade.

## MVP
- Interface responsiva, dark premium com ciano e violeta.
- Editor de roteiro com limite de 3.000 caracteres.
- Perfis: neutro, gaúcho, catarinense, carioca, paulista, mineiro, baiano e pernambucano.
- Seletores de emoção e intensidade regional.
- Endpoint server-side `POST /api/tts`, player e download MP3.
- Endpoint `GET /api/health` e validação da entrada.
- Integração opcional com API de voz da OpenAI, sem expor chave no navegador.

> **Limitação:** sotaques e emoções são instruções dirigidas ao motor quando o modelo admite o campo `instructions`; a fidelidade exige testes com ouvintes nativos. Modelos `tts-1` não aceitam instruções e ignoram esses controles. Sem chave configurada, o sistema sinaliza erro e não simula áudio.

## Rodar localmente
Requer Node.js 20+.
```bash
npm install
cp .env.example .env.local
npm run dev
```
Abra http://localhost:3000. Defina `OPENAI_API_KEY` no servidor para geração real. Para modelos com suporte a direção vocal, configure `OPENAI_TTS_MODEL` e confirme as capacidades na documentação atual do provedor.

## Publicar na Vercel
Importe o repositório em https://vercel.com/new. Configure `OPENAI_API_KEY`, `OPENAI_TTS_MODEL` e `OPENAI_TTS_VOICE` conforme o provedor. Geração real gera custos.

## Estrutura
- `src/app/page.tsx`: estúdio e reprodução
- `src/lib/regions.ts`: perfis linguísticos
- `src/app/api/tts/route.ts`: proxy de síntese com validação
- `src/app/api/health/route.ts`: estado do serviço
- `docs/COMPETITIVE_RESEARCH.md`: escopo de pesquisa competitiva

## Próximos passos
1. Autenticação, storage, quotas e políticas RLS com Supabase.
2. Rate limiting distribuído e controle de custos por usuário.
3. Validação com falantes nativos de pronúncia e prosódia.
4. Provedores adicionais e processamento assíncrono com filas.
5. Dublagem e clonagem somente mediante consentimento verificável.

## Segurança
Esta versão é **alpha de desenvolvimento**, não pronta para expor uma chave paga num endpoint público. Exige autenticação, quotas, limites e proteção contra abuso antes da produção. Nenhuma credencial foi adicionada ao repositório.
