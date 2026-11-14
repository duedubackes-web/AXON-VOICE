# Automação com n8n / webhook HTTPS

## Configurar o destino

No servidor AXON, defina as variáveis fora do Git:

- `AXON_AUTOMATION_WEBHOOK_URL`: URL HTTPS de produção do workflow.
- `AXON_AUTOMATION_ALLOWED_HOSTS`: hostname exato autorizado; múltiplos separados por vírgula. Sem caminhos, curingas ou portas.
- `AXON_AUTOMATION_TOKEN`: segredo com pelo menos 24 caracteres.
- `AXON_AUTOMATION_SIGNING_SECRET`: segredo de assinatura separado, com pelo menos 32 caracteres.

No n8n, crie um Webhook POST e configure **Header Auth** com nome `X-Axon-Token` e o token correspondente. Use a URL de produção de um workflow ativo. Configure o processamento para receber um pacote editorial para revisão. Esta versão envia `publicationRequested: false`; não conecte o receptor diretamente à postagem automática.

Fontes oficiais: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/ e https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/workflow-development/

## Validar a assinatura no receptor

Preserve o corpo bruto da requisição. Confira:

1. `X-Axon-Timestamp`: timestamp Unix em segundos, com tolerância máxima recomendada de 5 minutos.
2. `X-Axon-Signature`: `sha256=` seguido do HMAC SHA-256 de `timestamp + "." + rawBody`, usando `AXON_AUTOMATION_SIGNING_SECRET`. Compare em tempo constante.
3. `X-Axon-Event-Id`: deduplique em armazenamento persistente antes de processar; confira correspondência com `eventId` do corpo.
4. Rejeite eventos cujo tipo não seja `axon.campaign.approved` ou versão diferente de 1.

Validação de assinatura e deduplicação no receptor precisam ser configuradas: o AXON não consegue garantir que um workflow externo as execute. Header Auth deve ocorrer no próprio Webhook, antes dos demais nós. Verificar HMAC apenas sobre JSON reserializado pode falhar; use os bytes originais.

## Entrega e recuperação

Antes da requisição, o AXON grava uma tentativa com eventId e revisão. Não faz reenvio automático. Entrega duplicada para a mesma revisão reutiliza o registro. Resposta 2xx marca `delivered`; qualquer outra resposta ou falha sem confirmação marca `unknown`. Redirecionamentos não são seguidos. Um processo interrompido durante a entrega recupera o registro como `unknown`.

Confira o receptor por eventId antes de decidir criar uma nova revisão. Excluir e recriar campanhas elimina a deduplicação local correspondente e pode provocar duplicatas no receptor; mantenha a deduplicação do eventId e o histórico externo.

O remetente aceita apenas HTTPS/443, hostname exato configurado e endereços públicos. Valida todos os IPs retornados pelo DNS e fixa um IP validado na conexão TLS. Protocolos locais, credenciais embutidas em URL e IPs literais são rejeitados. DNS e requisições têm limite de tempo. Não há suporte a destinos privados ou proxies HTTP nessa primeira versão.

O estado `configured-not-verified` indica que a configuração tem o formato esperado, não que a conexão externa já foi testada. Segredos e URL privada do webhook não são devolvidos pela API de catálogo.
