const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authMiddleware');
const { transferFunds } = require('../controllers/transferController');

router.post('/', protect, transferFunds);

module.exports = router;
