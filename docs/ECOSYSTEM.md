# Ecossistema AXON — versão 0.3

## O que esta versão entrega

Um roteiro alimenta o plano de cenas, um kit editorial da marca, uma campanha com textos para cinco redes, links UTM e sugestões de cortes verticais. A marca e as campanhas ficam no disco do estúdio. Vídeos continuam usando o renderizador de storyboard da versão 0.2.

### Content DNA

Nome, público, tom, CTA, site, hashtags, termos a evitar e guia de pronúncia. A campanha recebe uma cópia da marca para preservar suas referências quando o kit mudar. CTA, hashtags e links são aplicados por regras. Tom, público e pronúncia são instruções editoriais preservadas, não parâmetros de um modelo de voz ou geração de texto. A aplicação não afirma que essas instruções já alteram o áudio.

### Uma história, várias saídas

YouTube, Instagram, TikTok, LinkedIn e WhatsApp recebem textos editáveis e proporções sugeridas. Os tamanhos dos textos são escolhas editoriais conservadoras, não uma implementação dos limites completos de cada API. Revise mídia, descrição e regras da plataforma antes de publicar.

Links UTM distinguem origem e campanha. Não são métricas de resultado: para medir conversões é necessário configurar analytics no site de destino.

### Cortes com rastreabilidade

O algoritmo agrupa cenas contíguas em trechos de até 60 segundos, mantendo IDs das cenas, começo/fim e roteiro. Exibe até 12 sugestões iniciais por campanha. Cada sugestão abre um novo roteiro vertical no estúdio para revisão e renderização. Não corta um vídeo já enviado, não reenquadra imagens e não prevê viralidade. Os tempos são estimados pelo planejador.

### Revisão e aprovação

Campanha nova é rascunho. Alterar textos aumenta a revisão e invalida a aprovação. A aprovação exige confirmar revisão/direitos de uso e remover termos sinalizados. A verificação de termos é uma busca textual simples, sem análise semântica. Termos presentes no roteiro de origem precisam ser corrigidos criando uma nova campanha a partir do roteiro revisado.

A aprovação permite exportar/encaminhar a revisão. Não publica conteúdo nem agenda posts. JSON/CSV também podem ser baixados como rascunho para revisão externa. CSV protege células que possam ser interpretadas como fórmulas.

## Integrações e estados reais

| Integração | Estado nesta entrega |
| --- | --- |
| YouTube, Instagram, TikTok, LinkedIn, WhatsApp | Pacotes editoriais exportáveis; sem OAuth e sem postagem direta |
| n8n / webhook HTTPS | Adaptador funcional, condicionado à configuração do servidor e envio explícito |
| Metricool | Conexão externa do ChatGPT disponível para o usuário autorizar; não é integração embutida no AXON |
| Runway | Conexão externa do ChatGPT disponível para o usuário autorizar; não é integração embutida no AXON |
| Voz/vídeo por IA | Pendente de provedor/credenciais |

O webhook recebe marca, textos, links e roteiros dos cortes aprovados. Não recebe arquivos de áudio/vídeo, senha do estúdio ou credenciais de redes sociais. Resposta HTTP 2xx significa aceitação do workflow; não comprova publicação em uma rede.

## Próximos passos do produto

1. Configurar uma conta real de automação e validar um envio consentido.
2. Contas individuais e projetos isolados antes de uso por clientes distintos.
3. OAuth por plataforma, permissões mínimas e aprovação dos aplicativos quando exigida; conectar credenciais do ChatGPT não entrega automaticamente tokens ao AXON.
4. Publicação com seleção explícita de conta, mídia, texto e horário; agendamento persistente e recibo da plataforma.
5. Métricas verificadas e experimentos com consentimento para comparar versões.
6. Geração de voz/vídeo com orçamento e avaliação de qualidade.

A proposta de diferenciação é continuidade entre marca, roteiro, cortes, revisão e distribuição. Não existe comprovação de superioridade aos concorrentes ou de ineditismo mundial.
