const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

// ✅ Middleware
app.use(express.json());

// ✅ CORS setup for frontend
app.use(cors({
  origin: 'https://owodealajo.netlify.app', // Replace with your actual Netlify frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// ✅ Routes
const authRoutes = require('./src/routes/authRoutes');
const walletRoutes = require('./src/routes/walletRoutes');
const transferRoutes = require('./src/routes/transferRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const loanRoutes = require("./src/routes/loanRoutes");

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/transactions', transactionRoutes);
app.use("/api/loans", loanRoutes);

// ✅ Root route for testing
app.get('/', (req, res) => {
  res.send('API is running ✅');
});

// ✅ Fallback for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000; // 5000 is common for backend
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
