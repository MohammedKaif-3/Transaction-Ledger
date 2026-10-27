const pool = require('../config/database');
const accountModel = require('../models/accountModel');
const transactionModel = require('../models/transactionModel');
const HttpError = require('../utils/httpError');
const { parseAmount, toCents } = require('../utils/money');

function accountId(value) {
  const id = String(value ?? '');
  if (!/^\d+$/.test(id) || id === '0') throw new HttpError(400, 'INVALID_ACCOUNT_ID', 'Account IDs must be positive integers.');
  return id;
}

async function transfer(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new HttpError(400, 'INVALID_BODY', 'Request body must be a JSON object.');
  }
  const sourceAccountId = accountId(input.source_account_id);
  const destinationAccountId = accountId(input.destination_account_id);
  if (sourceAccountId === destinationAccountId) {
    throw new HttpError(400, 'INVALID_TRANSFER', 'Source and destination accounts must be different.');
  }
  const amount = parseAmount(input.amount);
  if (!amount) throw new HttpError(400, 'INVALID_AMOUNT', 'Amount must be greater than zero and have at most two decimal places.');
  if (typeof input.reference_id !== 'string' || !input.reference_id.trim() || input.reference_id.trim().length > 100) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'A reference ID of 1 to 100 characters is required.');
  }
  const description = input.description === undefined ? `Transfer to account ${destinationAccountId}` : input.description;
  if (typeof description !== 'string' || description.length > 500) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Description must be 500 characters or fewer.');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // Consistent lock order keeps concurrent transfers from deadlocking each other.
    const orderedIds = [sourceAccountId, destinationAccountId].sort((a, b) => BigInt(a) < BigInt(b) ? -1 : 1);
    const lockedAccounts = new Map();
    for (const id of orderedIds) {
      const account = await accountModel.findById(id, connection, true);
      if (!account) throw new HttpError(404, 'ACCOUNT_NOT_FOUND', `Account ${id} not found.`);
      lockedAccounts.set(id, account);
    }

    const duplicateSource = await transactionModel.findByReference(sourceAccountId, input.reference_id.trim(), connection);
    const duplicateDestination = await transactionModel.findByReference(destinationAccountId, input.reference_id.trim(), connection);
    if (duplicateSource || duplicateDestination) {
      throw new HttpError(409, 'DUPLICATE_TRANSACTION', 'A transaction with this reference ID already exists on one of the accounts.');
    }

    const source = lockedAccounts.get(sourceAccountId);
    if (toCents(source.balance) < amount.cents) {
      throw new HttpError(422, 'INSUFFICIENT_BALANCE', 'Source account does not have sufficient balance for this transfer.');
    }

    await connection.execute('UPDATE accounts SET balance = balance - ? WHERE id = ?', [amount.value, sourceAccountId]);
    await connection.execute('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount.value, destinationAccountId]);
    const transactions = await transactionModel.createTransferPair(connection, {
      sourceAccountId,
      destinationAccountId,
      amount: amount.value,
      description: description || `Transfer to account ${destinationAccountId}`,
      referenceId: input.reference_id.trim(),
    });
    await connection.commit();
    return transactions;
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'DUPLICATE_TRANSACTION', 'A transaction with this reference ID already exists on one of the accounts.');
    }
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { transfer };
