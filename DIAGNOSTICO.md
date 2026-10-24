# Revisão do projeto — 24/10/2026

## Entregue nesta revisão

- Aula 011 com resumo, oito blocos por tempo, mapa mental, memorização, dicionário, revisão ativa e roteiro para vídeo.
- Questionário com quinze perguntas e infográfico SVG acessível.
- Integração à navegação MkDocs, aos índices, ao dicionário e ao caderno visual Astro.
- Correção do cartão da aula 009, inclusão do cartão da aula 010 na página inicial e atualização dos contadores para onze.
- Conversão dos links Markdown internos para URLs do site Astro.
- Exclusão de dependências e saídas de compilação do acompanhamento pelo Git.

## Pendências encontradas

1. **Publicação:** a migração para Astro foi solicitada e o workflow de produção foi atualizado para publicar `astro/dist/`. Falta enviar as alterações ao GitHub e concluir o deploy para atualizar o endereço público.
2. **Ambiente local confirmado:** o projeto é executado inteiramente no WSL, onde o build Astro passou. Instalação de dependências, desenvolvimento e builds devem ser feitos nesse ambiente. A tentativa pelo PowerShell não representa uma pendência do projeto.
3. **Fonte da aula 011:** falta identificar o URL do vídeo original, ausente na transcrição recebida.
4. **Revisão editorial:** conferir passagens históricas, nomes de documentos e interpretações litúrgicas da transcrição. A aula inclui notas e fontes oficiais para os pontos sobre infalibilidade e Quo primum.
5. **Questionários:** os onze questionários agora têm 165 gabaritos de estudo, correção, explicações e opção de refazer apenas erros ou questões em branco. As tentativas ainda não são persistidas. O SQLite pessoal e seu backup estão preparados; consulte `BACKUP.md`.
6. **Paridade visual Astro:** o adaptador Markdown é experimental. Verificar caixas de destaque, listas de tarefas e recursos Pymdownx em navegador antes de promover o protótipo.
7. **Dicionário:** existem verbetes repetidos nas seções acumuladas; falta a consolidação alfabética prevista para o livro.
8. **Git:** há alterações anteriores na configuração, nas dependências e nos estilos do Astro, além de lockfiles locais. Esta revisão não fez commit, push nem publicação.

## Validação

- `python -m mkdocs build --strict`: aprovado.
- `npm run build` no WSL, dentro de `astro/`: aprovado, 29 páginas.
- A compilação confirma a geração das páginas; não substitui revisão visual em navegador.
