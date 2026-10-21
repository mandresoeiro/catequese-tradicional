# Astro — Protótipo isolado

Este é um protótipo do site Catequese Tradicional. **Não substitui o MkDocs nem configura deploy.**

## Como executar

Use Node.js 22:

```bash
cd astro
npm install
npm run dev
npm run build
```

O Astro lê diretamente os conteúdos originais de `../docs/`, sem duplicar ou alterar as nove aulas, os questionários e o dicionário. Os SVGs em `../docs/assets` são reutilizados via `publicDir`.

Para testar localmente, abra a URL indicada pelo Astro (prefixo `/catequese-tradicional/`).

**Compatibilidade a revisar:** o interpretador Markdown do protótipo converte algumas caixas `!!!`, mas ainda não replica integralmente todos os recursos de Python-Markdown/Pymdownx do MkDocs, nem torna as questões interativas. Antes de um futuro deploy, compare visualmente cada página, verifique links/imagens e preserve as URLs antigas.

**Publicação:** a branch `main` continua com MkDocs. O workflow `validate-astro.yml` apenas compila, sem publicar.

## Estudo 2.0 (experimental)

- Índice interno de seções nas aulas, leitura com fonte ajustável, contraste e impressão.
- Marcação de conclusão salva localmente no navegador. Não há login ou sincronização.
- Busca local por termos nas dez aulas e no dicionário (sem serviços externos).
- Questionários com seleção única; correção automática somente na Aula #010, com gabarito editorial explícito. Outros questionários seguem para autoavaliação até validação dos gabaritos.
- Caderno Visual com dez SVGs e links diretos.
- `npm run build` executa a compilação e confere a presença de páginas e SVGs; **ainda são necessários testes visuais e de links internos completos**.

> Revisão pendente: conferir renderização Markdown, imagens e resultados dos questionários antes de publicar.
