const router   = require('express').Router();
const User     = require('../models/User');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');

// ── Helper: sign a JWT ────────────────────────────────────────────────────────
const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1d' });

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ① Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // ② Duplicate email check (friendly message instead of Mongo 11000 error)
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // ③ Hash & create
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    // ④ Return token immediately so the frontend can log the user in
    const token = signToken(user._id);
    return res.status(201).json({ token, userId: user._id, name: user.name });

  } catch (err) {
    console.error('[/register] error:', err);
    // Handle unexpected Mongoose duplicate key race condition
    if (err.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // ① Input validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // ② Look up user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // ③ Compare password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // ④ Issue token
    const token = signToken(user._id);
    return res.json({ token, userId: user._id, name: user.name });

  } catch (err) {
    console.error('[/login] error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;