# Verificação — versões 0.2 a 0.6

Data: 14/11/2026.

História testada: roteiro e narração autorizada → API de upload → áudio normalizado → fila persistente → FFmpeg → MP4 validado → download e exclusão.

## Resultado

- `npm run check`: sintaxe dos módulos do servidor e navegador aprovada.
- `npm test`: 10 testes passaram, nenhum ignorado neste ambiente.
- FFmpeg real: exportações 16:9, 9:16 e 1:1; H.264, áudio e vídeo silencioso; storyboard acima de um minuto.
- API real: upload de WAV de teste, validação, criação idempotente de job, consulta até sucesso, download MP4 e exclusão.
- Fila: pedidos duplicados simultâneos, colisão de chave, cancelamento e recuperação após interrupção.
- Acesso: bloqueio sem sessão, cookie HttpOnly/SameSite, rejeição de origem externa e limite de tentativas de senha.
- Texto de legenda: remoção de comandos ASS injetados.

## Limites

A abertura no navegador de revisão retornou `ERR_CONNECTION_REFUSED` para o servidor local deste ambiente. A interface não recebeu validação visual/interativa; não se afirma aprovação visual. As verificações HTTP e de arquivos ocorreram dentro do runtime do projeto. O servidor iniciou na porta 3000 sem erro.

O contêiner Codespaces está configurado, mas não foi construído neste ambiente. O CI remoto precisa confirmar seu próprio resultado após o push. Credenciais de voz/vídeo por IA não estão configuradas; nenhum teste real desses provedores foi realizado.

## Versão 0.3 — ecossistema

`npm run check` aprovado e `npm test` com 17 testes aprovados, nenhum ignorado neste ambiente.

Verificações adicionais: campanha em cinco redes com links UTM distintos; cortes contíguos até 60s; cópia da identidade editorial; validação de marca/plataformas; proteção CSV contra fórmulas; aprovação por revisão; edição simultânea com rejeição de revisão antiga; persistência e recuperação da entrega; deduplicação de envio; envelope HMAC; bloqueio de redes privadas e de redirecionamentos; jornada HTTP de criação, edição, aprovação, exportação e entrega.

Os testes de integração externa usam transporte controlado em teste. Não houve envio a n8n real, publicação em redes ou conexão a Metricool/Runway. Esses testes não equivalem à aprovação das APIs sociais nem à verificação da conta do usuário. Não foi repetida a tentativa visual bloqueada pelo isolamento entre navegador e servidor; a interface nova permanece sem QA visual.

## Versão 0.4 — imagens por cena

20 testes aprovados, nenhum ignorado. A suíte real carrega duas imagens com proporções diferentes, exporta um MP4 vertical e decodifica quadros antes/depois da troca de cena para verificar as cores esperadas. Também valida autorização declarada, deduplicação, recuperação da biblioteca, bloqueio de SVG/identificadores inválidos, proteção de imagens referenciadas e preservação dos IDs em campanhas/cortes.

A interface nova continua sem QA visual neste ambiente. Metricool e Runway não disponibilizaram ferramentas nesta sessão e o catálogo reportou ambos como não instalados. Não houve ação externa nessas contas nem consumo pago. O CI remoto deve confirmar a suíte após o push.

## Versão 0.5 — acessos e materiais de trabalho

22 testes aprovados localmente, nenhum ignorado. Os testes novos verificam o catálogo de URLs HTTPS oficiais, briefs que preservam revisão/estado de rascunho e direções visuais, os downloads HTTP para ambos os provedores e a rejeição de um provedor desconhecido. A interface permanece sem QA visual neste ambiente.

Conexões reais no ChatGPT: consulta de marcas do Metricool retornou ausência de redes vinculadas; whoami do Runway confirmou autenticação com plano Free e sem modelos de vídeo. A visualização de planos foi apresentada, sem compras. Esses resultados não representam testes de postagem, de geração de mídia nem integração de API do servidor AXON.

## Versão 0.6 — organização e revisão visual (15/11/2026)

25 testes aprovados, nenhum ignorado. Novas verificações cobrem rotas diretas, links antigos, busca sem acentos, categorias e contagens de campanhas persistidas. A sintaxe foi novamente verificada após os ajustes de mensagens/navegação.

A barreira anterior de abertura local foi resolvida iniciando o servidor no próprio desktop de revisão com o runtime instalado. O centro abriu em `/integrations`; a busca por Runway exibiu uma integração, o filtro de criação/gestão exibiu Metricool e Runway, a visão geral carregou as contagens e o Estúdio planejou/salvou um roteiro demonstrativo pela interface. A captura está em `docs/screenshots/integrations-v0.6.jpg`.

A checagem de logs não mostrou erro do aplicativo no fluxo revisado; os erros visíveis eram do script de extensão do navegador. Não foram testados todos os fluxos visuais, upload móvel ou acessibilidade em leitores de tela. A prévia local não é uma implantação pública.

Metricool continua sem rede vinculada na consulta desta entrega; Runway autenticado sem modelos de vídeo disponíveis no workspace. Não houve publicação nem geração paga.
