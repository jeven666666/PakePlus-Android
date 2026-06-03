import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || './data/agnes.db';
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db: Database.Database = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT DEFAULT '',
    signature TEXT DEFAULT '',
    membership TEXT DEFAULT 'free' CHECK(membership IN ('free','pro','enterprise')),
    membership_expires_at INTEGER DEFAULT 0,
    credits INTEGER DEFAULT 100,
    storage_used REAL DEFAULT 0,
    storage_limit REAL DEFAULT 1,
    invite_code TEXT UNIQUE,
    invited_by TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('image','video','tts','chat','editor','batch')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','submitted','queued','running','success','failed','canceled')),
    prompt TEXT NOT NULL DEFAULT '',
    negative_prompt TEXT DEFAULT '',
    params TEXT DEFAULT '{}',
    progress INTEGER DEFAULT 0,
    result_urls TEXT DEFAULT '[]',
    error_message TEXT DEFAULT '',
    credits_cost INTEGER DEFAULT 0,
    model TEXT DEFAULT '',
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    task_id TEXT,
    type TEXT NOT NULL CHECK(type IN ('image','video','audio')),
    file_path TEXT NOT NULL,
    thumbnail_path TEXT DEFAULT '',
    file_size INTEGER DEFAULT 0,
    width INTEGER DEFAULT 0,
    height INTEGER DEFAULT 0,
    duration REAL DEFAULT 0,
    favorited INTEGER DEFAULT 0,
    metadata TEXT DEFAULT '{}',
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    type TEXT NOT NULL CHECK(type IN ('prompt','params','style')),
    content TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS model_configs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    alias TEXT DEFAULT '',
    provider TEXT DEFAULT '',
    api_base_url TEXT DEFAULT '',
    api_key TEXT DEFAULT '',
    model_type TEXT NOT NULL DEFAULT 'chat' CHECK(model_type IN ('chat','image','video','tts','multimodal')),
    context_length INTEGER DEFAULT 8192,
    max_output_length INTEGER DEFAULT 4096,
    capabilities TEXT DEFAULT '["text"]',
    temperature REAL DEFAULT 0.7,
    top_p REAL DEFAULT 0.9,
    enabled INTEGER DEFAULT 1,
    is_default INTEGER DEFAULT 0,
    remark TEXT DEFAULT '',
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_assets_user ON assets(user_id);
  CREATE INDEX IF NOT EXISTS idx_templates_user ON templates(user_id);
  CREATE INDEX IF NOT EXISTS idx_model_configs_user ON model_configs(user_id);

  CREATE TABLE IF NOT EXISTS credits_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE INDEX IF NOT EXISTS idx_credits_history_user ON credits_history(user_id);
`);

export default db;
