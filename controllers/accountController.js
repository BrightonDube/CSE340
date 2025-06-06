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
  let nav = await utilities.getNav()
  res.render("account/login", {
    title: "Login",
    nav,
    errors: null,
    account_email: null,
    message: null
  })
}

/* ****************************************
*  Deliver registration view
* *************************************** */
async function buildRegister(req, res, next) {
  let nav = await utilities.getNav()
  res.render("account/register", {
    title: "Register",
    nav,
    errors: null,
    account_firstname: null,
    account_lastname: null,
    account_email: null
  })
}

/* ****************************************
*  Process Registration
* *************************************** */
async function registerAccount(req, res) {
  let nav = await utilities.getNav()
  const { account_firstname, account_lastname, account_email, account_password } = req.body

  // Hash the password before storing
  let hashedPassword
  try {
    // regular password and cost (salt is generated automatically)
    hashedPassword = await bcrypt.hash(account_password, 10)
  } catch (error) {
    console.error('Password hashing error:', error)
    req.flash("error", 'Sorry, there was an error processing the registration.')
    return res.status(500).render("account/register", {
      title: "Registration",
      nav,
      errors: null,
      account_firstname,
      account_lastname,
      account_email,
      message: { type: 'error', text: 'Error hashing password. Please try again.' }
    })
  }
  
  try {
    // Check if email already exists
    const emailExists = await accountModel.checkExistingEmail(account_email)
    if (emailExists > 0) {
      req.flash("error", 'That email address is already in use. Please use a different email.')
      return res.status(409).render("account/register", {
        title: "Registration",
        nav,
        errors: null,
        account_firstname,
        account_lastname,
        account_email: '',
        message: { type: 'error', text: 'That email address is already in use. Please use a different email.' }
      })
    }
    
    // Register the new account
    const regResult = await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email,
      hashedPassword
    )

    if (regResult) {
      console.log('Registration successful:', regResult)
      req.flash(
        "success",
        `Congratulations, you're registered ${account_firstname}. Please log in.`
      )
      return res.redirect('/account/login')
    } else {
      req.flash("error", "Sorry, the registration failed.")
      return res.status(500).render("account/register", {
        title: "Registration",
        nav,
        errors: null,
        account_firstname,
        account_lastname,
        account_email,
        message: { type: 'error', text: 'Registration failed. Please try again.' }
      })
    }
  } catch (error) {
    console.error("Registration error:", error)
    req.flash("error", "Sorry, there was an error processing your registration.")
    return res.status(500).render("account/register", {
      title: "Registration",
      nav,
      errors: null,
      account_firstname,
      account_lastname,
      account_email,
      message: { type: 'error', text: error.message || 'An unexpected error occurred during registration.' }
    })
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
    
    // Compare passwords
    const passwordMatch = await bcrypt.compare(account_password, account.account_password);
    console.log('Password match:', passwordMatch ? 'Yes' : 'No');
    
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
    req.session.loggedin = true;
    
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
    
    res.render('account/update-account', {
      title: 'Update Account',
      nav,
      errors: null,
      account
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
  const { account_id, account_firstname, account_lastname, account_email } = req.body;
  
  try {
    const result = await accountModel.updateAccount(
      account_id,
      account_firstname,
      account_lastname,
      account_email
    );
    
    if (result) {
      // Update the user in the session
      req.user.account_firstname = account_firstname;
      req.user.account_lastname = account_lastname;
      req.user.account_email = account_email;
      
      req.flash('success', 'Account updated successfully.');
      return res.redirect('/account/');
    } else {
      req.flash('error', 'Failed to update account.');
      return res.redirect('/account/update/' + account_id);
    }
  } catch (error) {
    console.error('Error updating account:', error);
    req.flash('error', 'An error occurred while updating the account.');
    res.redirect('/account/update/' + account_id);
  }
}

/* ****************************************
*  Build change password view
* *************************************** */
async function buildChangePassword(req, res) {
  let nav = await utilities.getNav();
  res.render('account/change-password', {
    title: 'Change Password',
    nav,
    errors: null
  });
}

/* ****************************************
*  Process password change
* *************************************** */
async function changePassword(req, res) {
  const { current_password, new_password } = req.body;
  const accountId = req.user.account_id;
  
  try {
    // Get the account to verify current password
    const account = await accountModel.getAccountById(accountId);
    
    if (!account) {
      req.flash('error', 'Account not found.');
      return res.redirect('/account/change-password');
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(current_password, account.account_password);
    
    if (!isMatch) {
      req.flash('error', 'Current password is incorrect.');
      return res.redirect('/account/change-password');
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(new_password, 10);
    
    // Update the password in the database
    const result = await accountModel.updatePassword(accountId, hashedPassword);
    
    if (result) {
      req.flash('success', 'Password updated successfully. Please log in again.');
      
      // Log the user out after password change
      req.logout(() => {
        res.redirect('/account/login');
      });
    } else {
      req.flash('error', 'Failed to update password.');
      res.redirect('/account/change-password');
    }
  } catch (error) {
    console.error('Error changing password:', error);
    req.flash('error', 'An error occurred while changing the password.');
    res.redirect('/account/change-password');
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
    path: '/'
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

    if (await bcrypt.compare(account_password, accountData.account_password)) {
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
  buildChangePassword, 
  changePassword,
  logout
}
