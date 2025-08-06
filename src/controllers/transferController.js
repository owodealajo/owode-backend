const prisma = require('../models/prismaClient');

exports.transferFunds = async (req, res) => {
  const { recipientEmail, amount } = req.body;
  const senderId = req.user.id;

  try {
    const senderWallet = await prisma.wallet.findFirst({ where: { userId: senderId } });
    const recipientUser = await prisma.user.findUnique({ where: { email: recipientEmail } });
    if (!recipientUser) return res.status(404).json({ message: 'Recipient not found' });

    const recipientWallet = await prisma.wallet.findFirst({ where: { userId: recipientUser.id } });
    if (!recipientWallet) return res.status(404).json({ message: 'Recipient wallet not found' });

    if (senderWallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    // Perform transaction as a Prisma $transaction
    await prisma.$transaction([
        prisma.wallet.update({
          where: { id: senderWallet.id },
          data: { balance: { decrement: amount } }
        }),
        prisma.wallet.update({
          where: { id: recipientWallet.id },
          data: { balance: { increment: amount } }
        }),
        prisma.transaction.create({
          data: {
            senderId: senderId,
            recipientId: recipientUser.id,
            amount
          }
        })
      ]);
      
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Transfer failed', error: err.message });
  }
};
