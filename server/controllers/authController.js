import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
})

function createToken(userId) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters')
  }
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

function sendUser(res, user, status = 200) {
  res.cookie('token', createToken(user._id.toString()), cookieOptions())
  return res.status(status).json({
    user: { id: user._id, name: user.name, email: user.email },
  })
}

export async function register(req, res) {
  const { name, email, password } = req.body
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 60) {
    return res.status(400).json({ message: 'Name must be between 2 and 60 characters.' })
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Enter a valid email address.' })
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    return res.status(400).json({ message: 'Password must be between 8 and 72 characters.' })
  }
  const existing = await User.findOne({ email: email.toLowerCase().trim() })
  if (existing) return res.status(409).json({ message: 'An account with that email already exists.' })
  const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password })
  return sendUser(res, user, 201)
}

export async function login(req, res) {
  const { email, password } = req.body
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Email and password are required.' })
  }
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password')
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Email or password is incorrect.' })
  }
  return sendUser(res, user)
}

export function logout(req, res) {
  res.clearCookie('token', { ...cookieOptions(), maxAge: undefined })
  res.json({ message: 'You have been logged out.' })
}

export function currentUser(req, res) {
  res.json({
    user: req.user
      ? { id: req.user._id, name: req.user.name, email: req.user.email }
      : null,
  })
}
