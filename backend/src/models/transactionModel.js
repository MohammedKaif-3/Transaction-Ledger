const pool = require('../config/database');

async function findByReference(accountId, referenceId, connection) {
  const [rows] = await connection.execute(
    `SELECT id, account_id, type, amount, description, reference_id, created_at
     FROM transactions WHERE account_id = ? AND reference_id = ?`,
    [accountId, referenceId],
  );
  return rows[0] || null;
}

async function create(connection, transaction) {
  const [result] = await connection.execute(
    `INSERT INTO transactions (account_id, type, amount, description, reference_id)
     VALUES (?, ?, ?, ?, ?)`,
    [transaction.accountId, transaction.type, transaction.amount, transaction.description, transaction.referenceId],
  );
  const [rows] = await connection.execute(
    `SELECT id, account_id, type, amount, description, reference_id, created_at
     FROM transactions WHERE id = ?`,
    [String(result.insertId)],
  );
  return rows[0];
}

async function createTransferPair(connection, transfer) {
  const debit = await create(connection, {
    accountId: transfer.sourceAccountId,
    type: 'debit',
    amount: transfer.amount,
    description: transfer.description,
    referenceId: transfer.referenceId,
  });
  const credit = await create(connection, {
    accountId: transfer.destinationAccountId,
    type: 'credit',
    amount: transfer.amount,
    description: transfer.description,
    referenceId: transfer.referenceId,
  });
  return { debit, credit };
}

async function findHistory({ accountId, type, limit, offset }) {
  const typeClause = type ? ' AND type = ?' : '';
  const values = type ? [accountId, type, limit, offset] : [accountId, limit, offset];
  const [rows] = await pool.execute(
    `SELECT id, account_id, type, amount, description, reference_id, created_at
     FROM transactions WHERE account_id = ?${typeClause}
     ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
    values,
  );
  const countValues = type ? [accountId, type] : [accountId];
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM transactions WHERE account_id = ?${typeClause}`,
    countValues,
  );
  return { rows, total: Number(countRows[0].total) };
}

module.exports = { create, createTransferPair, findByReference, findHistory };
