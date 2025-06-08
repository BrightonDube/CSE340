const jwt = require('jsonwebtoken');

/* ****************************************
 * Authentication Middleware
 * **************************************** */

// Check if user is authenticated via session
const isAuthenticated = (req, res, next) => {
  // Check if user is logged in using session data
  if (req.session && req.session.user && req.session.loggedin) {
    return next();
  }
  
  // Not authenticated
  req.flash('notice', 'Please log in to access this page.');
  req.session.returnTo = req.originalUrl;
  return res.redirect('/account/login');
};

// Check if user has admin or employee role
const hasAdminOrEmployeeRole = (req, res, next) => {
  // First check session authentication
  if (!req.session || !req.session.user || !req.session.loggedin) {
    req.flash('notice', 'Please log in to access this page.');
    req.session.returnTo = req.originalUrl;
    return res.redirect('/account/login');
  }

  // Check if user has required role
  const userRole = req.session.user.account_type;
  if (userRole === 'Admin' || userRole === 'Employee') {
    return next();
  }

  // Not authorized
  req.flash('notice', 'You do not have permission to access this page.');
  return res.redirect('/account/');
};

// Middleware to verify JWT token and check for admin/employee role
const checkJWTToken = (req, res, next) => {
  // Skip JWT check if already authenticated via session
  if (req.session && req.session.user && req.session.loggedin) {
    return next();
  }

  // Check for JWT token
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    // Check if user has required role
    if (decoded.account_type !== 'Admin' && decoded.account_type !== 'Employee') {
      return res.status(403).json({ error: 'Access denied. Insufficient privileges.' });
    }

    // Add user from payload
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

module.exports = { 
  isAuthenticated, 
  hasAdminOrEmployeeRole,
  checkJWTToken 
};
