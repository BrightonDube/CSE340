/**
 * Error Handler Middleware
 * Handles all errors in the application
 */

/**
 * Not Found Handler
 * Handles 404 errors
 */
function notFound(req, res, next) {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
}

/**
 * Error Handler
 * Handles all errors
 */
function errorHandler(err, req, res, next) {
  // Set locals, only providing error in development
  const isDevelopment = req.app.get('env') === 'development';
  
  // Default to 500 if status code not set
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Log the error
  console.error('Error:', {
    message: err.message,
    stack: isDevelopment ? err.stack : undefined,
    status: statusCode,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Determine the response format based on the Accept header
  res.format({
    // HTML response
    'text/html': () => {
      res.render('errors/error', {
        title: 'Error',
        nav: req.nav || [],
        message: err.message,
        error: isDevelopment ? err : {},
        status: statusCode
      });
    },
    
    // JSON response
    'application/json': () => {
      res.json({
        message: err.message,
        stack: isDevelopment ? err.stack : undefined,
        status: statusCode
      });
    },
    
    // Default response
    'default': () => {
      res.type('txt').send(`Error: ${err.message}`);
    }
  });
}

/**
 * Validation Error Handler
 * Handles validation errors from express-validator
 */
function validationErrorHandler(err, req, res, next) {
  if (err.name === 'ValidationError' || err.name === 'ValidatorError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: err.errors || err.message
    });
  }
  next(err);
}

/**
 * Database Error Handler
 * Handles database related errors
 */
function databaseErrorHandler(err, req, res, next) {
  if (err.code === '23505') { // Unique violation
    return res.status(409).json({
      message: 'Duplicate entry',
      detail: err.detail
    });
  }
  
  if (err.code === '23503') { // Foreign key violation
    return res.status(409).json({
      message: 'Reference error',
      detail: err.detail
    });
  }
  
  next(err);
}

module.exports = {
  notFound,
  errorHandler,
  validationErrorHandler,
  databaseErrorHandler
};
