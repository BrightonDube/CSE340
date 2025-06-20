/* ****************************************
 * Account Controller
 * **************************************** */
const utilities = require("../utilities/")
const accountModel = require("../models/account-model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
require("dotenv").config()

/* ****************************************
*  Deliver login view
* *************************************** */
async function buildLogin(req, res, next) {
  let nav = await utilities.getNav();

  res.render("account/login", {
    title: "Login",
    nav,
    errors: null,
    account_email: null,
    message: null,

  });
}

/* ****************************************
*  Deliver registration view
* *************************************** */
async function buildRegister(req, res, next) {
  try {
    const nav = await utilities.getNav();
    
    // Only use req.body if it exists (for form re-rendering after validation fails)
    const formData = req.method === 'POST' && req.body ? req.body : {};
    
    // Ensure we have default empty strings for all form fields
    const formValues = {
      account_firstname: formData.account_firstname || '',
      account_lastname: formData.account_lastname || '',
      account_email: formData.account_email || ''
    };
    
    res.render("account/register", {
      title: "Register",
      nav,
      errors: [], // Initialize as empty array
      messages: req.flash(), // Pass any flash messages
      ...formValues // Spread the form values
    });
  } catch (error) {
    console.error('Error in buildRegister:', error);
    req.flash('error', 'Error loading registration page');
    res.redirect('/account/register');
  }
}

/* ****************************************
*  Process Registration
* *************************************** */
async function registerAccount(req, res) {
  console.log('Registration attempt:', req.body);
  
  let nav;
  try {
    nav = await utilities.getNav();
    const { 
      account_firstname, 
      account_lastname, 
      account_email, 
      account_password 
    } = req.body;

    // Check for existing email first
    try {
      const emailExists = await accountModel.checkExistingEmail(account_email);
      if (emailExists) {
        console.log('Email already exists:', account_email);
        req.flash('error', 'Email already exists. Please use a different email.');
        return res.status(400).render('account/register', {
          title: 'Registration',
          nav,
          errors: [],
          messages: req.flash(),
          account_firstname,
          account_lastname,
          account_email: '' // Clear email field to prevent resubmission
        });
      }
    } catch (error) {
      console.error('Error checking email existence:', error);
      req.flash('error', 'Error checking email. Please try again.');
      return res.status(500).render('account/register', {
        title: 'Registration',
        nav,
        errors: [],
        messages: req.flash(),
        ...req.body
      });
    }

    // Hash the password
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(account_password, 10);
      console.log('Password hashed successfully');
    } catch (error) {
      console.error('Password hashing error:', error);
      req.flash('error', 'Error processing registration. Please try again.');
      return res.status(500).render('account/register', {
        title: 'Registration',
        nav,
        errors: [],
        messages: req.flash(),
        ...req.body
      });
    }
    
    // Register the new account
    try {
      console.log('Attempting to register account...');
      const regResult = await accountModel.registerAccount(
        account_firstname,
        account_lastname,
        account_email,
        hashedPassword
      );

      if (regResult) {
        console.log('Registration successful:', regResult);
        req.flash(
          'success',
          `Congratulations ${account_firstname}, your account has been created! Please log in.`
        );
        return res.redirect('/account/login');
      } else {
        console.error('Registration failed - no error but no result');
        req.flash('error', 'Registration failed. Please try again.');
        return res.status(500).render('account/register', {
          title: 'Registration',
          nav,
          messages: req.flash(),
          ...req.body
        });
      }
    } catch (dbError) {
      console.error('Database error during registration:', dbError);
      req.flash('error', 'Error saving account. Please try again.');
      return res.status(500).render('account/register', {
        title: 'Registration',
        nav,
        messages: req.flash(),
        ...req.body
      });
    }
  } catch (error) {
    console.error('Unexpected error during registration:', error);
    if (!nav) {
      try {
        nav = await utilities.getNav();
      } catch (navError) {
        console.error('Error getting navigation:', navError);
        nav = [];
      }
    }
    
    req.flash('error', 'An unexpected error occurred during registration. Please try again.');
    return res.status(500).render('account/register', {
      title: 'Registration',
      nav,
      messages: req.flash(),
      ...req.body
    });
  }
}

