# Acessos oficiais e uso assistido — versão 0.5

A central de integrações agora oferece links de cadastro, login, Android, iPhone e conexão ao ChatGPT para Metricool e Runway. Esses atalhos abrem o site oficial em nova aba, com noopener/noreferrer. O AXON não coleta senha, código de autenticação ou chave por meio desses links.

## No computador

Use os aplicativos web no navegador, inclusive em Linux/Endless OS:

- Metricool: https://app.metricool.com/login — cadastro em https://app.metricool.com/register
- Runway: https://app.runwayml.com/ — cadastro em https://app.runwayml.com/signup

## Baixar no celular

- Metricool Android: https://play.google.com/store/apps/details?id=com.ionicframework.metricool185346
- Metricool iPhone: https://apps.apple.com/us/app/metricool/id1072510529
- Runway Android: https://play.google.com/store/apps/details?id=com.runwayml.prod
- Runway iPhone: https://apps.apple.com/us/app/runway-ai-image-video/id1665024375

## Autorizar ou gerenciar a conexão no ChatGPT

- Metricool: https://chatgpt.com/apps/metricool-for-social-media/asdk_app_69d73fc8aa5c8191bec1583760b130c7
- Runway: https://chatgpt.com/plugins/plugin_asdk_app_6a05e3b201788191be12b590b43e6ce3

Conclua a autenticação no fluxo oficial. O acesso no ChatGPT e a integração do servidor AXON são contextos separados. A página AXON usa `external-status-not-monitored` porque não tem acesso ao estado de conexão da conversa. Ela não pede nova autorização com base nesse estado nem declara que a conta está desconectada.

Metricool precisa de uma rede social vinculada à marca para trabalhar com os dados dessa rede. Runway verifica o workspace escolhido e seus modelos disponíveis; autenticação bem-sucedida não garante acesso a geração de vídeo. Uma contratação ou compra continua sendo uma decisão do usuário.

## Materiais baixáveis por campanha

Ao abrir uma campanha:

- **Baixar brief Runway**: texto com marca, formato, direção visual/narração por cena e IDs locais de imagens. Ajuste durações aos limites do modelo e envie somente referências autorizadas.
- **Baixar guia Metricool**: textos revisáveis por rede, títulos, formatos sugeridos e links UTM. Escolha a conta, mídia e horário no editor antes de publicar.

São guias para uso manual/assistido, não importadores nativos nem execuções automáticas. Downloads incluem a revisão e o estado rascunho/aprovado. Nenhum envio externo acontece ao baixá-los. As imagens e os vídeos não são incluídos nesses arquivos de texto. IDs da biblioteca local não são URLs públicas para os provedores.

## Referências oficiais verificadas em 14/11/2026

- https://help.metricool.com/pt/app-movel-do-metricool-8nuhf
- https://help.metricool.com/pt/como-conectar-o-mcp-do-metricool-ao-chatgpt-0lrl3
- https://help.runwayml.com/hc/en-us/articles/24297557468563-Creating-a-Runway-Account
- https://runway.com/mcp

As contas foram conectadas no ChatGPT durante esta entrega. A consulta ao Metricool informou ausência de redes vinculadas; o Runway confirmou autenticação e plano Free sem modelos de vídeo disponíveis. Nenhum identificador privado de conta/workspace foi gravado no repositório, nenhuma postagem foi criada e nenhuma geração paga foi iniciada.
