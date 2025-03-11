require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
console.log('JWT_SECRET in Auth:', process.env.JWT_SECRET);

const app = express();
app.use(express.json());

const dbconnect = require('./db_connection.js');
const User = require('./user_schema.js');

// Registration endpoint
app.post('/register', [
  check('user_id').notEmpty().withMessage('User Id is required'),
  check('username').notEmpty().withMessage('Username is required'),
  check('email').isEmail().withMessage('Invalid email'),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  check('name').notEmpty().withMessage('Name is required'),
  check('role').optional().isIn(['user', 'admin']).withMessage('Role must be "user" or "admin"')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { user_id, username, email, password, name, role } = req.body;
  const roles = role ? role : 'user';

  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) {
    return res.status(400).send('Username or email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ user_id, username, email, password: hashedPassword, name, roles });
  await newUser.save();

  res.status(201).json({ message: 'User registered successfully', roles });
});

// Login endpoint
app.post('/login', [
  check('username').notEmpty().withMessage('Username is required'),
  check('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).send('Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).send('Invalid credentials');
  }

  const token = jwt.sign({ userId: user.user_id, role: user.roles }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
  console.log(`Generated Token: ${token}`); // Add this
  res.json({ token });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Auth Service running on port ${PORT}`));
module.exports = app;