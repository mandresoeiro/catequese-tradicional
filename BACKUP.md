# Banco pessoal e recuperação

O banco fica em `data/catequese.sqlite3`. Ele contém as 11 aulas cadastradas, 165 questões, 660 alternativas, gabaritos de estudo, tentativas, notas, progresso e estados de leitura. A persistência requer `python3 scripts/study_server.py --port 4322`. Os gabaritos foram elaborados a partir dos resumos locais; não são um gabarito oficial do curso.

## Onde estão as cópias

- Local: `backups/sqlite/`.
- Google Drive: pasta sincronizada indicada em `external_directory` na configuração local.
- Configuração deste computador: `.local/backup.json`, fora do Git.
- Modelo de configuração para outro computador: `backup.config.example.json`.

Cada backup é composto por dois arquivos com o mesmo nome: `.sqlite3` e `.json`. O JSON registra data UTC, contagens e checksum SHA-256. Guarde o par.

O script usa a API de backup do SQLite, verifica a integridade do snapshot e confere o checksum da cópia externa. Não copia diretamente um banco ativo. Mantém 30 dias de arquivos reconhecidos; não apaga documentos pessoais da pasta.

A unidade virtual `J:` não precisa estar montada no WSL: o pequeno auxiliar PowerShell recebe caminhos como dados por stdin e grava a cópia já fechada na pasta sincronizada.

**A cópia na pasta do Drive foi verificada. Isso não comprova o término do upload:** confirme no aplicativo do Google Drive que a sincronização está concluída. Sem a cópia sincronizada, uma cópia local não protege contra perda do computador.

## Backup diário

A automação **Backup diário da Catequese** foi criada neste chat para executar às **20h, America/Fortaleza**, com notificações apenas em caso de falha.

O computador deve estar ligado, o Codex aberto e a unidade do Google Drive disponível. A automação é local e depende das permissões de execução do WSL e de escrita na pasta escolhida. Se precisar de aprovação ou não puder gravar externamente, deve reportar a falha em vez de afirmar que o backup foi concluído. Consulte a [documentação oficial de tarefas agendadas](https://learn.chatgpt.com/docs/automations?surface=app).

## Executar manualmente no WSL

Na raiz do projeto:

```bash
cd /mnt/c/dev/catequese-tradicional-astro
python3 scripts/study_db.py backup
python3 scripts/study_db.py status
```

Sucesso completo exige código de saída zero, `verified: true` e `external.verified: true`. Se aparecer `external_error`, a cópia local permanece preservada e o comando retorna erro. Se o destino externo não estiver configurado, a saída contém um aviso.

## Recuperar em outro computador

1. Recupere o projeto e instale Python 3.11 ou superior no WSL.
2. Baixe do Google Drive o backup `.sqlite3` escolhido e seu `.json` correspondente. Coloque ambos em uma pasta local acessível pelo WSL, por exemplo `backups/recuperados/`.
3. Confira a integridade e restaure para **um arquivo novo**:

```bash
python3 scripts/study_db.py verify backups/recuperados/NOME-DO-BACKUP.sqlite3
python3 scripts/study_db.py restore backups/recuperados/NOME-DO-BACKUP.sqlite3 --output data/catequese-restaurada.sqlite3
```

Substitua `NOME-DO-BACKUP.sqlite3` pelo nome real, mantendo o `.json` ao lado. O comando recusa sobrescrever qualquer arquivo existente. Compare as contagens retornadas antes de usar o arquivo restaurado. Para passar a usá-lo, altere `database` em `.local/backup.json`; antes de trocar o banco de uma futura aplicação, feche suas conexões.

O arquivo SQLite também pode ser aberto por outras ferramentas compatíveis com SQLite; a recuperação dos dados não depende de uma conta no Codex.

## Atualizar o banco a partir dos arquivos

```bash
python3 scripts/study_db.py init
python3 scripts/study_db.py backup
```

O importador não duplica as questões inalteradas. Uma questão modificada recebe outra versão, preservando o histórico. O arquivo `database/answer-keys.json` vincula o gabarito ao checksum do questionário: se o texto mudar, é necessário conferir e atualizar o gabarito antes da importação e da publicação.

## Testes

```bash
python3 -m unittest discover -s scripts -p 'test_study_db.py' -v
```

Os testes usam arquivos temporários: importação idempotente, snapshot com WAL ativo, recuperação das tentativas, recusa de sobrescrita, rejeição de corrupção, falha do destino externo e retenção sem remover arquivos alheios.

**Limite atual:** o banco foi criado e seus gabaritos são importados. O site Astro ainda usa os arquivos versionados para apresentar e corrigir as questões. As respostas marcadas no navegador nesta etapa não são gravadas na tabela `attempts`; a integração com um servidor local é uma etapa separada. O backup do banco não substitui o envio do código e das aulas ao GitHub.
