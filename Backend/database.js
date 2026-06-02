const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const DB_PATH = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(DB_PATH);

const initDb = () => {
  db.serialize(() => {
    // 1. Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('superadmin', 'teacher', 'student')) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 2. Students Table (Persistent Profiles)
    db.run(`CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      registration_number TEXT UNIQUE,
      full_name TEXT,
      class_name TEXT,
      section TEXT,
      dob TEXT,
      school TEXT,
      family_details TEXT, -- JSON string
      preferences TEXT, -- JSON string (Color, Food, etc)
      assessments TEXT,
      points INTEGER DEFAULT 0,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE INDEX IF NOT EXISTS idx_registration ON students(registration_number)`);

    // Migration: Add holistic assessment columns if missing
    db.run(`ALTER TABLE students ADD COLUMN full_name TEXT`, (err) => {});
    db.run(`ALTER TABLE students ADD COLUMN assessments TEXT`, (err) => {});
    db.run(`ALTER TABLE students ADD COLUMN points INTEGER DEFAULT 0`, (err) => {});
    // Migration: Add schema_v2 columns if missing
    db.run(`ALTER TABLE students ADD COLUMN a2_data TEXT`, (err) => {});
    db.run(`ALTER TABLE students ADD COLUMN gender TEXT`, (err) => {});
    db.run(`ALTER TABLE students ADD COLUMN blood_group TEXT`, (err) => {});
    db.run(`ALTER TABLE students ADD COLUMN height TEXT`, (err) => {});
    db.run(`ALTER TABLE students ADD COLUMN weight TEXT`, (err) => {});
    db.run(`ALTER TABLE students ADD COLUMN address TEXT`, (err) => {});
    db.run(`ALTER TABLE students ADD COLUMN phone TEXT`, (err) => {});
    db.run(`ALTER TABLE students ADD COLUMN mother_tongue TEXT`, (err) => {});
    db.run(`ALTER TABLE students ADD COLUMN medium_of_instruction TEXT`, (err) => {});
    db.run(`ALTER TABLE students ADD COLUMN rural_urban TEXT`, (err) => {});

    console.log("Database schema synced.");

    // 3. Report Cards History
    db.run(`CREATE TABLE IF NOT EXISTS report_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      year INTEGER,
      data TEXT, -- JSON blob of all results
      pdf_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )`);

    // 4. Teachers Table
    db.run(`CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      full_name TEXT,
      account_id TEXT UNIQUE,
      contact TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // 5. Classes Table
    db.run(`CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grade TEXT,
      section TEXT,
      teacher_id INTEGER,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id)
    )`);

    // Insert Default Superadmin if not exists
    const saltRounds = 10;
    const defaultAdminPw = 'admin123';
    const hashedAdminPw = bcrypt.hashSync(defaultAdminPw, saltRounds);

    db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`, 
      ['superadmin', hashedAdminPw, 'superadmin']);

    console.log("Database initialized successfully.");
  });
};

module.exports = { db, initDb };
