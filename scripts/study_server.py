#!/usr/bin/env python3
"""Servidor pessoal: site Astro compilado e persistência SQLite, somente no computador."""
from __future__ import annotations

import argparse
from contextlib import closing
from datetime import datetime, timedelta, timezone
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import re
import sqlite3
from urllib.parse import unquote, urlsplit

import study_db

BASE = '/catequese-tradicional/'
SLUG = re.compile(r'^aula-\d+$')


def connect(path):
    if not path.is_file():
        raise ValueError('Banco pessoal não encontrado.')
    connection = sqlite3.connect(path.as_uri() + '?mode=rw', uri=True, timeout=15)
    connection.row_factory = sqlite3.Row
    connection.execute('PRAGMA foreign_keys=ON')
    return connection


def lesson_exists(connection, slug):
    if not SLUG.fullmatch(slug) or not connection.execute('SELECT 1 FROM lessons WHERE slug=?', (slug,)).fetchone():
        raise ValueError('Aula inválida.')


def current_question(connection, slug, number):
    lesson_exists(connection, slug)
    row = connection.execute('SELECT * FROM questions WHERE lesson_slug=? AND number=? AND is_active=1', (slug, number)).fetchone()
    if not row:
        raise ValueError('Questão não encontrada.')
    return row


def question_data(connection, row):
    return dict(number=row['number'], slug=row['lesson_slug'], id=row['id'], prompt=row['prompt'],
                options=[dict(option) for option in connection.execute('SELECT label,text FROM question_options WHERE question_id=? ORDER BY label', (row['id'],))],
                answer=row['correct_option'], explanation=row['explanation'])


def review_questions(connection, errors_only=False):
    now = datetime.now(timezone.utc)
    result = []
    for row in connection.execute('SELECT q.*,COALESCE(f.needs_review,0) AS flagged FROM questions q LEFT JOIN question_flags f ON f.question_id=q.id WHERE q.is_active=1 ORDER BY q.lesson_slug,q.number'):
        attempts = connection.execute('SELECT selected_option,answered_at FROM attempts WHERE question_id=? ORDER BY answered_at DESC,id DESC', (row['id'],)).fetchall()
        incorrect = bool(attempts and attempts[0]['selected_option'] != row['correct_option'])
        streak = 0
        for attempt in attempts:
            if attempt['selected_option'] != row['correct_option']:
                break
            streak += 1
        interval = (1, 7, 30)[min(max(streak - 1, 0), 2)]
        due = incorrect or bool(row['flagged'])
        if attempts and not due:
            last = datetime.fromisoformat(attempts[0]['answered_at']).replace(tzinfo=timezone.utc)
            due = last + timedelta(days=interval) <= now
        if incorrect if errors_only else due:
            item = question_data(connection, row)
            item.update(reason='Rever erro' if incorrect else 'Dúvida marcada' if row['flagged'] else 'Revisão programada')
            result.append(item)
    return result


def read_state(connection, route):
    if route == 'dashboard':
        progress = [dict(row) for row in connection.execute('SELECT p.*,l.title FROM study_progress p JOIN lessons l ON l.slug=p.lesson_slug ORDER BY p.updated_at DESC,p.rowid DESC')]
        due = review_questions(connection)
        return dict(progress=progress, resume=progress[0] if progress else None, review_count=len(due),
                    completed=sum(row['status'] == 'completed' for row in progress),
                    attempts=connection.execute('SELECT COUNT(*) FROM attempts').fetchone()[0],
                    lessons=connection.execute('SELECT COUNT(*) FROM lessons').fetchone()[0])
    if route in ('review', 'errors'):
        questions = review_questions(connection, route == 'errors')
        return dict(total=len(questions), questions=questions[:10] if route == 'review' else questions)
    if route.startswith('lesson/'):
        slug = route.split('/')[1]
        lesson_exists(connection, slug)
        progress = connection.execute('SELECT * FROM study_progress WHERE lesson_slug=?', (slug,)).fetchone()
        note = connection.execute('SELECT body FROM study_notes WHERE lesson_slug=?', (slug,)).fetchone()
        flags = [row[0] for row in connection.execute('SELECT q.number FROM question_flags f JOIN questions q ON q.id=f.question_id WHERE q.lesson_slug=? AND q.is_active=1 AND f.needs_review=1', (slug,))]
        return dict(progress=dict(progress) if progress else None, note=note[0] if note else '', flags=flags)
    if route == 'reading':
        return dict(items=[dict(row) for row in connection.execute('SELECT * FROM reading_status')])
    raise LookupError('Recurso não encontrado.')


