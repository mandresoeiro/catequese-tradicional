# 📚 Catequese Tradicional

Site de estudos da **Catequese Tradicional**, desenvolvido com **Astro**, com sidebar de aulas, filtro por assunto e navegação superior. Os conteúdos permanecem em Markdown em `docs/`.

## Desenvolvimento no WSL

```bash
cd /mnt/c/dev/catequese-tradicional-astro/astro
npm ci
npm run dev -- --host 0.0.0.0
```

Acesse `http://localhost:4321/catequese-tradicional/`. Para compilar: `npm run build`. O resultado fica em `astro/dist/`.

O workflow de produção está configurado para publicar o Astro no GitHub Pages no próximo push para `main`. A configuração MkDocs permanece disponível para consulta e validação do acervo legado.

## Banco pessoal e backups

O SQLite local contém questões, gabaritos, tentativas, notas, progresso e estados de leitura. Para usar a persistência pessoal no WSL, compile com `cd astro && npm run build`, volte à raiz e execute `python3 scripts/study_server.py --port 4322`. Acesse `http://localhost:4322/catequese-tradicional/`. Os scripts geram backups verificados; veja [BACKUP.md](BACKUP.md).

O GitHub Pages disponibiliza as aulas, a biblioteca, o Rosário e os questionários com correção. A gravação no SQLite funciona no servidor pessoal local; o banco, as notas e os backups não são publicados.

A numeração segue a playlist oficial do Centro Dom Bosco: o **Trailer Oficial não entra na contagem**; as aulas começam em **#001**.

O projeto reúne progressivamente:

- aulas organizadas para estudo;
- resumos essenciais;
- mapas mentais;
- dicionário acumulativo;
- questionários objetivos;
- infográficos;
- revisão ativa;
- roteiros curtos para treino em vídeo.

O objetivo editorial é transformar o material, ao final do percurso, em uma base estruturada para um **livro de estudo**.

## 🔢 Numeração oficial

- Trailer Oficial — não numerado
- #001 — Religião Natural e Religião Sobrenatural
- #002 — Fontes da Revelação
- #003 — Creio em Deus Pai
- #004 — Criador do Céu e dos Anjos
- #005 — Criador da Terra e dos Homens
- #006 — Encarnação do Verbo
- #007 — Concebido do Espírito Santo, nasceu de Maria Virgem
- #008 — Desceu aos Infernos e Ressurgiu
- #009 — Subiu aos Céus e há de vir julgar os vivos e os mortos
- #010 — Creio no Espírito Santo
- #011 — Creio na Santa Igreja Católica

## 🌐 Site

Quando o GitHub Pages estiver ativado, o endereço será:

**https://mandresoeiro.github.io/catequese-tradicional/**

## 🗂️ Estrutura

```text
docs/
├── index.md
├── sobre.md
├── dicionario.md
├── aulas/
│   ├── index.md
│   ├── trailer.md
│   └── aula-01.md ... aula-11.md
├── questionarios/
│   └── aula-01.md ... aula-11.md
├── modelos/
│   └── aula-template.md
└── assets/
    ├── images/
    └── stylesheets/
```

## 💻 Consultar a versão legada MkDocs

### Windows / PowerShell

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
mkdocs serve
```

### Linux / WSL

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
mkdocs serve
```

Depois acesse `http://127.0.0.1:8000`.

## ➕ Adicionar uma nova aula

1. Copie `docs/modelos/aula-template.md`.
2. Salve como `docs/aulas/aula-11.md`, `aula-12.md` etc., usando a próxima numeração disponível.
3. Preencha o conteúdo da aula.
4. Acrescente a nova página no `mkdocs.yml`.
5. Atualize o `docs/dicionario.md`.
6. Crie o questionário correspondente.
7. Faça commit e push.

O workflow em `.github/workflows/validate.yml` verifica o acervo MkDocs nos pull requests. O workflow `validate-astro.yml` compila o site Astro. O workflow em `.github/workflows/deploy.yml` publica `astro/dist/` no GitHub Pages a cada push na branch `main`.

## ✅ Diagnóstico do deploy

A execução #98 (16/10/2026) concluiu o build estrito e o deploy com sucesso. Os logs apresentam avisos de descontinuação do Node.js e de APIs internas usadas pelas ações do GitHub Pages; esses avisos não impediram a publicação. Alterações futuras devem manter o build estrito e atualizar as ações oficiais somente após verificar compatibilidade.
