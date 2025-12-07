const config = require('../config/config').config;

/**
 * Authentication middleware - checks if user is logged in when session is enabled
 */
exports.requireAuth = function(req, res, next) {
  const SESSION_ON = config.session;
  
  // If session is disabled, allow all requests
  if (!SESSION_ON) {
    return next();
  }
  
  // If session is enabled, check if user is logged in
  if (req.session && req.session.loggedin) {
    return next();
  }
  
  // User is not logged in, redirect to login page
  res.redirect('/');
};

/**
 * Checks if authentication is enabled
 */
exports.isAuthEnabled = function() {
  return config.session;
};