def write_state(connection, route, payload):
    with connection:
        if route.startswith('lesson/'):
            slug = route.split('/')[1]
            lesson_exists(connection, slug)
            if 'note' in payload:
                note = payload['note']
                if not isinstance(note, str) or len(note) > 20000:
                    raise ValueError('A anotação deve ter até 20.000 caracteres.')
                connection.execute('INSERT INTO study_notes(lesson_slug,body) VALUES(?,?) ON CONFLICT(lesson_slug) DO UPDATE SET body=excluded.body,updated_at=CURRENT_TIMESTAMP', (slug, note))
            if 'status' in payload or 'section' in payload:
                previous = connection.execute('SELECT status,last_section FROM study_progress WHERE lesson_slug=?', (slug,)).fetchone()
                status = payload.get('status', previous['status'] if previous else 'in_progress')
                section = payload.get('section', previous['last_section'] if previous else '')
                if status not in ('in_progress', 'completed') or not isinstance(section, str) or not re.fullmatch(r'[\w-]{0,200}', section):
                    raise ValueError('Progresso inválido.')
                connection.execute('INSERT INTO study_progress(lesson_slug,status,last_section) VALUES(?,?,?) ON CONFLICT(lesson_slug) DO UPDATE SET status=excluded.status,last_section=excluded.last_section,updated_at=CURRENT_TIMESTAMP', (slug, status, section))
            return dict(saved=True)
        if route == 'flags':
            number = payload.get('number')
            if type(number) is not int or type(payload.get('needs_review')) is not bool:
                raise ValueError('Marcação inválida.')
            question = current_question(connection, payload.get('slug', ''), number)
            connection.execute('INSERT INTO question_flags(question_id,needs_review) VALUES(?,?) ON CONFLICT(question_id) DO UPDATE SET needs_review=excluded.needs_review,updated_at=CURRENT_TIMESTAMP', (question['id'], int(payload['needs_review'])))
            return dict(saved=True)
        if route == 'attempts':
            session = payload.get('session_id', '')
            answers = payload.get('answers', [])
            mode = payload.get('mode', 'lesson')
            if not isinstance(session, str) or not re.fullmatch(r'[\w-]{16,80}', session) or not isinstance(answers, list) or not 1 <= len(answers) <= 165 or mode not in ('lesson', 'review'):
                raise ValueError('Tentativa inválida.')
            slug = payload.get('slug') if mode == 'lesson' else None
            if slug:
                lesson_exists(connection, slug)
            if connection.execute('SELECT 1 FROM quiz_sessions WHERE id=?', (session,)).fetchone():
                return dict(saved=True, duplicate=True)
            validated = []
            for answer in answers:
                if not isinstance(answer, dict) or type(answer.get('number')) is not int or answer.get('option') not in ('A','B','C','D'):
                    raise ValueError('Resposta inválida.')
                row = current_question(connection, slug or answer.get('slug', ''), answer['number'])
                validated.append((row['id'], answer['option'], session))
            if len({row[0] for row in validated}) != len(validated):
                raise ValueError('Questão repetida na tentativa.')
            connection.execute('INSERT INTO quiz_sessions(id,lesson_slug,mode) VALUES(?,?,?)', (session, slug, mode))
            connection.executemany('INSERT INTO attempts(question_id,selected_option,session_id) VALUES(?,?,?)', validated)
            return dict(saved=True, count=len(validated))
        if route == 'reading':
            work = payload.get('work_id', '')
            status = payload.get('status')
            note = payload.get('note', '')
            if not isinstance(work, str) or not re.fullmatch(r'[a-z0-9-]{1,100}', work) or status not in ('want','in_progress','completed') or not isinstance(note, str) or len(note)>20000:
                raise ValueError('Registro de leitura inválido.')
            connection.execute('INSERT INTO reading_status(work_id,status,note) VALUES(?,?,?) ON CONFLICT(work_id) DO UPDATE SET status=excluded.status,note=excluded.note,updated_at=CURRENT_TIMESTAMP', (work,status,note))
            return dict(saved=True)
    raise LookupError('Recurso não encontrado.')


class StudyHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, database, directory, **kwargs):
        self.database = database
        self.root = Path(directory).resolve()
        super().__init__(*args, directory=str(directory), **kwargs)

    def valid_host(self):
        port = self.server.server_address[1]
        return self.headers.get('Host') in (f'localhost:{port}', f'127.0.0.1:{port}', f'[::1]:{port}')

    def respond(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if not self.valid_host():
            return self.respond(403, dict(error='Endereço não autorizado.'))
        path = urlsplit(self.path).path
        if path.startswith(BASE + 'api/'):
            try:
                with closing(connect(self.database)) as connection:
                    return self.respond(200, read_state(connection, path[len(BASE+'api/'):]))
            except LookupError as error:
                return self.respond(404, dict(error=str(error)))
            except (ValueError, sqlite3.Error) as error:
                return self.respond(400, dict(error=str(error)))
        if not path.startswith(BASE):
            self.send_error(404)
            return
        relative = unquote(path[len(BASE):])
        target = (self.root / relative).resolve()
        if not target.is_relative_to(self.root) or any(part.startswith('.') for part in Path(relative).parts):
            self.send_error(404)
            return
        if target.is_dir():
            target /= 'index.html'
        if not target.is_file():
            self.send_error(404)
            return
        self.path = '/' + target.relative_to(self.root).as_posix()
        super().do_GET()

    def do_POST(self):
        expected_origin = f'http://{self.headers.get("Host", "")}'
        if not self.valid_host() or self.headers.get('Origin', expected_origin) != expected_origin:
            return self.respond(403, dict(error='Origem não autorizada.'))
        if self.headers.get_content_type() != 'application/json':
            return self.respond(415, dict(error='Envie JSON.'))
        path = urlsplit(self.path).path
        if not path.startswith(BASE+'api/'):
            return self.respond(404, dict(error='Recurso não encontrado.'))
        try:
            size = int(self.headers.get('Content-Length','0'))
            if not 0 < size <= 65536:
                return self.respond(413, dict(error='Requisição fora do limite.'))
            payload = json.loads(self.rfile.read(size))
            if not isinstance(payload, dict):
                raise ValueError('Envie um objeto JSON.')
            with closing(connect(self.database)) as connection:
                return self.respond(200, write_state(connection, path[len(BASE+'api/'):], payload))
        except LookupError as error:
            return self.respond(404, dict(error=str(error)))
        except (ValueError, TypeError, sqlite3.Error) as error:
            return self.respond(400, dict(error=str(error)))

    def do_HEAD(self):
        self.send_error(405)  # Não servir outros diretórios através da implementação herdada.


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=4322)
    args = parser.parse_args()
    settings = study_db.configuration(study_db.ROOT / '.local/backup.json')
    database = study_db.resolve_path(settings['database'])
    study_db.initialize(database, study_db.ROOT / 'docs')
    directory = study_db.ROOT / 'astro/dist'
    if not (directory/'index.html').is_file():
        raise SystemExit('Compile primeiro: cd astro && npm run build')
    handler = partial(StudyHandler, database=database, directory=directory)
    server = ThreadingHTTPServer(('127.0.0.1',args.port),handler)
    print(f'Banco pessoal ativo. Acesse http://localhost:{args.port}{BASE}', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
