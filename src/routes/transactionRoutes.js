const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authMiddleware');
const { getMyTransactions } = require('../controllers/transactionController');

router.get('/', protect, getMyTransactions);

module.exports = router;
