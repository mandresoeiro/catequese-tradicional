"""Testes de recuperação; todos os dados são criados em diretórios temporários."""
from contextlib import closing
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import sqlite3
import shutil
import tempfile
import unittest

import study_db as db


class BackupTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.database = self.root / 'study.sqlite3'
        self.directory = self.root / 'backups'
        self.external = self.root / 'external'
        self.external.mkdir()
        self.settings = dict(database=str(self.database), backup_directory=str(self.directory),
                             external_directory=str(self.external), retention_days=30)
        db.initialize(self.database, db.ROOT / 'docs')

    def tearDown(self):
        self.temporary.cleanup()

    def test_import_is_idempotent_and_uses_versioned_keys(self):
        initial = db.inspect_database(self.database)
        db.initialize(self.database, db.ROOT / 'docs')
        self.assertEqual(initial, db.inspect_database(self.database))
        with closing(db.connect_readonly(self.database)) as connection:
            self.assertEqual(initial['questions'], connection.execute('SELECT COUNT(*) FROM questions WHERE correct_option IS NOT NULL AND explanation IS NOT NULL').fetchone()[0])
            self.assertEqual(0, connection.execute('SELECT COUNT(*) FROM questions q WHERE NOT EXISTS (SELECT 1 FROM question_options o WHERE o.question_id=q.id AND o.label=q.correct_option)').fetchone()[0])

    def test_wal_snapshot_and_restore_preserve_attempts(self):
        with closing(sqlite3.connect(self.database)) as connection:
            connection.execute('PRAGMA journal_mode=WAL')
            question = connection.execute('SELECT id FROM questions LIMIT 1').fetchone()[0]
            connection.execute('INSERT INTO attempts(question_id, selected_option) VALUES(?, ?)', (question, 'B'))
            connection.commit()
            result = db.make_backup(self.settings)
            self.assertTrue(result['external']['verified'])
            backup = Path(result['local'])
            self.assertEqual(1, db.verify_backup(backup)['attempts'])
            restored = self.root / 'restored.sqlite3'
            db.restore_backup(backup, restored)
            self.assertEqual(1, db.inspect_database(restored)['attempts'])

    def test_questionnaire_edit_requires_key_review_before_database_changes(self):
        docs = self.root / 'docs'
        shutil.copytree(db.ROOT / 'docs', docs)
        source = docs / 'questionarios/aula-01.md'
        source.write_text(source.read_text() + '\nAlteração no questionário.\n')
        original = db.digest(self.database)
        with self.assertRaisesRegex(ValueError, 'Gabarito desatualizado'):
            db.initialize(self.database, docs)
        self.assertEqual(original, db.digest(self.database))

    def test_windows_line_endings_keep_keys_valid(self):
        docs = self.root / 'docs'
        shutil.copytree(db.ROOT / 'docs', docs)
        for source in (docs / 'questionarios').glob('*.md'):
            source.write_bytes(source.read_text().replace('\n', '\r\n').encode('utf-8'))
        self.assertEqual(db.inspect_database(self.database), db.initialize(self.root / 'windows.sqlite3', docs))

    def test_restore_never_overwrites_existing_database(self):
        backup = Path(db.make_backup(self.settings)['local'])
        original = db.digest(self.database)
        with self.assertRaises(FileExistsError):
            db.restore_backup(backup, self.database)
        self.assertEqual(original, db.digest(self.database))

    def test_corrupted_backup_is_rejected_before_restoring(self):
        backup = Path(db.make_backup(self.settings)['local'])
        backup.write_bytes(b'corrupted')
        restored = self.root / 'restored.sqlite3'
        with self.assertRaises(ValueError):
            db.restore_backup(backup, restored)
        self.assertFalse(restored.exists())

    def test_external_failure_keeps_local_backup_and_reports_failure(self):
        self.settings['external_directory'] = str(self.root / 'missing-mount' / 'backups')
        result = db.make_backup(self.settings)
        self.assertIn('external_error', result)
        self.assertTrue(Path(result['local']).exists())
        self.assertTrue(db.verify_backup(Path(result['local'])))
        self.assertFalse((self.root / 'missing-mount').exists())

    def test_retention_only_removes_expired_managed_pairs(self):
        backup = Path(db.make_backup(self.settings)['local'])
        metadata_path = backup.with_suffix('.json')
        metadata = json.loads(metadata_path.read_text())
        metadata['created_at'] = (datetime.now(timezone.utc) - timedelta(days=31)).isoformat()
        metadata_path.write_text(json.dumps(metadata))
        unrelated = self.directory / 'meu-arquivo.sqlite3'
        unrelated.write_text('não remover')
        db.prune(self.directory, 30)
        self.assertFalse(backup.exists())
        self.assertFalse(metadata_path.exists())
        self.assertTrue(unrelated.exists())


if __name__ == '__main__':
    unittest.main()
