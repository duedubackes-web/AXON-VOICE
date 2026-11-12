# AXON Brain — agentes e integrações

## Implementado
Chat contextual com quatro perfis: roteirista, regionalista, diretor de voz e suporte. A API `/api/agent` aceita até 12 mensagens e consulta um modelo de linguagem no servidor com `OPENAI_API_KEY`. Respostas podem ser copiadas para o editor de roteiro.

**Importante:** os agentes atualmente **sugerem**, não executam tarefas. Não há conexão real com Grok, n8n, Supabase ou webhooks. Não apresentar integrações planejadas como ativas.

## Arquitetura de ferramentas (próxima fase)
1. Registro de ferramentas com schemas e permissões específicas por usuário.
2. Planejamento pelo agente sem execução automática.
3. Confirmação humana explícita para ações externas, publicações e custos.
4. Execução em workers autenticados, com idempotência, logs e retries limitados.
5. Auditoria e isolamento por organização; segredos apenas no servidor.

## Grok / xAI
Grok é uma família de modelos; não é um executor universal de tarefas. Pode atuar como provedor opcional para planejamento/linguagem, sujeito a compatibilidade de API, preço, privacidade e avaliação. Execução real deve permanecer em conectores com escopos mínimos e confirmação.

## Antes de produção
A API de chat, assim como a de voz, ainda não tem autenticação nem rate limiting. Não publicar com credenciais pagas até implementar os controles da issue #2.

## Segurança e privacidade
Não enviar dados pessoais, gravações de terceiros ou credenciais sem consentimento e base legal. Respostas de IA podem conter erros. Não executar texto gerado como código ou comandos.
