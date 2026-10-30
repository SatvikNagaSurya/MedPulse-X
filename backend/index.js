const express = require('express');
const mongoose = require('mongoose');
const cors    = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());

// ── CORS ──────────────────────────────────────────────────────────────────────
// Explicitly allow the Vite dev server origin so the browser does not block
// cross-origin requests or preflight (OPTIONS) calls.
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman) and listed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
  credentials: false,
}));

// ── MongoDB Connection ────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medpulsex';

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 30000, // wait up to 30 s before throwing
  socketTimeoutMS:          45000, // close sockets after 45 s of inactivity
})
.then(() => console.log(`✅  MongoDB connected → ${MONGO_URI}`))
.catch((err) => {
  console.error('❌  MongoDB connection error:', err.message);
  process.exit(1); // crash fast so we don't silently serve broken responses
});

// Emit warning if Mongoose loses connection during runtime
mongoose.connection.on('disconnected', () =>
  console.warn('⚠️   MongoDB disconnected – retrying…')
);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',    require('./routes/authRoutes'));
app.use('/api/medical', require('./routes/medicalRoutes'));

app.get('/', (req, res) => {
  res.json({ status: 'MedPulse-X API is running', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀  Server running on http://localhost:${PORT}`));