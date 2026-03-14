/**
 * Global Error Handling Middleware
 * Catches all errors and returns consistent response
 */

const { AppError, AuthenticationError, DatabaseError } = require('./errors');
const config = require('../config');

/**
 * Error handling middleware
 * Must be the LAST middleware in app.use() chain
 */
const errorHandler = (err, req, res, next) => {
  // Default error
  let error = err;

  // Handle different error types
  if (err instanceof AppError) {
    // Custom application error
    error = err;
  } else if (err.name === 'JsonWebTokenError') {
    // JWT errors
    const { AuthenticationError } = require('./errors');
    error = new AuthenticationError('Invalid or malformed token');
  } else if (err.name === 'TokenExpiredError') {
    // Token expired
    const { AuthenticationError } = require('./errors');
    error = new AuthenticationError('Token has expired');
  } else if (err.code === 'ECONNREFUSED') {
    // Database connection refused
    error = new DatabaseError('Database connection failed');
  } else if (err.code === 'PROTOCOL_ERROR') {
    // PostgreSQL protocol error
    error = new DatabaseError('Database protocol error');
  } else if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
    // Invalid JSON
    const { ValidationError } = require('./errors');
    error = new ValidationError('Invalid JSON in request body');
  } else {
    // Unknown error - convert to InternalServerError
    const { InternalServerError } = require('./errors');
    error = new InternalServerError(err.message || 'An unexpected error occurred');
  }

  // Get status code
  const statusCode = error.statusCode || 500;

  // Build error response
  const errorResponse = {
    status: 'error',
    message: error.message,
    ...(config.server.nodeEnv === 'development' && { stack: error.stack })
  };

  // Add validation errors if present
  if (error.errors && Array.isArray(error.errors)) {
    errorResponse.errors = error.errors;
  }

  // Log error
  if (statusCode >= 500) {
    console.error('❌ Server Error:', {
      statusCode,
      message: error.message,
      name: error.name,
      path: req.path,
      method: req.method,
      // Stack only in development
      ...(config.server.nodeEnv === 'development' && { stack: error.stack })
    });
  } else if (statusCode >= 400) {
    console.warn('⚠️  Client Error:', {
      statusCode,
      message: error.message,
      path: req.path,
      method: req.method
    });
  }

  // Send response
  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 * Usage: router.get('/path', catchAsync(controllerFunction))
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  catchAsync
};