/* ****************************************
*  Process login attempt
* *************************************** */
async function processLogin(req, res) {
  let nav = await utilities.getNav();
  const { account_email, account_password } = req.body;
  
  try {
    console.log('Login attempt for:', account_email);
    // Check if email exists in the database
    const account = await accountModel.getAccountByEmail(account_email);
    console.log('Account found:', account ? 'Yes' : 'No');
    
    if (!account) {
      req.flash('error', 'Invalid email or password');
      return res.status(401).render('account/login', {
        title: 'Login',
        nav,
        errors: null,
        account_email,
        message: { type: 'error', text: 'Invalid email or password' }
      });
    }
    
    // Log entered password and stored hash for debugging
    console.log('[DEBUG] Login entered password:', account_password);
    console.log('[DEBUG] Login stored hash:', account.account_password);
    // Compare passwords
    const passwordMatch = await bcrypt.compare(account_password, account.account_password);
    console.log('[DEBUG] bcrypt.compare result:', passwordMatch);
    
    if (!passwordMatch) {
      req.flash('error', 'Invalid email or password');
      return res.status(401).render('account/login', {
        title: 'Login',
        nav,
        errors: null,
        account_email,
        message: { type: 'error', text: 'Invalid email or password' }
      });
    }
    
    // Set up session with user data
    delete account.account_password;
    req.session.user = account;
    req.session.accountData = {  // Store account data for the header
      account_id: account.account_id,
      account_firstname: account.account_firstname,
      account_lastname: account.account_lastname,
      account_email: account.account_email,
      account_type: account.account_type
    };
    req.session.loggedin = true;
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        account_id: account.account_id,
        account_type: account.account_type,
        account_email: account.account_email
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '1d' }
    );
    
    // Set JWT in HTTP-only cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    
    // Save session explicitly to ensure it's stored before redirect
    req.session.save(err => {
      if (err) {
        console.error('Session save error:', err);
        req.flash('error', 'Login failed. Please try again.');
        return res.status(500).render('account/login', {
          title: 'Login',
          nav,
          errors: null,
          account_email,
          message: { type: 'error', text: 'Error saving session. Please try again.' }
        });
      }
      
      console.log('Session saved successfully, user logged in:', account.account_email);
      req.flash('success', `Welcome back, ${account.account_firstname}!`);
      
      const redirectUrl = req.session.returnTo || '/account/';
      delete req.session.returnTo;
      console.log('Redirecting to:', redirectUrl);
      return res.redirect(redirectUrl);
    });
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'Failed to process login');
    res.status(500).render('account/login', {
      title: 'Login',
      nav,
      errors: null,
      account_email,
      message: { type: 'error', text: 'An error occurred during login' }
    });
  }
}

/* ****************************************
*  Deliver account management view
* *************************************** */
async function accountManagement(req, res) {
  let nav = await utilities.getNav();
  console.log('Account Management - Session User:', req.session.user);
  res.render('account/management', {
    title: 'Account Management',
    nav,
    errors: null,
    account: req.session.user
  });
}

/* ****************************************
*  Build update account view
* *************************************** */
async function buildUpdateAccount(req, res) {
  let nav = await utilities.getNav();
  const accountId = req.params.accountId || req.session.user.account_id;

  try {
    const account = await accountModel.getAccountById(accountId);
    if (!account) {
      req.flash('error', 'Account not found.');
      return res.redirect('/account/');
    }
    // Support sticky data and errors/messages from validation middleware
    const sticky = req.body || {};
    const messages = req.flash();
    res.render('account/update-account', {
      title: 'Update Account',
      nav,
      errors: res.locals.errors || null,
      messages,
      account,
      sticky
    });
  } catch (error) {
    console.error('Error building update account view:', error);
    req.flash('error', 'Error loading account update page.');
    res.redirect('/account/');
  }
}

