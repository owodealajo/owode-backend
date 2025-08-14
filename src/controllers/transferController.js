// src/controllers/transferController.js
const prisma = require('../models/prismaClient');

exports.transferFunds = async (req, res) => {
  const { recipientEmail, amount } = req.body;
  const senderId = req.user.id;

  try {
    if (!recipientEmail || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid transfer data' });
    }

    const sender = await prisma.user.findUnique({ where: { id: senderId }, include: { Wallet: true } });
    const recipient = await prisma.user.findUnique({ where: { email: recipientEmail }, include: { Wallet: true } });

    if (!recipient) return res.status(404).json({ message: 'Recipient not found' });

    const senderWallet = sender.Wallet[0];
    const recipientWallet = recipient.Wallet[0];

    if (senderWallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: senderWallet.id },
        data: { balance: { decrement: amount } },
      }),
      prisma.wallet.update({
        where: { id: recipientWallet.id },
        data: { balance: { increment: amount } },
      }),
      prisma.transaction.create({
        data: {
          amount,
          senderId: sender.id,
          recipientId: recipient.id,
        },
      }),
    ]);

    res.status(200).json({ message: 'Transfer successful' });
  } catch (err) {
    console.error('Transfer failed:', err);
    res.status(500).json({ message: 'Transfer failed', error: err.message });
  }
};
