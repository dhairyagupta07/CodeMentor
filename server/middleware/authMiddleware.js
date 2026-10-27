import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export async function authenticate(req, res, next) {
  try {
    const token = req.cookies.token
    if (!token) return res.status(401).json({ message: 'Please log in to continue.' })
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.sub).select('_id name email')
    if (!user) return res.status(401).json({ message: 'Your session is no longer valid.' })
    req.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Your session has expired. Please log in again.' })
    }
    next(error)
  }
}

export async function optionalAuthentication(req, res, next) {
  try {
    const token = req.cookies.token
    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET)
      req.user = await User.findById(payload.sub).select('_id name email')
    }
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') return next()
    next(error)
  }
}
