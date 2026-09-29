# 📚 Catequese Tradicional

Site de estudos da **Catequese Tradicional**, organizado com **MkDocs + Material for MkDocs**.

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
│   └── aula-01.md
├── questionarios/
│   └── aula-01.md
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
2. Salve como `docs/aulas/aula-02.md`, `aula-03.md` etc.
3. Preencha o conteúdo da aula.
4. Acrescente a nova página no `mkdocs.yml`.
5. Atualize o `docs/dicionario.md`.
6. Crie o questionário correspondente.
7. Faça commit e push.

O workflow em `.github/workflows/deploy.yml` faz o build e prepara a publicação automática no GitHub Pages a cada push na branch `main`.
