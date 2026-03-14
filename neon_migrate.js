import sqlite3 from 'sqlite3';
import { Pool } from 'pg';
import path from 'path';
import 'dotenv/config';

// Load env explicitly or expect it from command
const NEON_CONNECTION_STRING = process.env.NEON_CONNECTION_STRING || "YOUR_NEON_CONNECTION_STRING";

const pool = new Pool({
  connectionString: NEON_CONNECTION_STRING,
  ssl: { rejectUnauthorized: false }
});

const dbPath = path.resolve(process.cwd(), "database.sqlite");
const localDb = new sqlite3.Database(dbPath);

async function extractSqlite(query) {
  return new Promise((resolve, reject) => {
    localDb.all(query, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

async function migrate() {
  console.log("Connecting to Postgres...");
  
  // Create tables using new Postgres logic
  console.log("Running schema logic on Postgres...");
  const schema = `
    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      employee_id TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'Active',
      active_task BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      task_id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL REFERENCES employees(employee_id),
      token TEXT NOT NULL,
      purchase_amount REAL NOT NULL,
      exchange TEXT NOT NULL,
      commission REAL NOT NULL,
      deadline TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      funding_method TEXT,
      funding_confirmed BOOLEAN DEFAULT FALSE,
      proof_tx_hash TEXT,
      proof_wallet TEXT,
      proof_screenshot TEXT,
      funding_proof_url TEXT,
      funding_status TEXT DEFAULT 'none',
      funding_reviewed_by TEXT,
      funding_reviewed_at TIMESTAMPTZ,
      completion_proof_url TEXT,
      completion_tx_hash TEXT,
      completion_wallet TEXT,
      proof_status TEXT DEFAULT 'none',
      proof_reviewed_by TEXT,
      proof_reviewed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS withdrawals (
      withdrawal_id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL REFERENCES employees(employee_id),
      token TEXT NOT NULL,
      wallet_address TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      reviewed_by TEXT,
      reviewed_at TIMESTAMPTZ
    );
  `;
  await pool.query(schema);

  console.log("Reading from SQLite...");
  const employees = await extractSqlite("SELECT * FROM employees");
  const tasks = await extractSqlite("SELECT * FROM tasks");
  const withdrawals = await extractSqlite("SELECT * FROM withdrawals").catch(() => []); // Might not exist

  console.log(`Found ${employees.length} employees, ${tasks.length} tasks, ${withdrawals.length} withdrawals.`);

  // Insert employees
  for (const e of employees) {
    try {
      await pool.query(
        "INSERT INTO employees (id, name, email, employee_id, status, active_task, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (employee_id) DO NOTHING",
        [e.id, e.name, e.email, e.employee_id, e.status, Boolean(e.active_task), e.created_at]
      );
    } catch (err) {
      console.error("Error inserting employee", e.email, err.message);
    }
  }
  
  // Set sequence
  const maxEmp = await pool.query("SELECT MAX(id) FROM employees");
  const maxId = maxEmp.rows[0].max || 0;
  await pool.query(`SELECT setval('employees_id_seq', ${Math.max(1, maxId)}, true)`);

  // Insert tasks
  for (const t of tasks) {
    try {
      await pool.query(
        `INSERT INTO tasks (
          task_id, employee_id, token, purchase_amount, exchange, commission, deadline,
          status, funding_method, funding_confirmed, proof_tx_hash, proof_wallet, 
          proof_screenshot, funding_proof_url, funding_status, funding_reviewed_by, 
          funding_reviewed_at, completion_proof_url, completion_tx_hash, 
          completion_wallet, proof_status, proof_reviewed_by, proof_reviewed_at, 
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 
          $18, $19, $20, $21, $22, $23, $24, $25
        ) ON CONFLICT (task_id) DO NOTHING`,
        [
          t.task_id, t.employee_id, t.token, t.purchase_amount, t.exchange, t.commission, t.deadline,
          t.status, t.funding_method, Boolean(t.funding_confirmed), t.proof_tx_hash, t.proof_wallet,
          t.proof_screenshot, t.funding_proof_url, t.funding_status, t.funding_reviewed_by,
          t.funding_reviewed_at, t.completion_proof_url, t.completion_tx_hash,
          t.completion_wallet, t.proof_status, t.proof_reviewed_by, t.proof_reviewed_at,
          t.created_at, t.updated_at
        ]
      );
    } catch (err) {
      console.error("Error inserting task", t.task_id, err.message);
    }
  }

  // Insert withdrawals
  for (const w of withdrawals) {
    try {
      await pool.query(
        `INSERT INTO withdrawals (
          withdrawal_id, employee_id, token, wallet_address, amount, status, created_at, reviewed_by, reviewed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (withdrawal_id) DO NOTHING`,
        [
          w.withdrawal_id, w.employee_id, w.token, w.wallet_address, w.amount, w.status, w.created_at, w.reviewed_by, w.reviewed_at
        ]
      );
    } catch (err) {
      console.error("Error inserting withdrawal", w.withdrawal_id, err.message);
    }
  }

  console.log("Migration finished.");
  pool.end();
}

migrate().catch(err => {
  console.error(err);
  pool.end();
});
