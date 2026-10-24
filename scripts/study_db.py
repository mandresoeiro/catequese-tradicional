#!/usr/bin/env python3
"""Banco de questões e backups SQLite. Somente biblioteca padrão do Python."""
from __future__ import annotations

import argparse
from contextlib import closing
from datetime import datetime, timedelta, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
import subprocess
import sys
import tempfile
import time
import uuid

ROOT = Path(__file__).resolve().parents[1]
MARKER = 'catequese-sqlite-backup/v1'
BACKUP_NAME = re.compile(r'^catequese-\d{8}T\d{12}Z-[0-9a-f]{8}\.sqlite3$')


def resolve_path(value: str) -> Path:
    path = Path(value).expanduser()
    return (ROOT / path).resolve() if not path.is_absolute() else path.resolve()


def configuration(path: Path) -> dict:
    settings = dict(database='data/catequese.sqlite3', backup_directory='backups/sqlite',
                    external_directory=None, retention_days=30)
    if path.exists():
        settings.update(json.loads(path.read_text(encoding='utf-8')))
    if type(settings['retention_days']) is not int or settings['retention_days'] < 1:
        raise ValueError('retention_days deve ser um inteiro positivo.')
    return settings


def connect_readonly(path: Path) -> sqlite3.Connection:
    if not path.is_file():
        raise FileNotFoundError(f'Banco não encontrado: {path}')
    return sqlite3.connect(path.as_uri() + '?mode=ro', uri=True, timeout=15)


def inspect_database(path: Path) -> dict:
    with closing(connect_readonly(path)) as connection:
        checks = [row[0] for row in connection.execute('PRAGMA integrity_check')]
        if checks != ['ok']:
            raise ValueError(f'Banco corrompido: {checks}')
        if connection.execute('PRAGMA foreign_key_check').fetchone():
            raise ValueError('Banco contém referências inválidas.')
        if connection.execute('PRAGMA user_version').fetchone()[0] not in (1, 2):
            raise ValueError('Versão de banco desconhecida; operação cancelada.')
        return {table: connection.execute(f'SELECT COUNT(*) FROM {table}').fetchone()[0]
                for table in ('lessons', 'questions', 'question_options', 'attempts')}


def digest(path: Path) -> str:
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def parse_questionnaires(docs: Path) -> list[dict]:
    lessons = []
    key_path = ROOT / 'database/answer-keys.json'
    answer_keys = json.loads(key_path.read_text(encoding='utf-8'))['lessons'] if key_path.exists() else {}
    for source in sorted((docs / 'questionarios').glob('aula-*.md')):
        raw = source.read_text(encoding='utf-8')
        lesson_source = docs / 'aulas' / source.name
        title = re.search(r'^#\s+(.+)$', lesson_source.read_text(encoding='utf-8'), re.M)
        if not title:
            raise ValueError(f'Título ausente: {lesson_source}')
        matches = list(re.finditer(r'^###\s+(\d+)\.\s+(.+)$', raw, re.M))
        key = answer_keys.get(source.stem)
        if key and (key.get('source_sha256') != hashlib.sha256(raw.encode('utf-8')).hexdigest() or len(key['answers']) != len(matches)):
            raise ValueError(f'Gabarito desatualizado ou incompleto: {source.name}')
        questions = []
        for index, match in enumerate(matches):
            block = raw[match.end():matches[index + 1].start() if index + 1 < len(matches) else len(raw)]
            options = re.findall(r'^-\s+\[[ xX]\]\s+([A-D])\.\s+(.+)$', block, re.M)
            if len(options) != 4 or [key for key, _ in options] != list('ABCD'):
                raise ValueError(f'Alternativas inválidas: {source.name}, questão {match[1]}')
            prompt = match[2].strip()
            number = int(match[1])
            content_hash = hashlib.sha256(json.dumps([prompt, options], ensure_ascii=False).encode()).hexdigest()
            answer, explanation = key['answers'][index] if key else (None, None)
            if key and (answer not in 'ABCD' or not explanation):
                raise ValueError(f'Gabarito inválido: {source.name}, questão {number}')
            questions.append(dict(id=f'{source.stem}:{number}:{content_hash[:16]}', number=number,
                                  prompt=prompt, options=options, content_hash=content_hash,
                                  answer=answer, explanation=explanation))
        if not questions or len({q['number'] for q in questions}) != len(questions):
            raise ValueError(f'Questionário vazio ou com numeração duplicada: {source}')
        lessons.append(dict(slug=source.stem, title=title[1], source='docs/questionarios/' + source.name,
                            questions=questions))
    if not lessons:
        raise ValueError('Nenhum questionário encontrado.')
    return lessons


