const config = require('../config/config').config;
const constants = require('../config/constants');

/**
 * Validates that the environment ID is valid and prevents path traversal attacks
 */
exports.validateEnvironment = function(req, res, next) {
  const env = req.params.ResultsEnv || req.params.env;
  
  if (!env) {
    return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ error: 'Environment parameter is required' });
  }
  
  // Get valid environment IDs from config
  const validEnvs = config.environments.map(e => e.id);
  
  // Check if environment is in the whitelist
  if (!validEnvs.includes(env)) {
    return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'Invalid environment', 
      validEnvironments: validEnvs 
    });
  }
  
  next();
};

/**
 * Sanitizes input to prevent injection attacks
 */
exports.sanitizeInput = function(input) {
  if (typeof input !== 'string') {
    return input;
  }
  // Remove any characters that could be used for path traversal or injection
  return input.replace(/[^a-zA-Z0-9_-]/g, '');
};

/**
 * Validates that required fields are present in request body
 */
exports.validateRequiredFields = function(fields) {
  return function(req, res, next) {
    const missing = fields.filter(field => !req.body[field]);
    
    if (missing.length > 0) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        error: 'Missing required fields', 
        missingFields: missing 
      });
    }
    
    next();
  };
};
