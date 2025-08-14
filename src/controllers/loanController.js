const fetch = require("node-fetch");
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const VERIFYME_ENABLED = process.env.VERIFYME_ENABLED === 'true';
const VERIFYME_API_URL = process.env.VERIFYME_API_URL || 'https://api.qoreid.com/v1/biometrics/verify';
const VERIFYME_API_KEY = process.env.VERIFYME_API_KEY || 'fe79909173044854bd3650b8a2938b04';

/**
 * Verify identity.
 * If VERIFYME_ENABLED and VERIFYME_API_URL/KEY are set, calls external provider.
 * Otherwise falls back to a format-check "mock" verification (dev-only).
 */
exports.verifyIdentity = async (req, res) => {
  try {
    let { userId, bvn, nin } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    userId = Number(userId);

    if (!bvn || !/^\d{11}$/.test(String(bvn))) {
      return res.status(400).json({ error: 'BVN must be 11 digits' });
    }
    if (!nin || !/^\d{11}$/.test(String(nin))) {
      return res.status(400).json({ error: 'NIN must be 11 digits' });
    }

    let verified = false;
    let providerRaw = null;

    if (VERIFYME_ENABLED && VERIFYME_API_URL && VERIFYME_API_KEY) {
      // Call external KYC provider (replace body/headers if provider expects different shape)
      try {
        const resp = await axios.post(
          VERIFYME_API_URL,
          { bvn: String(bvn), nin: String(nin) },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${VERIFYME_API_KEY}`
            },
            timeout: 15000
          }
        );
        providerRaw = resp.data;

        // NOTE: different providers return different shapes.
        // We try common success markers: success, verified, status === 'verified' etc.
        if (
          resp.data &&
          (resp.data.verified === true ||
            resp.data.success === true ||
            resp.data.status === 'verified' ||
            resp.data.status === 'success' ||
            (resp.data.data && (resp.data.data.bvn_verified || resp.data.data.kyc_status === 'VERIFIED')))
        ) {
          verified = true;
        } else {
          verified = false;
        }
      } catch (err) {
        console.error('External KYC error:', err.response?.data || err.message || err);
        return res.status(502).json({
          error: 'External verification failed',
          details: err.response?.data || err.message
        });
      }
    } else {
      // Dev fallback: mark verified if format is OK
      verified = true;
      providerRaw = { note: 'mock verification (dev)' };
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        bvn: String(bvn),
        nin: String(nin),
        isEligibleForLoan: verified
      }
    });

    return res.json({
      message: verified ? 'Identity verified successfully' : 'Identity not verified',
      verified,
      user,
      providerRaw
    });
  } catch (err) {
    console.error('verifyIdentity error:', err);
    res.status(500).json({ error: 'verification failed', details: err.message });
  }
};

/**
 * Save & update loan-related user details (KYC info, income, next-of-kin, token).
 */
exports.saveLoanDetails = async (req, res) => {
  try {
    const {
      userId,
      bvn,
      nin,
      address,
      employmentStatus,
      monthlyIncome,
      nextOfKinName,
      nextOfKinPhone,
      cardToken
    } = req.body;

    if (!userId) return res.status(400).json({ error: 'userId required' });

    const updatedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data: {
        bvn: bvn ? String(bvn) : undefined,
        nin: nin ? String(nin) : undefined,
        address,
        employmentStatus,
        monthlyIncome: monthlyIncome ? Number(monthlyIncome) : null,
        nextOfKinName,
        nextOfKinPhone,
        cardToken
      }
    });

    res.json({ message: 'Loan details saved', user: updatedUser });
  } catch (err) {
    console.error('saveLoanDetails error:', err);
    res.status(500).json({ error: 'failed to save loan details', details: err.message });
  }
};

/**
 * Apply for a loan.
 * Body: { userId, amount, termInMonths }
 * termInMonths can be 0.25 (for 1 week) or 1,3,6,12
 */
exports.applyForLoan = async (req, res) => {
  try {
    let { userId, amount, termInMonths } = req.body;

    if (!userId || amount == null || termInMonths == null) {
      return res.status(400).json({ error: 'userId, amount, and termInMonths are required' });
    }

    userId = Number(userId);
    amount = Number(amount);
    termInMonths = Number(termInMonths);

    if (isNaN(amount) || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.isEligibleForLoan) return res.status(400).json({ error: 'User not eligible for a loan. Please verify BVN/NIN first.' });

    // interest mapping
    const interestTable = { '0.25': 5, '1': 15, '3': 25, '6': 40, '12': 60 };
    const interestRate = interestTable[String(termInMonths)] ?? 50;

    // due date
    const now = new Date();
    const dueDate = new Date(now);
    if (Math.abs(termInMonths - 0.25) < 0.00001) {
      dueDate.setDate(dueDate.getDate() + 7);
    } else {
      // use integer month increment
      dueDate.setMonth(dueDate.getMonth() + Math.round(termInMonths));
    }

    // totals
    const interestAmount = amount * (interestRate / 100);
    const totalRepay = Number((amount + interestAmount).toFixed(2));
    const monthlyInstallment = termInMonths >= 1 ? Number((totalRepay / Math.round(termInMonths)).toFixed(2)) : totalRepay;

    const loan = await prisma.loan.create({
      data: {
        userId,
        amount,
        interestRate,
        dueDate,
        status: 'pending'
      }
    });

    return res.json({
      message: 'Loan application submitted',
      loan: {
        id: loan.id,
        amount: loan.amount,
        interestRate,
        dueDate: dueDate.toISOString(),
        totalRepay,
        monthlyInstallment,
        status: loan.status
      }
    });
  } catch (err) {
    console.error('applyForLoan error:', err);
    res.status(500).json({ error: 'failed to apply for loan', details: err.message });
  }
};

/**
 * Repay loan (mock).
 * Body: { loanId, amount, paymentRef }
 */
exports.repayLoan = async (req, res) => {
  try {
    const { loanId, amount, paymentRef } = req.body;
    if (!loanId || amount == null) return res.status(400).json({ error: 'loanId and amount required' });

    const loan = await prisma.loan.findUnique({ where: { id: Number(loanId) } });
    if (!loan) return res.status(404).json({ error: 'Loan not found' });

    const totalDue = Number((loan.amount + (loan.amount * (loan.interestRate / 100))).toFixed(2));
    if (Number(amount) >= totalDue) {
      await prisma.loan.update({ where: { id: loan.id }, data: { status: 'repaid' } });
    }

    // In real app: record payment transaction table and verify webhook from payment provider
    res.json({ message: 'Payment recorded (mock)', loanId: loan.id, paymentRef });
  } catch (err) {
    console.error('repayLoan error:', err);
    res.status(500).json({ error: 'repayment failed', details: err.message });
  }
};

exports.getUserLoans = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const loans = await prisma.loan.findMany({
      where: { userId: Number(userId) },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ loans });
  } catch (err) {
    console.error('getUserLoans error:', err);
    res.status(500).json({ error: 'failed to fetch loans', details: err.message });
  }
};

exports.verifyIdentity = async (req, res) => {
    try {
      const { userId, bvn, nin } = req.body;
      if (!userId || (!bvn && !nin)) {
        return res.status(400).json({ error: "UserId and either BVN or NIN are required" });
      }
  
      const type = bvn ? "bvn" : "nin";
      const idNumber = bvn || nin;
  
      const response = await fetch(`${process.env.VERIFYME_API_URL}/${type}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.VERIFYME_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ number: idNumber }),
      });
  
      const data = await response.json();
  
      if (!response.ok || !data.status || data.status.toLowerCase() !== "verified") {
        return res.status(400).json({ error: "External verification failed", details: data });
      }
  
      await prisma.user.update({
        where: { id: Number(userId) },
        data: { isEligibleForLoan: true },
      });
  
      res.json({ message: `${type.toUpperCase()} verified successfully`, data });
    } catch (error) {
      console.error("Error verifying identity:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };