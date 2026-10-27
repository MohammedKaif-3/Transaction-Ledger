const express = require('express');
const transactionController = require('../controllers/transactionController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router({ mergeParams: true });

router.post('/', asyncHandler(transactionController.create));
router.get('/', asyncHandler(transactionController.history));

module.exports = router;
