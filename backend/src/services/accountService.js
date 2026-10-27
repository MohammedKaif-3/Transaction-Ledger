const accountModel = require('../models/accountModel');
const HttpError = require('../utils/httpError');

async function createAccount(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new HttpError(400, 'INVALID_BODY', 'Request body must be a JSON object.');
  }
  if (typeof input.name !== 'string' || !input.name.trim()) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Account name is required.');
  }
  if (input.name.trim().length > 255) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Account name must be 255 characters or fewer.');
  }
  if (Object.hasOwn(input, 'balance')) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Initial balance is always zero and cannot be set.');
  }

  return accountModel.create(input.name.trim());
}

async function getAccount(id) {
  if (!/^\d+$/.test(id) || id === '0') {
    throw new HttpError(400, 'INVALID_ACCOUNT_ID', 'Account ID must be a positive integer.');
  }
  const account = await accountModel.findById(id);
  if (!account) throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'Account not found.');
  return account;
}

async function listAccounts() {
  return accountModel.findAll();
}

module.exports = { createAccount, getAccount, listAccounts };
