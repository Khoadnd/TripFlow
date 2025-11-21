const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'trip.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

let db;

async function initDB() {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

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
  `);
}

async function listUsers() {
  const users = await db.all('SELECT id, username, display_name FROM users');
  console.log('\n--- User List ---');
  if (users.length === 0) {
    console.log('No users found.');
  } else {
    console.table(users);
  }
  console.log('-----------------');
}

async function addUser() {
  const username = await question('Enter username: ');
  if (!username) return console.log('Username cannot be empty.');
  
  const password = await question('Enter password: ');
  if (!password) return console.log('Password cannot be empty.');

  try {
    const hash = await bcrypt.hash(password, 10);
    await db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash]);
    console.log(`\nUser '${username}' added successfully.`);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      console.error('\nError: Username already exists.');
    } else {
      console.error('\nError adding user:', err.message);
    }
  }
}

async function deleteUser() {
  await listUsers();
  const username = await question('Enter username to delete: ');
  if (!username) return;

  const result = await db.run('DELETE FROM users WHERE username = ?', username);
  if (result.changes > 0) {
    console.log(`\nUser '${username}' deleted successfully.`);
  } else {
    console.log(`\nUser '${username}' not found.`);
  }
}

async function changePassword() {
  const username = await question('Enter username to change password: ');
  const user = await db.get('SELECT * FROM users WHERE username = ?', username);
  
  if (!user) {
    console.log(`\nUser '${username}' not found.`);
    return;
  }

  const newPassword = await question('Enter new password: ');
  if (!newPassword) return console.log('Password cannot be empty.');

  const hash = await bcrypt.hash(newPassword, 10);
  await db.run('UPDATE users SET password_hash = ? WHERE username = ?', [hash, username]);
  console.log(`\nPassword for '${username}' updated successfully.`);
}

async function main() {
  await initDB();
  console.log(`Connected to database at: ${dbPath}`);

  while (true) {
    console.log('\n=== Admin CLI ===');
    console.log('1. List Users');
    console.log('2. Add User');
    console.log('3. Delete User');
    console.log('4. Change User Password');
    console.log('5. Exit');
    
    const choice = await question('Select an option (1-5): ');

    switch (choice.trim()) {
      case '1':
        await listUsers();
        break;
      case '2':
        await addUser();
        break;
      case '3':
        await deleteUser();
        break;
      case '4':
        await changePassword();
        break;
      case '5':
        console.log('Exiting...');
        await db.close();
        rl.close();
        process.exit(0);
        break;
      default:
        console.log('Invalid option. Please try again.');
    }
  }
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
