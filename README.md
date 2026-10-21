# 📚 Catequese Tradicional

Site de estudos da **Catequese Tradicional**, organizado com **MkDocs + Material for MkDocs**.

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
│   └── aula-01.md ... aula-10.md
├── questionarios/
│   └── aula-01.md ... aula-09.md
├── modelos/
│   └── aula-template.md
└── assets/
    ├── images/
    └── stylesheets/
```

## 💻 Rodar localmente

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

O workflow em `.github/workflows/validate.yml` verifica o build estrito nos pull requests para `main`, sem publicar. O workflow em `.github/workflows/deploy.yml` faz o build e publica no GitHub Pages a cada push na branch `main`.

## ✅ Diagnóstico do deploy

A execução #98 (16/10/2026) concluiu o build estrito e o deploy com sucesso. Os logs apresentam avisos de descontinuação do Node.js e de APIs internas usadas pelas ações do GitHub Pages; esses avisos não impediram a publicação. Alterações futuras devem manter o build estrito e atualizar as ações oficiais somente após verificar compatibilidade.
