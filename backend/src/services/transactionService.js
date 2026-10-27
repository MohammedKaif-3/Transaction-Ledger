const pool = require('../config/database');
const accountModel = require('../models/accountModel');
const transactionModel = require('../models/transactionModel');
const HttpError = require('../utils/httpError');
const { parseAmount, toCents } = require('../utils/money');

function validateAccountId(id) {
  if (!/^\d+$/.test(id) || id === '0') {
    throw new HttpError(400, 'INVALID_ACCOUNT_ID', 'Account ID must be a positive integer.');
  }
}

function validateTransaction(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new HttpError(400, 'INVALID_BODY', 'Request body must be a JSON object.');
  }
  if (!['credit', 'debit'].includes(input.type)) {
    throw new HttpError(400, 'INVALID_TRANSACTION_TYPE', 'Transaction type must be credit or debit.');
  }
  const amount = parseAmount(input.amount);
  if (!amount) {
    throw new HttpError(400, 'INVALID_AMOUNT', 'Amount must be greater than zero and have at most two decimal places.');
  }
  if (typeof input.reference_id !== 'string' || !input.reference_id.trim()) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Reference ID is required.');
  }
  if (input.reference_id.trim().length > 100) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Reference ID must be 100 characters or fewer.');
  }
  const description = input.description === undefined ? '' : input.description;
  if (typeof description !== 'string' || description.length > 500) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Description must be 500 characters or fewer.');
  }
  return {
    type: input.type,
    amount,
    description,
    referenceId: input.reference_id.trim(),
  };
}

async function postTransaction(accountId, input) {
  validateAccountId(accountId);
  const transaction = validateTransaction(input);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const account = await accountModel.findById(accountId, connection, true);
    if (!account) throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'Account not found.');

    const existing = await transactionModel.findByReference(accountId, transaction.referenceId, connection);
    if (existing) throw new HttpError(409, 'DUPLICATE_TRANSACTION', 'A transaction with this reference ID already exists for the account.');

    if (transaction.type === 'debit' && toCents(account.balance) < transaction.amount.cents) {
      throw new HttpError(422, 'INSUFFICIENT_BALANCE', 'Account does not have sufficient balance for this debit.');
    }

    const operator = transaction.type === 'credit' ? '+' : '-';
    const [balanceResult] = await connection.execute(
      `UPDATE accounts SET balance = balance ${operator} ? WHERE id = ?`,
      [transaction.amount.value, accountId],
    );
    if (balanceResult.affectedRows !== 1) throw new Error('Account balance could not be updated.');

    const created = await transactionModel.create(connection, {
      accountId,
      type: transaction.type,
      amount: transaction.amount.value,
      description: transaction.description,
      referenceId: transaction.referenceId,
    });
    await connection.commit();
    return created;
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'DUPLICATE_TRANSACTION', 'A transaction with this reference ID already exists for the account.');
    }
    throw error;
  } finally {
    connection.release();
  }
}

async function getHistory(accountId, query) {
  validateAccountId(accountId);
  const account = await accountModel.findById(accountId);
  if (!account) throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'Account not found.');

  const type = query.type;
  if (type !== undefined && !['credit', 'debit'].includes(type)) {
    throw new HttpError(400, 'INVALID_TRANSACTION_TYPE', 'Type filter must be credit or debit.');
  }
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new HttpError(400, 'INVALID_PAGINATION', 'Page must be a positive integer and limit must be between 1 and 100.');
  }

  const { rows, total } = await transactionModel.findHistory({
    accountId,
    type,
    limit,
    offset: (page - 1) * limit,
  });
  return {
    data: rows,
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
}

module.exports = { getHistory, postTransaction };
