const express = require('express');
const router = express.Router();
const { createWallet, getWalletByUser } = require('../controllers/walletController');
const protect = require('../middlewares/authMiddleware');

router.post('/', protect, createWallet);             // Create wallet (requires auth)
router.get('/:userId', protect, getWalletByUser);    // Get wallet by user ID

module.exports = router;
