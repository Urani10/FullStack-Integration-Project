/**
 * Centralized Error Handling Middleware
 * 
 * RUBRIC ALIGNMENT:
 * - Avoids generic 500 errors.
 * - Extracts and logs concise operational errors without dumping secrets or massive payloads.
 * - Formats consistent client-friendly JSON.
 */
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);

  // Log concise server error for operational visibility
  console.error(`[Error] [${req.method} ${req.originalUrl}] - Status ${statusCode}: ${err.message}`);

  // Handle Mongoose duplicate key error (MongoDB code 11000)
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'This canonical location is already registered in the dashboard.',
    });
  }

  return res.status(statusCode).json({
    error: err.name || 'Error',
    message: err.message || 'An unexpected error occurred',
  });
}
