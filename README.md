# AXON VOICE

Estúdio de criação audiovisual em português. MVP 0.1: roteiro → planejamento de cenas → direção visual → exportação JSON e SRT estimado.

## Abrir no Codespaces

1. Abra **Code → Codespaces → Create codespace on main**.
2. No terminal execute `npm run dev` (Node.js 22 ou superior; sem instalação de dependências).
3. Abra a porta **3000** na aba Ports. Mantenha sua visibilidade privada.

Localmente, execute `npm run dev` e abra http://localhost:3000. O servidor escuta apenas em loopback por padrão. Para contêiner isolado, configure `HOST=0.0.0.0` explicitamente.

## O que funciona

- Planejador determinístico para roteiros até 60.000 caracteres, com cenas contíguas e formato horizontal, vertical ou quadrado.
- Direção visual editável, perfis regionais editoriais e salvamento do último projeto em IndexedDB.
- Exportação do plano JSON e legendas com tempos estimados.
- Prévia opcional via SpeechSynthesis do navegador, dependente das vozes instaladas.
- API de capacidades explícita e validação de entrada.

## Limites desta entrega

Não gera arquivos de áudio ou vídeo, não treina sotaques, não clona vozes, não usa API privada de concorrentes. Perfis regionais são instruções editoriais, não modelos vocais. Não há autenticação nem armazenamento em nuvem. Dados locais podem ser apagados pelo navegador: exporte projetos importantes. Não publicar como SaaS multiusuário antes da fase de autenticação e quotas.

## Validação

`npm run check` e `npm test`. CI executa os mesmos comandos. Consulte [base do produto](docs/MVP.md), [pesquisa](docs/RESEARCH.md) e [próximas entregas](docs/ROADMAP.md).