/* ****************************************
*  Process account update
* *************************************** */
async function updateAccount(req, res) {
  let nav = await utilities.getNav();
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorList = errors.array().map(e => e.msg);
    const account = await accountModel.getAccountById(req.body.account_id);
    return res.status(400).render('account/update-account', {
      title: 'Update Account',
      nav,
      errors: errorList,
      messages: req.flash(),
      account,
      sticky: req.body
    });
  }
  const { account_id, account_firstname, account_lastname, account_email, original_email } = req.body;

  try {
    // 1. Fetch current account data from DB
    const current = await accountModel.getAccountById(account_id);
    if (!current) {
      req.flash('error', 'Account not found.');
      return res.redirect('/account/');
    }

    // 2. Whitelist fields to allow update
    const allowedFields = ['account_firstname', 'account_lastname', 'account_email'];

    // 3. Build updates object with only changed and allowed fields
    const updates = {};
    if (
      typeof account_firstname === 'string' &&
      account_firstname.trim() !== '' &&
      account_firstname !== current.account_firstname
    ) {
      updates.account_firstname = account_firstname.trim();
    }
    if (
      typeof account_lastname === 'string' &&
      account_lastname.trim() !== '' &&
      account_lastname !== current.account_lastname
    ) {
      updates.account_lastname = account_lastname.trim();
    }
    if (
      typeof account_email === 'string' &&
      account_email.trim() !== '' &&
      account_email !== current.account_email
    ) {
      updates.account_email = account_email.trim();
    }

    // 4. If nothing changed, skip DB update
    if (Object.keys(updates).length === 0) {
      req.flash('notice', 'No changes detected.');
      return res.redirect('/account/update/' + account_id);
    }

    // 5. Log attempted update for debugging
    console.log('Attempting to update account_id', account_id, 'with:', updates);

    // 6. Attempt DB update
    const result = await accountModel.updateAccount(account_id, updates);
    console.log('DB result for updateAccount:', result);

    // 7. Check result before mutating session
    if (result && typeof result === 'object') {
      // Only update session fields that actually changed
      if (req.session && req.session.user) {
        for (const field of allowedFields) {
          if (updates[field]) {
            req.session.user[field] = updates[field];
          }
        }
      }
      req.flash('success', 'Account updated successfully.');
      return res.redirect('/account/');
    } else {
      // On DB error, return to update view with sticky data and error
      const account = await accountModel.getAccountById(account_id);
      const messages = req.flash();
      return res.status(400).render('account/update-account', {
        title: 'Update Account',
        nav,
        errors: { update: 'Failed to update account.' },
        messages,
        account,
        sticky: req.body
      });
    }
  } catch (error) {
    console.error('Error updating account:', error);
    // On error, return to update view with sticky data and error
    let account = null;
    try { account = await accountModel.getAccountById(account_id); } catch(e){}
    const messages = req.flash();
    return res.status(500).render('account/update-account', {
      title: 'Update Account',
      nav,
      errors: { update: 'An error occurred while updating the account.' },
      messages,
      account,
      sticky: req.body
    });
  }
}



/* ****************************************
*  Process password change
* *************************************** */
const { validationResult } = require('express-validator');

