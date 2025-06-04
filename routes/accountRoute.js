// Needed Resources 
const express = require("express");
const router = new express.Router();
const utilities = require("../utilities/");
const accountController = require("../controllers/accountController");
const validate = require('../utilities/account-validation');


// =====================================
// Authentication Routes
// =====================================

// Route to build login view
router.get("/login", utilities.handleErrors(accountController.buildLogin));

// Process the login request
router.post(
  "/login",
  validate.loginRules(),
  validate.checkLoginData,
  utilities.handleErrors(accountController.accountLogin)
);

// Logout route
router.get('/logout', utilities.handleErrors(accountController.logout));

// =====================================
// Registration Routes
// =====================================

// Route to build registration view
router.get("/register", utilities.handleErrors(accountController.buildRegister));

// Process registration
router.post(
  "/register",
  validate.registrationRules(),
  validate.checkValidation,
  utilities.handleErrors(accountController.registerAccount)
);

// =====================================
// Authenticated Routes (require login)
// =====================================
router.use(validate.isAuthenticated);

// Account management view
router.get(
  "/",
  utilities.handleErrors(accountController.accountManagement)
);

// Update account details view
router.get(
  '/update/:accountId', 
  validate.isAccountOwnerOrAdmin,
  utilities.handleErrors(accountController.buildUpdateAccount)
);

// Process account update
router.post(
  '/update-account',
  validate.updateProfileRules(),
  validate.checkValidation,
  validate.isAccountOwnerOrAdmin,
  utilities.handleErrors(accountController.updateAccount)
);

// Change password view
router.get(
  '/change-password', 
  utilities.handleErrors(accountController.buildChangePassword)
);

// Process password change
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
      

