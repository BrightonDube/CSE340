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
  const nav = await utilities.getNav();
  req.flash('notice', 'This is a flash message.');
  res.render('index', { 
    title: 'Home', 
    nav,
    styles: ['/css/header.css']
  });
};

module.exports = baseController;
