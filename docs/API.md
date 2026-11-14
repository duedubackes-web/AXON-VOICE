# API do estúdio 0.2

Uma instância representa um estúdio. Não há isolamento entre contas porque ainda não há contas. Senha obrigatória para escutar fora de loopback. Em produção use HTTPS e AXON_PUBLIC_ORIGIN. Todas as APIs privadas exigem cookie de sessão quando a senha está configurada. Mutações rejeitam origens externas e Sec-Fetch-Site cross-site.

| Método | Rota | Uso |
| --- | --- | --- |
| GET | /api/session | Saber se precisa desbloquear |
| POST | /api/login | JSON `{password}`; cookie HttpOnly; 5 falhas/min por endereço de conexão |
| GET | /api/capabilities | Capacidades reais, limites, perfis regionais |
| POST | /api/plan | `{script,title,region,format}`; retorna planejamento |
| POST | /api/audio | Corpo binário; `X-Axon-Consent: own-or-licensed`; retorna `{id,duration}` |
| DELETE | /api/audio/:id | Excluir áudio quando não estiver sendo usado |
| POST | /api/jobs | Campos do plano, `visualPrompts?`, `audioId?`; header `Idempotency-Key` de 8–100 caracteres alfanuméricos, `_` ou `-` |
| GET | /api/jobs | Histórico de exportações |
| GET | /api/jobs/:id | Estado e metadados de resultado |
| POST | /api/jobs/:id/cancel | Cancelar trabalho pendente/em execução |
| POST | /api/jobs/:id/retry | Nova tentativa de um trabalho falho/cancelado |
| DELETE | /api/jobs/:id | Excluir resultado; aguardar cancelamento antes de excluir |
| GET | /api/jobs/:id/file | Baixar MP4 somente após sucesso validado |

Estados: queued → running → succeeded/failed/cancelled. Solicitações idênticas com a mesma chave reutilizam o trabalho. Uma nova tentativa após falha exige uma nova chave. O vídeo só recebe succeeded após FFprobe confirmar resolução e duração. Não há chamada paga na entrega atual.

FFmpeg é executado sem shell e com argumentos fixos; entrada de usuário fica nos arquivos de legenda. ASS remove chaves, barras invertidas e caracteres de controle para impedir comandos de estilo. Uploads aceitam somente demuxers de áudio/contêineres conhecidos e proíbem protocolos de rede. Diretórios usam UUIDs validados. Processos têm tempo limite e podem ser cancelados.

Os tempos de legenda são estimados. Metadados de resultado contêm `kind: storyboard`, `hasAudio` e `subtitleTiming`. `aiVoice` e `aiVideo` continuam false. FFmpeg e bibliotecas devem ser atualizados no ambiente de execução.
