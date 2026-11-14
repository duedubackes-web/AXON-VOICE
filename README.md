# AXON VOICE

Estúdio audiovisual em português. MVP 0.2: roteiro → cenas → direção visual → storyboard MP4, com narração própria opcional.

## Abrir no Codespaces

1. Abra **Code → Codespaces → Create codespace on main**. A configuração do contêiner inclui Node 24, FFmpeg e fontes. Em um Codespace já existente, use **Codespaces: Rebuild Container** para aplicar a configuração.
2. Execute `npm run dev` (Node.js 22 ou superior; sem dependências npm).
3. Abra a porta **3000** na aba Ports. Mantenha a visibilidade privada.

Localmente: `npm run dev` e http://127.0.0.1:3000. Exportação requer FFmpeg/FFprobe com libass, libx264 e fontes DejaVu. Em Debian/Ubuntu: `sudo apt-get update && sudo apt-get install -y ffmpeg fonts-dejavu-core`.

O servidor escuta apenas em loopback por padrão. Para um contêiner/reverse proxy, defina `HOST=0.0.0.0` e `AXON_STUDIO_PASSWORD` com pelo menos 16 caracteres. Em HTTPS, configure `AXON_PUBLIC_ORIGIN` com a origem exata, sem barra final, para cookies Secure e validação de origem. Variáveis são lidas do ambiente; `.env.example` é referência e não é carregado automaticamente.

## O que funciona

- Planejamento de roteiros até 60.000 caracteres, cenas contíguas e formatos 16:9, 9:16 e 1:1.
- Direção visual editável, perfis regionais editoriais e último projeto em IndexedDB.
- Exportação JSON e SRT com tempos estimados.
- Upload de áudio próprio/licenciado até 20 MB e 10 minutos, validado e convertido em WAV.
- Storyboard MP4 H.264 até 10 minutos: fundo gráfico, texto em tela e áudio opcional.
- Fila no disco: consulta, cancelamento, exclusão e recuperação de trabalhos interrompidos por queda do processo.
- Chave de idempotência evita renderização duplicada da mesma solicitação.
- Estúdio privado com senha, sessão HttpOnly de 8 horas, limite de tentativas e validação de origem.

## Limites desta entrega

MP4 é um **storyboard textual**, não uma cena gerada por IA. Direções visuais são preservadas no plano e não geram imagens. Sem áudio enviado, o vídeo é silencioso. Com áudio, tempos das legendas são distribuídos proporcionalmente pela duração, sem transcrição/alinhamento real. A síntese opcional do navegador serve apenas para prévia; não é exportada.

Não há geração de voz/vídeo por IA, treinamento de sotaques, clonagem, integração privada com concorrentes, login multiusuário ou armazenamento gerenciado em nuvem. Senha protege um único estúdio compartilhado; não oferece contas isoladas. Reiniciar invalida sessões. Não expor como SaaS multiusuário.

Trabalhos/áudios ficam em `.data/` (ou `AXON_DATA_DIR`), fora do Git, e precisam de volume persistente/backups para sobreviver à destruição do ambiente. Limites por instância: 20 trabalhos e 40 áudios. Exclua exportações na interface para liberar trabalhos. Áudios têm endpoint de exclusão e podem ser removidos pelo botão da sessão em que foram carregados. Não há limpeza automática. Use uma única instância de servidor por diretório de dados.

## Validação

`npm run check` e `npm test`. Testes de mídia usam FFmpeg real, incluem proporções diferentes, faixa de áudio e storyboard acima de um minuto. Quando FFmpeg está ausente, a suíte de mídia é marcada como ignorada e a UI desabilita a exportação. CI instala os requisitos e executa a suíte completa.

Veja [base do produto](docs/MVP.md), [pesquisa](docs/RESEARCH.md), [API](docs/API.md) e [próximas entregas](docs/ROADMAP.md).
