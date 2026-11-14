# Verificação — versão 0.2

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
