/* ****************************************
 * Authentication Middleware
 * **************************************** */

// Check if user is authenticated
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

module.exports = { isAuthenticated };
