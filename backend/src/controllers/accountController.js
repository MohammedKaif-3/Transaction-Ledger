const accountService = require('../services/accountService');

async function create(req, res) {
  const account = await accountService.createAccount(req.body);
  res.status(201).json({ data: account });
}

async function list(_req, res) {
  const accounts = await accountService.listAccounts();
  res.json({ data: accounts });
}

async function balance(req, res) {
  const account = await accountService.getAccount(req.params.id);
  res.json({ data: { account_id: account.id, balance: account.balance } });
}

module.exports = { balance, create, list };