def initialize(database: Path, docs: Path) -> dict:
    lessons = parse_questionnaires(docs)  # Validar todos os textos antes de alterar o banco.
    database.parent.mkdir(parents=True, exist_ok=True)
    with closing(sqlite3.connect(database)) as connection:
        version = connection.execute('PRAGMA user_version').fetchone()[0]
        tables = connection.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
        if version not in (0, 1, 2) or (version == 0 and tables):
            raise ValueError('Arquivo já contém outro banco; não será modificado.')
        if version == 0:
            connection.executescript((ROOT / 'database/schema.sql').read_text(encoding='utf-8'))
        if connection.execute('PRAGMA user_version').fetchone()[0] == 1:
            connection.executescript((ROOT / 'database/migrations/002_personal_study.sql').read_text(encoding='utf-8'))
        connection.execute('PRAGMA foreign_keys = ON')
        with connection:
            for lesson in lessons:
                connection.execute('INSERT INTO lessons VALUES (?, ?, ?) ON CONFLICT(slug) DO UPDATE SET title=excluded.title, source_path=excluded.source_path',
                                   (lesson['slug'], lesson['title'], lesson['source']))
                connection.execute('UPDATE questions SET is_active=0 WHERE lesson_slug=?', (lesson['slug'],))
                for question in lesson['questions']:
                    connection.execute('INSERT INTO questions(id,lesson_slug,number,prompt,content_hash,correct_option,explanation) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET is_active=1, correct_option=excluded.correct_option, explanation=excluded.explanation',
                                       (question['id'], lesson['slug'], question['number'], question['prompt'], question['content_hash'], question['answer'], question['explanation']))
                    connection.executemany('INSERT OR IGNORE INTO question_options VALUES(?,?,?)',
                                           [(question['id'], label, text) for label, text in question['options']])
    return inspect_database(database)


def snapshot(source: Path, target: Path) -> None:
    deadline = time.monotonic() + 60
    def progress(status, remaining, total):
        if time.monotonic() > deadline:
            raise TimeoutError('Tempo máximo para gerar o snapshot excedido.')
    with closing(connect_readonly(source)) as origin, closing(sqlite3.connect(target)) as destination:
        origin.backup(destination, pages=256, progress=progress, sleep=0.05)
    with target.open('rb') as stream:
        os.fsync(stream.fileno())
    inspect_database(target)


def prune(directory: Path, days: int) -> None:
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    for file in directory.glob('catequese-*.sqlite3'):
        if not BACKUP_NAME.fullmatch(file.name) or file.is_symlink():
            continue
        manifest = file.with_suffix('.json')
        try:
            metadata = json.loads(manifest.read_text(encoding='utf-8'))
            timestamp = datetime.fromisoformat(metadata['created_at'])
            if metadata.get('application') == MARKER and metadata.get('filename') == file.name and timestamp < cutoff:
                file.unlink()
                manifest.unlink()
        except (OSError, ValueError, KeyError, TypeError):
            continue  # Nunca remover arquivos sem identificação válida.


def mirror_windows(backup: Path, external: str, days: int) -> dict:
    """Drive virtual do Google Drive: Windows acessa J: mesmo sem montagem WSL."""
    backup_windows = subprocess.check_output(['wslpath', '-w', str(backup)], text=True).strip()
    payload = json.dumps(dict(source=backup_windows, destination=external, retention_days=days))
    result = subprocess.run(['powershell.exe', '-NoProfile', '-NonInteractive', '-Command',
                             (ROOT / 'scripts/mirror-backup.ps1').read_text(encoding='utf-8')],
                            input=payload, text=True, encoding='utf-8', capture_output=True, timeout=120)
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or 'Falha na cópia externa.')
    return json.loads(result.stdout.lstrip('\ufeff').strip())


def mirror_posix(backup: Path, directory: Path, days: int) -> dict:
    # Não recriar silenciosamente um ponto de montagem ausente.
    if not directory.is_dir():
        raise FileNotFoundError(f'Destino externo indisponível: {directory}')
    target = directory / backup.name
    if target.exists():
        raise FileExistsError(target)
    manifest = backup.with_suffix('.json')
    temporary = directory / (backup.name + '.partial')
    try:
        with backup.open('rb') as origin, temporary.open('xb') as destination:
            while chunk := origin.read(1024 * 1024):
                destination.write(chunk)
            destination.flush()
            os.fsync(destination.fileno())
        if digest(temporary) != digest(backup):
            raise ValueError('Checksum da cópia externa não confere.')
        temporary.rename(target)
        target.with_suffix('.json').write_bytes(manifest.read_bytes())
        prune(directory, days)
    finally:
        temporary.unlink(missing_ok=True)
    return dict(path=str(target), sha256=digest(target), verified=True)


