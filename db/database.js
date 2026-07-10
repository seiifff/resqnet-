// ResQNet — Database layer
// Uses Node's built-in SQLite (node:sqlite, Node 22.5+) — zero dependencies,
// nothing to compile. All queries are standard SQL via prepared statements,
// so migrating to MySQL later only means replacing this file.
const { DatabaseSync } = require("node:sqlite");
const path = require("path");
const bcrypt = require("bcryptjs");

const db = new DatabaseSync(path.join(__dirname, "resqnet.db"));
db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name   TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    phone       TEXT    NOT NULL,
    password    TEXT    NOT NULL,
    role        TEXT    NOT NULL CHECK (role IN ('citizen','volunteer','admin')),
    skills      TEXT    DEFAULT NULL,   -- JSON array, volunteers only
    district    TEXT    DEFAULT NULL,   -- volunteers only
    trust_score INTEGER NOT NULL DEFAULT 100,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS incidents (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    citizen_id  INTEGER NOT NULL REFERENCES users(id),
    type        TEXT    NOT NULL CHECK (type IN ('flood','fire','accident','medical')),
    description TEXT    NOT NULL DEFAULT '',
    lat         REAL    NOT NULL,
    lng         REAL    NOT NULL,
    resource    TEXT    DEFAULT NULL,  -- water / medical / evacuation / food
    photo       TEXT    DEFAULT NULL,  -- stored filename in /uploads
    severity    INTEGER NOT NULL DEFAULT 1,  -- 1 low · 2 medium · 3 high
    status      TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active','responding','resolved')),
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// ---- Sprint 2 columns (safe to re-run on existing databases) ----
const addCol = (sql) => { try { db.exec(sql); } catch { /* column already exists */ } };
addCol("ALTER TABLE incidents ADD COLUMN responder_id INTEGER DEFAULT NULL");
addCol("ALTER TABLE incidents ADD COLUMN responded_at TEXT DEFAULT NULL");
addCol("ALTER TABLE incidents ADD COLUMN last_checkin TEXT DEFAULT NULL");
addCol("ALTER TABLE incidents ADD COLUMN resolved_at TEXT DEFAULT NULL");
addCol("ALTER TABLE incidents ADD COLUMN escalated INTEGER NOT NULL DEFAULT 0");
addCol("ALTER TABLE incidents ADD COLUMN false_report INTEGER NOT NULL DEFAULT 0");

addCol("ALTER TABLE incidents ADD COLUMN district TEXT DEFAULT NULL");

db.exec(`
  CREATE TABLE IF NOT EXISTS broadcasts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id    INTEGER NOT NULL REFERENCES users(id),
    district    TEXT    NOT NULL,   -- district name or 'ALL'
    body        TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_id INTEGER NOT NULL REFERENCES incidents(id),
    sender_id   INTEGER NOT NULL REFERENCES users(id),
    body        TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// Seed one admin account for demos (change password before any real deployment)
const adminExists = db.prepare("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1").get();
if (!adminExists) {
  db.prepare(
    "INSERT INTO users (full_name, email, phone, password, role) VALUES (?, ?, ?, ?, 'admin')"
  ).run("ResQNet Admin", "admin@resqnet.lk", "0000000000", bcrypt.hashSync("Admin@2026", 10));
  console.log("Seeded admin account → admin@resqnet.lk / Admin@2026");
}

module.exports = db;
