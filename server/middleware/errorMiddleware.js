export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
}

export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` })
}

export function errorHandler(error, req, res, next) {
  console.error(error)
  if (res.headersSent) return next(error)
  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: error.message })
  }
  if (error.code === 11000) {
    return res.status(409).json({ message: 'An account with that email already exists.' })
  }
  res.status(error.status || 500).json({
    message: error.status ? error.message : 'Something went wrong. Please try again.',
  })
}