def make_backup(settings: dict) -> dict:
    database = resolve_path(settings['database'])
    directory = resolve_path(settings['backup_directory'])
    inspect_database(database)
    if database.is_relative_to(directory):
        raise ValueError('O banco ativo não pode ficar dentro da pasta de backups.')
    directory.mkdir(parents=True, exist_ok=True)
    now = datetime.now(timezone.utc)
    filename = 'catequese-' + now.strftime('%Y%m%dT%H%M%S%fZ') + '-' + uuid.uuid4().hex[:8] + '.sqlite3'
    target = directory / filename
    temporary = directory / (filename + '.partial')
    try:
        snapshot(database, temporary)
        temporary.rename(target)
    finally:
        temporary.unlink(missing_ok=True)
    manifest = dict(application=MARKER, filename=filename, created_at=now.isoformat(),
                    sha256=digest(target), size_bytes=target.stat().st_size, counts=inspect_database(target))
    target.with_suffix('.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding='utf-8')
    result = dict(local=str(target), counts=manifest['counts'], verified=True, external=None)
    external = settings.get('external_directory')
    # A cópia local fica preservada mesmo quando a nuvem não está disponível.
    try:
        if external:
            result['external'] = mirror_windows(target, external, settings['retention_days']) if re.match(r'^[A-Za-z]:[\\/]', external) and os.name != 'nt' else mirror_posix(target, resolve_path(external), settings['retention_days'])
        else:
            result['warning'] = 'Sem destino externo: backup protege apenas contra perda lógica, não perda do computador.'
    except (OSError, ValueError, RuntimeError, subprocess.SubprocessError) as error:
        result['external_error'] = str(error)
    if 'external_error' not in result:
        prune(directory, settings['retention_days'])
    return result


def verify_backup(backup: Path) -> dict:
    manifest = json.loads(backup.with_suffix('.json').read_text(encoding='utf-8'))
    if manifest.get('application') != MARKER or manifest.get('filename') != backup.name or manifest.get('sha256') != digest(backup):
        raise ValueError('Backup alterado, incompleto ou não reconhecido.')
    return inspect_database(backup)


def restore_backup(backup: Path, output: Path) -> dict:
    counts = verify_backup(backup)
    if output.exists() or output.is_symlink():
        raise FileExistsError('O destino já existe. Restaure para um arquivo novo; o banco atual não será sobrescrito.')
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=output.parent, prefix='.restore-') as temporary:
        restored = Path(temporary) / 'restored.sqlite3'
        snapshot(backup, restored)
        # Link atômico e exclusivo: nunca substituir arquivo criado por outro processo.
        os.link(restored, output)
    return dict(restored=str(output), counts=counts, verified=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', type=Path, default=ROOT / '.local/backup.json')
    sub = parser.add_subparsers(dest='command', required=True)
    sub.add_parser('init', help='Importar questionários e gabaritos de estudo versionados.')
    sub.add_parser('backup', help='Criar snapshot, verificar e copiar ao destino externo.')
    sub.add_parser('status', help='Conferir o banco e mostrar os backups locais.')
    verify = sub.add_parser('verify', help='Validar checksum e integridade de um backup.')
    verify.add_argument('backup', type=Path)
    restore = sub.add_parser('restore', help='Restaurar em um arquivo novo, preservando o banco atual.')
    restore.add_argument('backup', type=Path)
    restore.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    try:
        settings = configuration(args.config)
        if args.command == 'init':
            result = dict(database=str(resolve_path(settings['database'])), counts=initialize(resolve_path(settings['database']), ROOT / 'docs'))
        elif args.command == 'backup':
            result = make_backup(settings)
        elif args.command == 'status':
            result = dict(database=str(resolve_path(settings['database'])), counts=inspect_database(resolve_path(settings['database'])),
                          external_directory=settings.get('external_directory'),
                          backups=[str(path) for path in sorted(resolve_path(settings['backup_directory']).glob('catequese-*.sqlite3')) if BACKUP_NAME.fullmatch(path.name)])
        elif args.command == 'verify':
            result = dict(counts=verify_backup(args.backup.resolve()), verified=True)
        else:
            result = restore_backup(args.backup.resolve(), args.output.resolve())
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return 1 if result.get('external_error') else 0
    except (OSError, ValueError, sqlite3.Error, subprocess.SubprocessError) as error:
        print(f'Erro: {error}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
