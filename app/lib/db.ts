import sqlite3 from "sqlite3";
import path from "path";

// Initialize the SQLite database connection
// Use /tmp in Vercel because the root filesystem is read-only in production serverless environments.
const dbPath = process.env.VERCEL 
  ? "/tmp/database.sqlite" 
  : path.resolve(process.cwd(), "database.sqlite");

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error connecting to SQLite database:", err);
  } else {
    console.log("Connected to SQLite database.");
  }
});

// Create tables if they don't exist
export function initDb() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        employee_id TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'Active',
        active_task BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        task_id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL,
        token TEXT NOT NULL,
        purchase_amount REAL NOT NULL,
        exchange TEXT NOT NULL,
        commission REAL NOT NULL,
        deadline TEXT NOT NULL,
        status TEXT DEFAULT 'Pending',
        funding_method TEXT,
        funding_confirmed BOOLEAN DEFAULT 0,
        proof_tx_hash TEXT,
        proof_wallet TEXT,
        proof_screenshot TEXT,
        funding_proof_url TEXT,
        funding_status TEXT DEFAULT 'none',
        funding_reviewed_by TEXT,
        funding_reviewed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
      )
    `);

    // Add columns to existing tasks table if it already exists
    db.run("ALTER TABLE tasks ADD COLUMN funding_proof_url TEXT", function(err) { /* ignore if already exists */ });
    db.run("ALTER TABLE tasks ADD COLUMN funding_status TEXT DEFAULT 'none'", function(err) { /* ignore if already exists */ });
    db.run("ALTER TABLE tasks ADD COLUMN funding_reviewed_by TEXT", function(err) { /* ignore if already exists */ });
    db.run("ALTER TABLE tasks ADD COLUMN funding_reviewed_at DATETIME", function(err) { /* ignore if already exists */ });

    // New columns for task completion proof system
    db.run("ALTER TABLE tasks ADD COLUMN completion_proof_url TEXT", function(err) { /* ignore if already exists */ });
    db.run("ALTER TABLE tasks ADD COLUMN completion_tx_hash TEXT", function(err) { /* ignore if already exists */ });
    db.run("ALTER TABLE tasks ADD COLUMN completion_wallet TEXT", function(err) { /* ignore if already exists */ });
    db.run("ALTER TABLE tasks ADD COLUMN proof_status TEXT DEFAULT 'none'", function(err) { /* ignore if already exists */ });
    db.run("ALTER TABLE tasks ADD COLUMN proof_reviewed_by TEXT", function(err) { /* ignore if already exists */ });
    db.run("ALTER TABLE tasks ADD COLUMN proof_reviewed_at DATETIME", function(err) { /* ignore if already exists */ });

    db.run(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        withdrawal_id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL,
        token TEXT NOT NULL,
        wallet_address TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reviewed_by TEXT,
        reviewed_at DATETIME,
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
      )
    `);

    // Seed initial data if the table is empty
    db.get("SELECT COUNT(*) as count FROM employees", (err, row: any) => {
      if (!err && row.count === 0) {
        const seedEmployees = [
          ['John Paul', 'john.paul@corp.io', 'EMP-48392', 'Active', 1, '2026-03-10 10:00:00'],
          ['Sarah Cole', 'sarah.cole@corp.io', 'EMP-19284', 'Active', 1, '2026-03-09 11:30:00'],
          ['Alex Kim', 'alex.kim@corp.io', 'EMP-73921', 'Active', 0, '2026-03-08 14:15:00'],
          ['David Lee', 'david.lee@corp.io', 'EMP-60117', 'Active', 1, '2026-03-07 09:45:00'],
          ['Linda Ross', 'linda.ross@corp.io', 'EMP-55483', 'Suspended', 0, '2026-03-05 16:20:00']
        ];

        const stmt = db.prepare(`
          INSERT INTO employees (name, email, employee_id, status, active_task, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        seedEmployees.forEach((emp) => stmt.run(emp));
        stmt.finalize();
        console.log("Seeded employees table with initial data.");
      }
    });

    db.get("SELECT COUNT(*) as count FROM tasks", (err, row: any) => {
      if (!err && row.count === 0) {
        const seedTasks = [
          [
            'TASK-1001', 'EMP-48392', 'SOL', 900, 'Binance', 82,
            new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            'Pending', 'Wire Transfer', 0
          ],
        ];

        const stmt = db.prepare(`
          INSERT INTO tasks (
            task_id, employee_id, token, purchase_amount, exchange, 
            commission, deadline, status, funding_method, funding_confirmed
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        seedTasks.forEach((task) => stmt.run(task));
        stmt.finalize();
        console.log("Seeded tasks table with initial data.");
      }
    });
  });
}
