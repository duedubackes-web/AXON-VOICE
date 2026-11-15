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

## Ecossistema 0.3

| Método | Rota | Uso |
| --- | --- | --- |
| GET | /api/integrations | Estados reais; sem segredos/URL do destino |
| GET | /api/platforms | Perfis editoriais das cinco redes |
| GET / PUT | /api/brand | Consultar/salvar identidade editorial |
| GET / POST | /api/campaigns | Histórico/criação a partir de `{title,script,region,format,platforms,visualPrompts?}` |
| GET / PUT / DELETE | /api/campaigns/:id | Consultar, editar textos por revisão ou excluir |
| POST | /api/campaigns/:id/approve | `{revision,confirm:"reviewed-content-and-rights"}` |
| POST | /api/campaigns/:id/dispatch | `{revision,confirm:"send-reviewed-campaign"}`; somente com configuração externa |
| GET | /api/campaigns/:id/json | Exportar pacote, inclusive rascunhos |
| GET | /api/campaigns/:id/csv | Exportar textos com proteção contra fórmulas |
| POST | /api/campaigns/:id/cut | `{cutId}`; retorna roteiro vertical com referência às cenas |

PUT exige a revisão atual e a lista completa de posts com plataforma, título e texto. Qualquer edição invalida a aprovação. Até 100 campanhas por estúdio; exclusão disponível na interface. Alterações na marca não modificam campanhas existentes. Não há scheduler nem publicação direta. A aprovação desta API é a revisão do produto, independente de permissões para operações externas realizadas pelo assistente.

## Biblioteca de imagens 0.4

| Método | Rota | Uso |
| --- | --- | --- |
| GET | /api/assets | Lista de imagens e metadados públicos do estúdio |
| POST | /api/assets | Corpo binário, `X-Axon-Consent: own-or-licensed` e título UTF-8 escapado por encodeURIComponent em `X-Axon-Name` |
| GET | /api/assets/:id/file | Imagem PNG normalizada, com autenticação do estúdio |
| DELETE | /api/assets/:id | Excluir se não houver referência em campanhas/exportações |

POST `/api/jobs` e `/api/campaigns` aceitam `sceneImageIds`, uma lista com um UUID por cena ou `null` para fundo gráfico. A quantidade deve corresponder ao plano reconstruído. Os IDs precisam existir na biblioteca. POST `/api/campaigns/:id/cut` devolve os IDs de imagens correspondentes às cenas desse corte.

`GET /api/capabilities` informa `imageLibrary` e `maxImageBytes`. Limites e comportamento: [biblioteca de mídia](MEDIA_LIBRARY.md).

## Acessos e briefs 0.5

O catálogo `/api/integrations` inclui `access.links`, orientações por etapa e o estado `external-status-not-monitored` para Metricool/Runway: o servidor AXON não monitora as conexões da conversa.

GET `/api/campaigns/:id/brief/runway` e GET `/api/campaigns/:id/brief/metricool` baixam textos de trabalho da revisão persistida. Seguem a autenticação do estúdio e não enviam conteúdo ao provedor.

## Organização 0.6

GET `/api/workspace` retorna contagens reais e até cinco campanhas recentes, seguindo a autenticação do estúdio. GET `/guides/automation` exibe as instruções do adaptador como texto, sem segredos.

`/overview`, `/studio`, `/library`, `/brand`, `/campaigns`, `/integrations` e `/exports` servem a aplicação e selecionam a respectiva área; não são endpoints de mutação.
