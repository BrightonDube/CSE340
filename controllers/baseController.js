const utilities = require('../utilities/');
const baseController = {};

// Middleware to add common view variables
baseController.addCommonVars = function(req, res, next) {
  // Add header styles to all views
  res.locals.styles = res.locals.styles || [];
  if (!res.locals.styles.includes('/css/header.css')) {
    res.locals.styles.push('/css/header.css');
  }
  next();
};

baseController.buildHome = async function (req, res) {
  try {
    const nav = await utilities.getNav();
    // No need to pass messages here as they're handled by the middleware
    res.render('index', { 
      title: 'Home', 
      nav,
      styles: ['/css/header.css']
    });
  } catch (error) {
    console.error('Error in buildHome:', error);
    req.flash('error', 'Error loading the home page');
    res.redirect('/');
  }
};

module.exports = baseController;