async function changePassword(req, res) {
  let nav = await utilities.getNav();
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorList = errors.array().map(e => e.msg);
    const account = await accountModel.getAccountById(req.body.account_id);
    return res.status(400).render('account/update-account', {
      title: 'Update Account',
      nav,
      errors: errorList,
      messages: req.flash(),
      account,
      sticky: req.body
    });
  }
  const { new_password, account_id } = req.body;

  try {
    const account = await accountModel.getAccountById(account_id);
    if (!account) {
      req.flash('error', 'Account not found.');
      return res.redirect('/account/');
    }

    // Log the new password and hashed password for debugging
    console.log('[DEBUG] New password (plain):', new_password);
    const hashedPassword = await bcrypt.hash(new_password, 10);
    console.log('[DEBUG] New password (hashed):', hashedPassword);
    // Update the password in the database
    const result = await accountModel.updatePassword(account_id, hashedPassword);
    console.log('[DEBUG] Password update DB result:', result);
    if (result) {
      req.flash('success', 'Password updated successfully.');
      console.log('Flashed messages before redirect (success):', req.flash());
      // Optionally, log user out after password change:
      // req.session.destroy(() => res.redirect('/account/login'));
      // For now, redirect to management view
      return res.redirect('/account/');
    } else {
      // On validation error, return to update view with sticky data and error
      const messages = req.flash();
      // Map errors to array of strings if needed
      const errorList = Array.isArray(errors) ? errors.map(e => typeof e === 'string' ? e : e.msg) : (errors && errors.array ? errors.array().map(e => e.msg) : []);
      return res.status(400).render('account/update-account', {
        title: 'Update Account',
        nav,
        errors: errorList,
        messages,
        account,
        sticky: req.body
      });
    }
  } catch (error) {
    console.error('Error changing password:', error);
    // On error, return to update view with sticky data and error
    let account = null;
    try { account = await accountModel.getAccountById(account_id); } catch(e){}
    req.flash('error', 'An error occurred while changing the password.');
    console.log('Flashed messages before render (server error):', req.flash());
    return res.status(500).render('account/update-account', {
      title: 'Update Account',
      nav,
      errors: ['An error occurred while changing the password.'],
      messages: req.flash(),
      account,
      sticky: req.body
    });
  }
}

/* ****************************************
*  Process logout
* *************************************** */
async function logout(req, res) {
  // Clear JWT cookie
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0 // Expire the cookie immediately
  });

  // Clear session data
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      req.flash('error', 'Error logging out. Please try again.');
      return res.redirect('/account/');
    }
    res.clearCookie('sessionId', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    res.redirect('/');
  });
}

/* ****************************************
 *  Process login request
 * ************************************ */
async function accountLogin(req, res) {
  let nav = await utilities.getNav()
  const { account_email, account_password } = req.body
  
  try {
    const accountData = await accountModel.getAccountByEmail(account_email)
    if (!accountData) {
      req.flash("notice", "Please check your credentials and try again.")
      return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      })
    }

    // Log entered password and stored hash for debugging
    console.log('[DEBUG] Login entered password:', account_password);
    console.log('[DEBUG] Login stored hash:', accountData.account_password);
    const passwordMatch = await bcrypt.compare(account_password, accountData.account_password);
    console.log('[DEBUG] bcrypt.compare result:', passwordMatch);
    if (passwordMatch) {
      // Prepare user data for session and JWT
      const userData = {
        account_id: accountData.account_id,
        account_firstname: accountData.account_firstname,
        account_lastname: accountData.account_lastname,
        account_email: accountData.account_email,
        account_type: accountData.account_type
      };

      // Set JWT token
      const accessToken = jwt.sign(
        userData,
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1h' }
      );

      // Set JWT cookie
      const cookieOptions = {
        httpOnly: true,
        maxAge: 3600 * 1000, // 1 hour
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      };
      res.cookie('jwt', accessToken, cookieOptions);

      // Set session data
      req.session.user = userData;
      req.session.loggedin = true;
      
      // Save session before redirect
      return req.session.save(() => {
        res.redirect(req.session.returnTo || '/account/');
      });
    } else {
      req.flash("notice", "Please check your credentials and try again.")
      return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      })
    }
  } catch (error) {
    console.error('Login error:', error);
    req.flash("notice", "An error occurred during login. Please try again.")
    return res.status(500).render("account/login", {
      title: "Login",
      nav,
      errors: null,
      account_email,
    })
  }
}

module.exports = { 
  buildLogin, 
  buildRegister, 
  registerAccount, 
  processLogin,
  accountLogin, 
  accountManagement, 
  buildUpdateAccount, 
  updateAccount, 
  changePassword,
  logout
}
