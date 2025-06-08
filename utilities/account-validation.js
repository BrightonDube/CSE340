const Util = require(".");
const { body, validationResult, checkSchema } = require("express-validator");
const accountModel = require("../models/account-model");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const validate = {};

// Common validation patterns
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
const NAME_PATTERN = /^[A-Za-z\s-']+$/;
const EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'byui.edu'];

/*  **********************************
 *  Registration Data Validation Rules
 * ********************************* */
validate.registrationRules = () => {
  return [
    // First name validation
    body("account_firstname")
      .trim()
      .escape()
      .notEmpty()
      .withMessage("First name is required.")
      .isLength({ min: 2, max: 50 })
      .withMessage("First name must be between 2-50 characters.")
      .matches(NAME_PATTERN)
      .withMessage("First name can only contain letters, spaces, hyphens, and apostrophes."),

    // Last name validation
    body("account_lastname")
      .trim()
      .escape()
      .notEmpty()
      .withMessage("Last name is required.")
      .isLength({ min: 2, max: 50 })
      .withMessage("Last name must be between 2-50 characters.")
      .matches(NAME_PATTERN)
      .withMessage("Last name can only contain letters, spaces, hyphens, and apostrophes."),

    // Email validation
    body("account_email")
      .trim()
      .isEmail()
      .normalizeEmail() // refer to validator.js docs
      .withMessage("A valid email is required.")
      .custom(async (account_email) => {
        const emailExists = await accountModel.checkExistingEmail(account_email)
        if (emailExists){
          throw new Error("Email exists. Please log in or use different email")
        }
      }),

    // Password validation
    body("account_password")
      .trim()
      .notEmpty()
      .withMessage("Password is required.")
      .isLength({ min: 12, max: 100 })
      .withMessage("Password must be between 12-100 characters.")
      .matches(PASSWORD_PATTERN)
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
      ),

    // Confirm password validation
    body("account_confirm_password")
      .trim()
      .notEmpty()
      .withMessage("Please confirm your password.")
      .custom((value, { req }) => {
        if (value !== req.body.account_password) {
          throw new Error("Passwords do not match.");
        }
        return true;
      })
  ];
};

/*  **********************************
 *  Login Validation Rules
 * ********************************* */
validate.loginRules = () => {
  return [
    // Email validation
    body("account_email")
      .trim()
      .escape()
      .notEmpty()
      .withMessage("Email is required.")
      .isEmail()
      .withMessage("Please provide a valid email address.")
      .normalizeEmail(),

    // Password validation
    body("account_password")
      .trim()
      .notEmpty()
      .withMessage("Password is required.")
  ];
};

/*  **********************************
 *  Update Profile Validation Rules
 * ********************************* */
validate.updateProfileRules = () => {
  return [
    // First name validation
    body("account_firstname")
      .trim()
      .escape()
      .notEmpty()
      .withMessage("First name is required.")
      .isLength({ min: 2, max: 50 })
      .withMessage("First name must be between 2-50 characters.")
      .matches(NAME_PATTERN)
      .withMessage("First name can only contain letters, spaces, hyphens, and apostrophes."),

    // Last name validation
    body("account_lastname")
      .trim()
      .escape()
      .notEmpty()
      .withMessage("Last name is required.")
      .isLength({ min: 2, max: 50 })
      .withMessage("Last name must be between 2-50 characters.")
      .matches(NAME_PATTERN)
      .withMessage("Last name can only contain letters, spaces, hyphens, and apostrophes."),

    // Email validation
    body("account_email")
      .trim()
      .escape()
      .notEmpty()
      .withMessage("Email is required.")
      .isEmail()
      .withMessage("Please provide a valid email address.")
      .normalizeEmail()
      .isLength({ max: 100 })
      .withMessage("Email must be less than 100 characters.")
      .custom(async (email, { req }) => {
        // Skip if email hasn't changed
        if (email === req.body.original_email) {
          return true;
        }
        
        const account = await accountModel.getAccountByEmail(email);
        if (account) {
          throw new Error('Email is already in use. Please use a different email.');
        }
        return true;
      }),
      
    // Phone number validation
    body("account_phone")
      .optional({ checkFalsy: true })
      .trim()
      .isMobilePhone()
      .withMessage("Please provide a valid phone number.")
  ];
};

/*  **********************************
 *  Change Password Validation Rules
 * ********************************* */
