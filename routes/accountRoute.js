// Needed Resources 
const express = require("express");
const router = new express.Router();
const Util = require("../utilities/");
const accountController = require("../controllers/accountController");
const validate = require('../utilities/account-validation');


// =====================================
// Authentication Routes
// =====================================

// Route to build login view
router.get("/login", Util.handleErrors(accountController.buildLogin));

// Process the login request
router.post(
  "/login",
  validate.loginRules(),
  validate.checkValidation,
  Util.handleErrors(accountController.accountLogin)
);

// Logout route
router.get('/logout', Util.handleErrors(accountController.logout));

// =====================================
// Registration Routes
// =====================================

// Route to build registration view
router.get("/register", Util.handleErrors(accountController.buildRegister));

// Process registration
router.post(
  "/register",
  // Validate input
  validate.registrationRules(),
  validate.checkValidation,
  // Handle registration
  Util.handleErrors(accountController.registerAccount)
);

// =====================================
// Account Management (requires authentication)
// =====================================
router.get(
  "/",
  //validate.isAuthenticated,
  Util.checkLogin,
  Util.handleErrors(accountController.accountManagement)
);

// Update account details view
router.get(
  '/update',
  Util.checkLogin,
  Util.handleErrors(accountController.buildUpdateAccount)
);

router.get(
  '/update/:accountId', 
  validate.isAccountOwnerOrAdmin,
  Util.handleErrors(accountController.buildUpdateAccount)
);

// Process account update
router.post(
  '/update',
  validate.updateProfileRules(),
  validate.checkValidation,
  validate.isAccountOwnerOrAdmin,
  Util.handleErrors(accountController.updateAccount)
);

router.post(
  '/update-account',
  validate.updateProfileRules(),
  validate.checkValidation,
  validate.isAccountOwnerOrAdmin,
  Util.handleErrors(accountController.updateAccount)
);



// Process password change
router.post(
  '/change-password',
  validate.changePasswordRules(),
  validate.checkValidation,
  Util.handleErrors(accountController.changePassword)
);

// Admin routes (require admin role)
router.use('/admin', validate.hasRole('Admin'));

// Admin dashboard
router.get('/admin', Util.handleErrors(accountController.adminDashboard));

// View all accounts (admin only)
router.get('/admin/accounts', Util.handleErrors(accountController.getAllAccounts));

// Update account status (admin only)
router.post(
  '/admin/update-account-status/:accountId',
  Util.handleErrors(accountController.updateAccountStatus)
);

// Delete account (admin only)
router.post(
  '/admin/delete-account/:accountId',
  Util.handleErrors(accountController.deleteAccount)
);

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('Account route error:', err);
  req.flash('error', 'An error occurred. Please try again.');
  res.redirect('back');
});

module.exports = router;
      

