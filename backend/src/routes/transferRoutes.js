const express = require('express');
const transferController = require('../controllers/transferController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/', asyncHandler(transferController.create));

module.exports = router;
