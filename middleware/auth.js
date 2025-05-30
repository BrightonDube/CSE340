/* ****************************************
 * Authentication Middleware
 * **************************************** */

// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
  // TODO: Replace this with actual session check
  // For now, we'll just check if the user is logged in
  if (req.session && req.session.account_id) {
    return next();
  }
  
  // Not authenticated
  req.flash('notice', 'Please log in to access this page.');
  return res.redirect('/account/login');
};

module.exports = { isAuthenticated };
