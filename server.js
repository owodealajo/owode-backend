// 1. Imports
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config(); // Load environment variables

// 2. Initialize app
const app = express();

// 3. Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// 4. Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/wallet', require('./src/routes/walletRoutes'));
app.use('/api/transfer', require('./src/routes/transferRoutes'));
app.use('/api/transactions', require('./src/routes/transactionRoutes'));

// 5. Root route (optional, but helpful for testing)
app.get('/', (req, res) => {
  res.send('API is running ✅');
});

// 6. 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// 7. Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// 8. Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
