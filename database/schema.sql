PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS lessons (
    slug TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    source_path TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    lesson_slug TEXT NOT NULL REFERENCES lessons(slug),
    number INTEGER NOT NULL CHECK (number > 0),
    prompt TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    correct_option TEXT CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    explanation TEXT,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (lesson_slug, number, content_hash)
);

CREATE TABLE IF NOT EXISTS question_options (
    question_id TEXT NOT NULL REFERENCES questions(id),
    label TEXT NOT NULL CHECK (label IN ('A', 'B', 'C', 'D')),
    text TEXT NOT NULL,
    PRIMARY KEY (question_id, label)
);

CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY,
    question_id TEXT NOT NULL,
    selected_option TEXT NOT NULL,
    answered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id, selected_option) REFERENCES question_options(question_id, label)
);

CREATE INDEX IF NOT EXISTS questions_by_lesson ON questions(lesson_slug, is_active, number);
CREATE INDEX IF NOT EXISTS attempts_by_question ON attempts(question_id, answered_at);

PRAGMA user_version = 1;
