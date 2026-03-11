// middleware/notFound.js
module.exports = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      'GET /health',
      'POST /api/v1/auth/register',
      'POST /api/v1/auth/login',
      'GET /api/v1/turfs',
      'GET /api/v1/bookings/availability',
      'POST /api/v1/bookings/initiate',
    ]
  });
};