validate.changePasswordRules = () => {
  return [
    // Current password validation
    body("current_password")
      .trim()
      .notEmpty()
      .withMessage("Current password is required."),
      
    // New password validation
    body("new_password")
      .trim()
      .notEmpty()
      .withMessage("New password is required.")
      .isLength({ min: 12, max: 100 })
      .withMessage("Password must be between 12-100 characters.")
      .matches(PASSWORD_PATTERN)
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
      )
      .custom((value, { req }) => {
        if (value === req.body.current_password) {
          throw new Error("New password must be different from current password.");
        }
        return true;
      }),
      
    // Confirm new password validation
    body("confirm_password")
      .trim()
      .notEmpty()
      .withMessage("Please confirm your new password.")
      .custom((value, { req }) => {
        if (value !== req.body.new_password) {
          throw new Error("New passwords do not match.");
        }
        return true;
      })
  ];
};

/* ******************************
 * Middleware to check validation results
 * ***************************** */
validate.checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  
  if (errors.isEmpty()) {
    return next();
  }
  
  const errorList = errors.array().map(err => ({
    param: err.param,
    msg: err.msg,
    value: err.value
  }));
  
  console.log('Validation errors:', errorList); // Log validation errors
  
  // Set flash messages for each error
  errorList.forEach(error => {
    req.flash('error', error.msg);
  });
  
  // Preserve form data
  req.flash('formData', req.body);
  
  // For API requests, return JSON
  if (req.xhr || req.originalUrl.startsWith('/api/')) {
    return res.status(400).json({ 
      success: false,
      errors: errorList 
    });
  }
  
  // For web requests, redirect back with flash messages
  return res.redirect('back');
  next();
};

/* ******************************
 * Check if user is authenticated
 * ***************************** */
validate.isAuthenticated = (req, res, next) => {
  // Check JWT token first
  if (req.cookies && req.cookies.jwt) {
    return jwt.verify(
      req.cookies.jwt,
      process.env.ACCESS_TOKEN_SECRET,
      (err, decoded) => {
        if (err) {
          res.clearCookie('jwt');
          req.flash('notice', 'Your session has expired. Please log in again.');
          return res.redirect('/account/login');
        }
        req.user = decoded;
        res.locals.accountData = decoded;
        res.locals.loggedin = 1;
        return next();
      }
    );
  }
  
  // Fall back to session if no JWT
  if (req.session && req.session.user && req.session.loggedin) {
    return next();
  }
  
  req.flash('notice', 'Please log in to access this page.');
  req.session.returnTo = req.originalUrl;
  res.redirect('/account/login');
};

/* ******************************
 * Check if user has required role
 * ***************************** */
validate.hasRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user || !req.session.loggedin) {
      req.flash('notice', 'Please log in to access this page.');
      req.session.returnTo = req.originalUrl;
      return res.redirect('/account/login');
    }
    
    // If roles is a string, convert it to an array
    if (typeof roles === 'string') {
      roles = [roles];
    }
    
    // Check if user has any of the required roles
    if (roles.length && !roles.includes(req.session.user.account_type)) {
      req.flash('notice', 'You do not have permission to access this page.');
      return res.redirect('/account/');
    }
    
    next();
  };
};

/* ******************************
 * Check if user is account owner or admin
 * ***************************** */
validate.isAccountOwnerOrAdmin = (req, res, next) => {
  if (!req.session || !req.session.user || !req.session.loggedin) {
    req.flash('notice', 'Please log in to access this page.');
    req.session.returnTo = req.originalUrl;
    return res.redirect('/account/login');
  }
  
  const accountId = req.params.accountId || req.body.account_id;
  
  // Allow if user is admin or the account owner
  if (req.session.user.account_type === 'Admin' || req.session.user.account_id.toString() === accountId.toString()) {
    return next();
  }
  
  req.flash('notice', 'You do not have permission to perform this action.');
  res.redirect('/account/');
};

/* ******************************
 * Check data and return errors or continue to registration
 * ***************************** */
validate.checkRegData = async (req, res, next) => {
  const { account_firstname, account_lastname, account_email } = req.body;
  let errors = [];
  errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    let nav = await Util.getNav();
    return res.render("account/register", {
      errors,
      title: "Registration",
      nav,
      account_firstname: account_firstname || '',
      account_lastname: account_lastname || '',
      account_email: account_email || ''
    });
  }
  next();
};

module.exports = validate;
