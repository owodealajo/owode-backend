const prisma = require('../models/prismaClient');

exports.getMyTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { senderId: userId },
          { recipientId: userId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { email: true } },
        recipient: { select: { email: true } }
      }
    });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get transactions', error: err.message });
  }
};
