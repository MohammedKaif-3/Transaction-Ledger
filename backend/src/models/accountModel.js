const pool = require('../config/database');

async function create(name) {
  const [result] = await pool.execute('INSERT INTO accounts (name) VALUES (?)', [name]);
  return findById(String(result.insertId));
}

async function findById(id, connection = pool) {
  const [rows] = await connection.execute(
    'SELECT id, name, balance, created_at FROM accounts WHERE id = ?',
    [id],
  );
  return rows[0] || null;
}

async function findAll() {
  const [rows] = await pool.execute(
    'SELECT id, name, balance, created_at FROM accounts ORDER BY created_at DESC, id DESC',
  );
  return rows;
}

module.exports = { create, findAll, findById };
