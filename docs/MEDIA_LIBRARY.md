# Biblioteca e composição por cena — versão 0.4

## Usar no estúdio

1. Planeje um roteiro na tela principal.
2. Em **Biblioteca de imagens**, carregue um PNG, JPEG ou WebP próprio/licenciado e confirme os direitos de uso.
3. Em cada cena do plano, escolha uma imagem da biblioteca. A seleção fica no projeto local e acompanha as campanhas criadas a partir dele.
4. Exporte o storyboard MP4. Cenas sem imagem mantêm o fundo gráfico; a narração própria continua opcional.
5. Em uma campanha, abra o roteiro vertical de um corte. A seleção de imagens acompanha as cenas desse corte.

As imagens são ajustadas ao quadro sem recorte automático; sobras recebem fundo escuro. As cenas são sequenciais e não usam transições animadas. Esta versão compõe imagens estáticas, não gera cenas por IA, não reenquadra por detecção de sujeito e não renderiza vídeos enviados pelo usuário.

## Armazenamento e direitos

Até 40 imagens por estúdio; upload até 12 MB e 16 milhões de pixels, com dimensões mínimas de 16 × 16. O conteúdo real deve ser PNG, JPEG ou WebP; o nome/extensão não basta. FFmpeg valida e normaliza para PNG RGB com no máximo 1920 pixels por lado. Imagens animadas usam o primeiro quadro. A normalização não preserva metadados originais.

O usuário declara possuir autorização; isso não é uma verificação jurídica nem substitui documentação da licença. A biblioteca guarda a declaração, SHA-256 do arquivo original, título, dimensões e data. Uploads idênticos reutilizam o mesmo ativo. Arquivos ficam em `.data/assets`, fora do Git, protegidos pelas mesmas regras de acesso do estúdio.

A exclusão é recusada enquanto uma campanha ou exportação mantiver referência à imagem. Exclua essas referências primeiro. O navegador também impede excluir uma imagem selecionada no projeto aberto. Projetos locais em outros navegadores não são conhecidos pelo servidor; ao reabrir um projeto com imagem ausente, selecione outra imagem.

## Renderização

O worker prepara imagens no formato final em um diretório próprio do trabalho, monta uma sequência por duração de cena e acrescenta as legendas. Com áudio, as durações são proporcionais à gravação; ainda não há alinhamento palavra a palavra. Os arquivos de preparo usam nomes internos fixos e comandos sem shell.

O resultado tem `kind: image-storyboard` e `scenesWithImages`; sem imagem, continua `kind: storyboard`. O MP4 passa pela mesma verificação de resolução e duração. IDs de imagens acompanham campanhas/cortes; caminhos privados do servidor não são expostos na API de trabalhos. O webhook de automação envia apenas os IDs e textos, sem os arquivos de imagem.

## Integrações externas

Autorizar uma integração no ChatGPT não equivale a ter suas ferramentas ou credenciais disponíveis no runtime AXON. Na verificação desta entrega, Metricool e Runway ainda eram reportados como não instalados, sem ferramentas acessíveis. Não houve geração no Runway, leitura de contas do Metricool nem publicação social. A composição descrita acima funciona independentemente dessas integrações.
