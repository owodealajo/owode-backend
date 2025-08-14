// src/routes/loanRoutes.js
const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');

// Save user loan-related details (bvn, nin, address, income, next-of-kin, cardToken)
router.post('/save-details', loanController.saveLoanDetails);

// Verify identity (mock) — checks BVN/NIN format and sets isEligibleForLoan
router.post('/verify-identity', loanController.verifyIdentity);

// Apply for loan — backend sets interest & due date (expects userId, amount, termInMonths)
router.post('/apply', loanController.applyForLoan);

// Repay endpoint (mock) — accepts loanId and amount
router.post('/repay', loanController.repayLoan);

// Get user's loans
router.get('/user/:userId', loanController.getUserLoans);

module.exports = router;
