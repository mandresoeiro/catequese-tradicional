BEGIN;
CREATE TABLE quiz_sessions (
    id TEXT PRIMARY KEY,
    lesson_slug TEXT REFERENCES lessons(slug),
    mode TEXT NOT NULL CHECK (mode IN ('lesson','review')),
    submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE attempts ADD COLUMN session_id TEXT REFERENCES quiz_sessions(id);
CREATE UNIQUE INDEX attempts_per_session ON attempts(session_id, question_id) WHERE session_id IS NOT NULL;
CREATE TABLE study_progress (
    lesson_slug TEXT PRIMARY KEY REFERENCES lessons(slug),
    status TEXT NOT NULL CHECK (status IN ('in_progress','completed')),
    last_section TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE study_notes (
    lesson_slug TEXT PRIMARY KEY REFERENCES lessons(slug),
    body TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE question_flags (
    question_id TEXT PRIMARY KEY REFERENCES questions(id),
    needs_review INTEGER NOT NULL CHECK (needs_review IN (0,1)),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE reading_status (
    work_id TEXT PRIMARY KEY,
    status TEXT NOT NULL CHECK (status IN ('want','in_progress','completed')),
    note TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
PRAGMA user_version = 2;
COMMIT;
