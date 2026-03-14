import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false, // Required for Neon
  },
});

const translateSql = (sql: string) => {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
};

export const db = {
  all: async (sql: string, params: any[], cb?: any) => {
    if (typeof params === 'function') { 
      cb = params; 
      params = []; 
    }
    const finalSql = translateSql(sql);
    try {
      const { rows } = await pool.query(finalSql, params);
      if (cb) cb(null, rows);
    } catch (err) {
      console.error('DB ALL ERROR:', err, finalSql);
      if (cb) cb(err);
    }
  },
  get: async (sql: string, params: any[], cb?: any) => {
    if (typeof params === 'function') { 
      cb = params; 
      params = []; 
    }
    const finalSql = translateSql(sql);
    try {
      const { rows } = await pool.query(finalSql, params);
      if (cb) cb(null, rows[0] || null);
    } catch (err) {
      console.error('DB GET ERROR:', err, finalSql);
      if (cb) cb(err);
    }
  },
  run: async function(sql: string, params: any[], cb?: any) {
    if (typeof params === 'function') { 
      cb = params; 
      params = []; 
    }
    let finalSql = translateSql(sql);
    try {
      if (finalSql.trim().toUpperCase().startsWith("INSERT") && !finalSql.toUpperCase().includes("RETURNING")) {
         finalSql = finalSql.trim() + " RETURNING *";
      }
      const res = await pool.query(finalSql, params);
      const context = { 
        changes: res.rowCount || 0, 
        lastID: (res.rows && res.rows[0] && res.rows[0].id) || 0 
      };
      if (cb) cb.call(context, null);
    } catch (err) {
      console.error('DB RUN ERROR:', err, finalSql);
      if (cb) cb.call({ changes: 0, lastID: 0 }, err);
    }
  },
  prepare: (sql: string) => {
    return {
      run: async function(params: any[], cb?: any) {
        if (typeof params === 'function') { 
          cb = params; 
          params = []; 
        }
        let finalSql = translateSql(sql);
        try {
          if (finalSql.trim().toUpperCase().startsWith("INSERT") && !finalSql.toUpperCase().includes("RETURNING")) {
             finalSql = finalSql.trim() + " RETURNING *";
          }
          const res = await pool.query(finalSql, params);
          const context = { changes: res.rowCount || 0, lastID: (res.rows && res.rows[0] && res.rows[0].id) || 0 };
          if (cb) cb.call(context, null);
        } catch (err) {
          console.error('DB PREPARE RUN ERROR:', err, finalSql);
          if (cb) cb.call({ changes: 0, lastID: 0 }, err);
        }
      },
      finalize: () => {}
    }
  }
};

export async function initDb() {
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
      status TEXT DEFAULT 'Pending'
    );

    CREATE TABLE IF NOT EXISTS withdrawals (
      withdrawal_id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL REFERENCES employees(employee_id),
      token TEXT NOT NULL,
      wallet_address TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(schema);
    
    // Ensure all columns exist in tasks
    const alterCommands = [
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS funding_method TEXT",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS funding_confirmed BOOLEAN DEFAULT FALSE",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS proof_tx_hash TEXT",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS proof_wallet TEXT",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS proof_screenshot TEXT",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS funding_proof_url TEXT",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS funding_status TEXT DEFAULT 'none'",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS funding_reviewed_by TEXT",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS funding_reviewed_at TIMESTAMPTZ",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_proof_url TEXT",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_tx_hash TEXT",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_wallet TEXT",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS proof_status TEXT DEFAULT 'none'",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS proof_reviewed_by TEXT",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS proof_reviewed_at TIMESTAMPTZ",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP",
      "ALTER TABLE employees ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP",
      "ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS reviewed_by TEXT",
      "ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ"
    ];

    for (const cmd of alterCommands) {
      await pool.query(cmd).catch(e => console.error("Alter Error:", e.message));
    }
  } catch (err) {
    console.error("Error creating/altering Postgres tables:", err);
  }
}
