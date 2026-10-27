const transferService = require('../services/transferService');

async function create(req, res) {
  const transactions = await transferService.transfer(req.body);
  res.status(201).json({ data: transactions });
}

module.exports = { create };
