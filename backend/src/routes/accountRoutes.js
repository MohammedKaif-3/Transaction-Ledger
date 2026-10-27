const express = require('express');
const accountController = require('../controllers/accountController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(accountController.list));
router.post('/', asyncHandler(accountController.create));
router.get('/:id/balance', asyncHandler(accountController.balance));

module.exports = router;
