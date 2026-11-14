# Base do MVP — versão 0.2, 14/11/2026

## Produto

Público inicial: criadores brasileiros que querem transformar um roteiro em narração e vídeo, reaproveitando a história em formatos longos e curtos. A versão 0.2 oferece planejamento e renderização de storyboard textual em MP4, com áudio próprio opcional. A proposta comercial completa depende das próximas integrações.

## Arquitetura atual

Frontend HTML/CSS/JS sem dependências; API Node HTTP; núcleo puro de planejamento; último projeto em IndexedDB, fila de renderização em disco e worker FFmpeg local. Exportação aberta com schemaVersion. O servidor persiste o plano de cada renderização em diretório privado fora do Git e não registra o conteúdo em logs. APIs não realizam chamadas pagas.

Contrato do projeto: título, proporção, perfil regional, direção de voz, duração estimada e cenas com identificador, início, duração, narração, direção visual e estado. `renderStatus: not-configured` no plano indica ausência de geração por IA. O estado da exportação MP4 pertence ao job e só muda para succeeded após verificação do arquivo.

## Arquitetura de produção proposta

Frontend → API autenticada → projetos/ativos → fila durável → workers de voz/vídeo → composição FFmpeg → armazenamento de objetos → download assinado. Adaptadores por fornecedor devem declarar duração máxima, formatos, idiomas, custo estimado e limites. Chaves permanecem no servidor. Cada job deve ter chave de idempotência, orçamento aprovado, cancelamento e estados queued/running/succeeded/failed/cancelled. Nunca marcar sucesso sem artefato validado.

Vídeos longos serão montados por cenas e capítulos, com continuidade de personagens e voz; não dependerão de uma única geração longa. Legendas finais devem usar alinhamento do áudio real. Reenquadramento vertical precisa preservar sujeito e permitir revisão.

## Critérios para lançamento pago

Contas individuais, isolamento entre usuários, quotas, controle de gastos, fila persistente, exclusão de dados, termos de uso, upload validado, consentimento verificável para clonagem, gestão de licenças e exportação real reproduzível. Falha de fornecedor não pode produzir cobrança duplicada ou perder o projeto.

## Diferenciais propostos para validar

- Bíblia de continuidade: personagens, pronúncia e direção por projeto.
- Mapa de cortes: sugestões revisáveis de clipes curtos a partir de capítulos.
- Laboratório regional: locutores autorizados, variedades específicas e avaliação humana local.
- Orçamento antes de renderizar e regeneração de uma única cena.

São hipóteses de produto; não há afirmação de ineditismo mundial ou de qualidade já medida.
