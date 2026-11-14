# Pesquisa pública e plano de inspeção

Data: 14/11/2026. Escopo executado: metadados e README dos repositórios, documentação pública dos produtos. Não foi realizada varredura autenticada, extração de código privado, download de modelos ou execução dos motores REA/Craft Anything. A pesquisa não é inventário exaustivo.

## Ferramentas solicitadas

- https://github.com/morluto/rea — README descreve inspeção local, JavaScript/Electron, binários e comportamento de aplicações. Metadados indicam MIT. É ferramenta de análise, não acesso ao backend de Google ou ElevenLabs.
- https://github.com/storytold/craft-anything — README descreve motor Rust em alpha com ciclo Study/Build/Check/Ready e modo clean room, MIT/Apache-2.0. É ferramenta de inspeção e construção, não gerador de voz/vídeo.

Aplicação nesta entrega: separação entre evidência pública, requisitos próprios e verificação de comportamento. Nenhum código desses projetos foi copiado; não há integração de runtime instalada. Uma integração futura exige revisão de licença/dependências, versão fixada e execução isolada. Para REA, analisar primeiro o próprio AXON-VOICE; para Craft Anything, usar alvo local e escopo clean room. Não executar instaladores remotos sem revisão.

## Matriz pública → implementação própria

| Referência | Capacidade pública | Estado AXON |
| --- | --- | --- |
| Flow | Texto, imagens de referência, frames e vídeos como entradas | Roteiro implementado; mídia pendente |
| Flow | Organização e extensão de cenas | Planejamento de cenas; geração/extensão pendentes |
| ElevenLabs | TTS e desenho de voz | Prévia do navegador; TTS profissional pendente |
| ElevenLabs | Dublagem e detecção de locutores | Backlog |
| ElevenLabs | STT, efeitos, isolamento, música e agentes | Backlog; não implementados |
| AXON | Direção regional por projeto | Perfis editoriais; sem treino ou promessa de sotaque |
| AXON | Saída longa e curta | Planejamento por cenas e proporção; composição pendente |

## Fontes primárias

- https://support.google.com/flow/answer/16353334
- https://support.google.com/flow/answer/16935718
- https://elevenlabs.io/docs/overview/intro
- https://elevenlabs.io/docs/overview/capabilities/text-to-speech
- https://elevenlabs.io/docs/overview/capabilities/dubbing

Disponibilidade varia por modelo, região e plano; validar antes de contratar/integrar.

## Sotaques e YouTube

Um link público não comprova permissão para treinamento ou clonagem. Registrar por ativo: origem, titular, licença, consentimento do locutor, finalidade, prazo e revogação. Usar gravações próprias ou licenciadas; material do YouTube apenas quando esses direitos estiverem documentados. Não ingerir automaticamente vídeos públicos nem imitar uma pessoa identificável sem autorização. Perfis regionais devem representar variedades locais, evitando reduzir regiões inteiras a estereótipos.

## Protocolo de evidência futuro

Para cada funcionalidade: fonte/data, comportamento observado, entrada e saída, limitações, hipótese de implementação e teste de aceitação. Registrar apenas interações permitidas; remover cookies, tokens e dados pessoais de qualquer captura. Comparar resultados funcionais, sem copiar marca ou ativos proprietários.
