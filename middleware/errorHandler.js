const fn = require('../functions');
const constants = require('../config/constants');

/**
 * Standardized error response handler
 */
exports.errorResponse = function(res, statusCode, message, details = null) {
  const response = { error: message };
  if (details) {
    response.details = details;
  }
  return res.status(statusCode).json(response);
};

/**
 * Logs error and sends standardized response
 */
exports.logAndRespond = function(res, statusCode, error, context) {
  const errorMessage = error.message || error;
  fn.logOutput(constants.LOG_LEVELS.ERROR, `${context}: ${errorMessage}`);
  return exports.errorResponse(res, statusCode, errorMessage);
};

/**
 * Global error handling middleware
 */
exports.globalErrorHandler = function(err, req, res, next) {
  fn.logOutput(constants.LOG_LEVELS.ERROR, `Unhandled error: ${err.message}`);
  console.error(err.stack);
  
  res.status(err.status || constants.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Async route handler wrapper to catch errors
 */
exports.asyncHandler = function(fn) {
  return function(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
