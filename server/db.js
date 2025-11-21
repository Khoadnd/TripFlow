const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');

async function initDB() {
  const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'trip.db');
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await db.exec('PRAGMA foreign_keys = ON;');

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password_hash TEXT,
      display_name TEXT,
      home_city TEXT,
      home_lat REAL,
      home_lon REAL,
      trip_date TEXT,
      budget_limit REAL
    );

    CREATE TABLE IF NOT EXISTS itinerary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT,
      date TEXT,
      time TEXT,
      location TEXT,
      description TEXT,
      type TEXT,
      lat REAL,
      lon REAL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT,
      status TEXT DEFAULT 'pending',
      due_date TEXT,
      position REAL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT,
      type TEXT,
      path TEXT,
      thumbnail_path TEXT,
      upload_date TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS stays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT,
      address TEXT,
      check_in TEXT,
      check_out TEXT,
      booking_ref TEXT,
      notes TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT,
      amount REAL,
      category TEXT,
      date TEXT,
      notes TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Migrations for existing databases
  const tables = ['itinerary', 'todos', 'documents', 'stays', 'expenses'];
  for (const table of tables) {
    try {
      await db.exec(`ALTER TABLE ${table} ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;`);
      console.log(`Migrated ${table}: Added user_id`);
    } catch (e) {
      // Column likely exists
    }
  }

  // Migration to add columns if they don't exist (for existing dbs)
  try {
    await db.exec(`ALTER TABLE users ADD COLUMN display_name TEXT;`);
  } catch (e) {}
  try {
    await db.exec(`ALTER TABLE users ADD COLUMN home_city TEXT;`);
  } catch (e) {}
  try {
    await db.exec(`ALTER TABLE users ADD COLUMN home_lat REAL;`);
  } catch (e) {}
  try {
    await db.exec(`ALTER TABLE users ADD COLUMN home_lon REAL;`);
  } catch (e) {}
  try {
    await db.exec(`ALTER TABLE users ADD COLUMN trip_date TEXT;`);
  } catch (e) {}
  try {
    await db.exec(`ALTER TABLE users ADD COLUMN budget_limit REAL;`);
  } catch (e) {}

  // Migration for itinerary table
  try {
    await db.exec(`ALTER TABLE itinerary ADD COLUMN lat REAL;`);
  } catch (e) {}
  try {
    await db.exec(`ALTER TABLE itinerary ADD COLUMN lon REAL;`);
  } catch (e) {}

  // Migration for todos table
  try {
    await db.exec(`ALTER TABLE todos ADD COLUMN position REAL;`);
  } catch (e) {}

  // Migration for documents table
  try {
    await db.exec(`ALTER TABLE documents ADD COLUMN thumbnail_path TEXT;`);
  } catch (e) {}

  // Migration for stays table
  try {
    await db.exec(`ALTER TABLE stays ADD COLUMN price REAL;`);
  } catch (e) {}
  try {
    await db.exec(`ALTER TABLE stays ADD COLUMN website TEXT;`);
  } catch (e) {}
  try {
    await db.exec(`ALTER TABLE stays ADD COLUMN phone TEXT;`);
  } catch (e) {}
  try {
    await db.exec(`ALTER TABLE stays ADD COLUMN email TEXT;`);
  } catch (e) {}

  return db;
}

module.exports = { initDB };
