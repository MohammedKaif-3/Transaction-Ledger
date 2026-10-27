const transactionService = require('../services/transactionService');

async function create(req, res) {
  const transaction = await transactionService.postTransaction(req.params.id, req.body);
  res.status(201).json({ data: transaction });
}

async function history(req, res) {
  const result = await transactionService.getHistory(req.params.id, req.query);
  res.json(result);
}

module.exports = { create, history };
