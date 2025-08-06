const prisma = require('../models/prismaClient');

// GET /api/wallet/:userId — Get wallet by user
exports.getWalletByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const wallet = await prisma.wallet.findFirst({ where: { userId } });

    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
    res.json(wallet);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch wallet', error: err.message });
  }
};

// POST /api/wallet — Create wallet for a user
exports.createWallet = async (req, res) => {
  try {
    const { userId } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent duplicate wallet
    const existing = await prisma.wallet.findFirst({ where: { userId } });
    if (existing) return res.status(400).json({ message: 'Wallet already exists' });

    const wallet = await prisma.wallet.create({
      data: { userId },
    });

    res.status(201).json(wallet);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create wallet', error: err.message });
  }
};
