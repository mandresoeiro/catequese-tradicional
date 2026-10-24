# Astro — Site Catequese Tradicional

Site com sidebar, filtro de aulas, navegação superior fixa e menu móvel. O workflow de produção publica a compilação Astro no GitHub Pages.

## Recursos de estudo

- Busca no texto completo das aulas, com atalho Ctrl/Cmd + K e índice estático carregado sob demanda.
- Modo claro/escuro com preferência local e respeito ao tema do sistema.
- Sumários com âncoras estáveis, tempo estimado e indicador de avanço da leitura.
- Questionários interativos com gabaritos de estudo explicados, correção, nova tentativa e revisão apenas das questões incorretas ou em branco. Os gabaritos são conferidos contra o checksum de cada questionário antes de compilar.
- Biblioteca de formação, seis fichas de santos com roteiros de estudo, livros e filmes, Rosário guiado e esquema das contas do terço.
- O conteúdo e a correção funcionam no site estático. Notas, tentativas, progresso e estados de leitura são gravados no SQLite ao executar o servidor pessoal: depois de compilar, na raiz execute `python3 scripts/study_server.py --port 4322`.

## Como executar

Execute todos os comandos no WSL, com Node.js 22. Esse é o ambiente de desenvolvimento do projeto:

```bash
cd astro
npm install
npm run dev
npm run build
npm run verify
```

O Astro lê diretamente os conteúdos originais de `../docs/`, sem duplicar ou alterar as onze aulas, os questionários e o dicionário. Os SVGs em `../docs/assets` são reutilizados via `publicDir`.

Para testar localmente, abra a URL indicada pelo Astro (prefixo `/catequese-tradicional/`).

**Compatibilidade a revisar:** o interpretador Markdown converte caixas `!!!`, mas ainda não replica integralmente todos os recursos de Python-Markdown/Pymdownx do MkDocs. As questões possuem componente interativo próprio. Antes do deploy, compare visualmente cada página, verifique links/imagens e preserve as URLs antigas.

**Publicação:** o workflow `deploy.yml` instala as dependências com `npm ci`, compila e publica `astro/dist/`. O workflow `validate-astro.yml` valida pull requests sem publicar. A mudança entra no site público após o push para `main` e a conclusão do deploy.
