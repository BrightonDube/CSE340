// Needed Resources 
const express = require("express");
const router = new express.Router();
const passport = require('passport');
const utilities = require("../utilities/");
const accountController = require("../controllers/accountController");
const validate = require('../utilities/account-validation');

// Route to build login view
router.get("/login", utilities.handleErrors(accountController.buildLogin));

// Process login attempt
router.post(
  "/login",
  validate.loginRules(),
  validate.checkValidation,
  passport.authenticate('local', {
    failureFlash: true,
    failureRedirect: '/account/login',
    failureMessage: true
  }),
  async (req, res) => {
    // Set success flash message
    req.flash('success', `Welcome back, ${req.user.account_firstname}!`);
    
    // Redirect to the original URL or home page
    const redirectUrl = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
  }
);

// Logout route
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      req.flash('error', 'Error logging out. Please try again.');
      return res.redirect('/account/');
    }
    req.flash('success', 'You have been successfully logged out.');
    res.redirect('/');
  });
});

// Registration routes
router.get('/register', utilities.handleErrors(accountController.buildRegister));

router.post(
  '/register',
  validate.registrationRules(),
  validate.checkValidation,
  utilities.handleErrors(accountController.registerAccount)
);

// Account management routes (require authentication)
router.use(validate.isAuthenticated);

// View account details
router.get('/', utilities.handleErrors(accountController.accountManagement));

// Update account details
router.get('/update/:accountId', 
  validate.isAccountOwnerOrAdmin,
  utilities.handleErrors(accountController.buildUpdateAccount)
);

router.post(
  '/update-account',
  validate.updateProfileRules(),
  validate.checkValidation,
  validate.isAccountOwnerOrAdmin,
  utilities.handleErrors(accountController.updateAccount)
);

// Change password
router.get('/change-password', utilities.handleErrors(accountController.buildChangePassword));

router.post(
  '/change-password',
  validate.changePasswordRules(),
  validate.checkValidation,
  utilities.handleErrors(accountController.changePassword)
);

// Admin routes (require admin role)
router.use('/admin', validate.hasRole('Admin'));

// Admin dashboard
router.get('/admin', utilities.handleErrors(accountController.adminDashboard));

// View all accounts (admin only)
router.get('/admin/accounts', utilities.handleErrors(accountController.getAllAccounts));

// Update account status (admin only)
router.post(
  '/admin/update-account-status/:accountId',
  utilities.handleErrors(accountController.updateAccountStatus)
);

// Delete account (admin only)
router.post(
  '/admin/delete-account/:accountId',
  utilities.handleErrors(accountController.deleteAccount)
);

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('Account route error:', err);
  req.flash('error', 'An error occurred. Please try again.');
  res.redirect('back');
});

module.exports = router;
