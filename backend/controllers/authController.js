const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

// Register a new staff member
const register = (req, res) => {
  const { full_name, email, password, department } = req.body;

  if (!full_name || !email || !password || !department) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  // Check if email exists
  db.query('SELECT id FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (results.length > 0) return res.status(409).json({ message: 'Email already registered.' });

    const hashedPassword = bcrypt.hashSync(password, 10);
    db.query(
      'INSERT INTO users (full_name, email, password, role, department) VALUES (?, ?, ?, "staff", ?)',
      [full_name, email, hashedPassword, department],
      (err, result) => {
        if (err) return res.status(500).json({ message: 'Failed to register user.' });
        return res.status(201).json({ message: 'Registration successful! You can now log in.' });
      }
    );
  });
};

// Login
const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (results.length === 0) return res.status(401).json({ message: 'Invalid email or password.' });

    const user = results[0];
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password.' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  });
};

// Get current user profile
const getProfile = (req, res) => {
  db.query('SELECT id, full_name, email, role, department, created_at FROM users WHERE id = ?', [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (results.length === 0) return res.status(404).json({ message: 'User not found.' });
    return res.status(200).json(results[0]);
  });
};

module.exports = { register, login, getProfile };
