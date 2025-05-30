// Needed Resources 
const express = require("express");
const router = new express.Router();
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const utilities = require("../utilities/");
const accountModel = require("../models/account-model");
const accountController = require("../controllers/accountController");
const regValidate = require('../utilities/account-validation');

// Route to build login view
router.get("/login", utilities.handleErrors(accountController.buildLogin));

// Process login attempt
router.post(
  "/login",
  [
    body("account_email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email address"),
    body("account_password")
      .trim()
      .notEmpty()
      .withMessage("Password is required")
  ],
  async (req, res) => {
    const { account_email, account_password } = req.body;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      let nav = await utilities.getNav();
      return res.render("account/login", {
        title: "Login",
        nav,
        errors,
        account_email,
        message: {
          type: 'error',
          text: 'Please check your credentials and try again.'
        }
      });
    }
    
    try {
      // Get account by email
      const account = await accountModel.getAccountByEmail(account_email);
      
      if (!account) {
        req.flash("notice", "Invalid email or password.");
        return res.redirect("/account/login");
      }
      
      // Compare hashed password
      const isMatch = await bcrypt.compare(account_password, account.account_password);
      
      if (!isMatch) {
        req.flash("notice", "Invalid email or password.");
        return res.redirect("/account/login");
      }
      
      // If we get here, login was successful
      // TODO: Set up session here
      res.redirect("/account/");
    } catch (error) {
      console.error("Login error:", error);
      req.flash("notice", "An error occurred during login. Please try again.");
      res.redirect("/account/login");
    }
  }
);

// Route to build registration view
router.get("/register", utilities.handleErrors(accountController.buildRegister));

// Process registration form submission
router.post("/register",
  regValidate.registationRules(),
  regValidate.checkRegData,
  utilities.handleErrors(accountController.registerAccount)
);

module.exports = router;
