/* ******************************************
 * This server.js file is the primary file of the
 * application. It is used to control the project.
 *******************************************/
/* ***********************
 * Require Statements
 *************************/
const express = require('express');
const env = require('dotenv').config();
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const static = require('./routes/static');
const expressLayouts = require('express-ejs-layouts');
const baseController = require('./controllers/baseController');
const Util = require('./utilities');
const inventoryRoute = require('./routes/inventoryRoute');
const accountRoute = require('./routes/accountRoute');
const session = require('express-session');
const pool = require('./database/');
const { notFound, errorHandler, validationErrorHandler, databaseErrorHandler } = require('./utilities/error-handler');
const cookieParser = require("cookie-parser");
const csrf = require('csurf');

/* ***********************
 * Middleware
 * ************************/
// Body parser middleware - must come before any route that needs to read the request body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Cookie parser middleware - must come before session and csrf
app.use(cookieParser());

// Log all incoming requests - must come after body parser
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Session middleware
app.use(
  session({
    store: new (require('connect-pg-simple')(session))({
      createTableIfMissing: true,
      pool,
      tableName: 'session',
      schemaName: 'public'
    }),
    secret: process.env.SESSION_SECRET || 'your_fallback_secret',
    resave: false,
    saveUninitialized: false,
    name: 'sessionId',
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    }
  })
);

// Simple CSRF protection
app.use(csrf({ cookie: true }));

// Make CSRF token available in all views
app.use((req, res, next) => {
  try {
    res.locals._csrf = req.csrfToken ? req.csrfToken() : '';
    next();
  } catch (err) {
    console.error('CSRF Token Error:', err);
    next();
  }
});

// Handle CSRF errors
app.use((err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  
  console.error('CSRF Token Validation Failed:', err.message);
  
  // For API requests, return JSON
  if (req.xhr || req.path.startsWith('/api/')) {
    return res.status(403).json({ 
      error: 'CSRF token validation failed'
    });
  }
  
  // For regular web requests, set flash message and redirect
  req.flash('error', 'Your session expired or the form was invalid. Please try again.');
  const redirectTo = req.get('referer') || '/account/login';
  return res.redirect(redirectTo);
});

// JWT Token Validation
app.use(Util.checkJWTToken);

// Express Messages Middleware
const flash = require('connect-flash');
app.use(flash());
app.use((req, res, next) => {
  // Make flash messages available in all views
  res.locals.messages = {
    error: req.flash('error'),
    success: req.flash('success'),
    info: req.flash('info')
  };
  
  // Make flash messages available in the template
  res.locals.getMessages = () => {
    const messages = {
      error: req.flash('error'),
      success: req.flash('success'),
      info: req.flash('info')
    };
    req.flash('error', messages.error);
    req.flash('success', messages.success);
    req.flash('info', messages.info);
    return messages;
  };
  
  // Make req available in views
  res.locals.req = req;
  next();
});

// Add common view variables (like styles) to all routes
app.use(baseController.addCommonVars);

// Log all requests for debugging - must come after body parser
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Make session and account data available to all templates
app.use((req, res, next) => {
  // Set user data from session
  res.locals.user = req.session.user || null;
  
  // Set account data for the header
  if (req.session.accountData) {
    res.locals.accountData = req.session.accountData;
  } else if (req.session.user) {
    // Fallback to user data if accountData is not set
    res.locals.accountData = {
      account_id: req.session.user.account_id,
      account_firstname: req.session.user.account_firstname,
      account_lastname: req.session.user.account_lastname,
      account_email: req.session.user.account_email,
      account_type: req.session.user.account_type
    };
  }
  
  // Set isAuthenticated flag for easy checks
  res.locals.isAuthenticated = !!(req.session.user && req.session.user.account_id);
  
  next();
});

// Set up views directory
app.set('views', path.join(__dirname, 'views'));

// Set view engine and layout
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', './layouts/layout');

/* ***********************
 * Routes
 *************************/
// Static files route
app.use(express.static(path.join(__dirname, 'public')));

// Use static route handler
app.use(static);

// Index route
app.get('/', baseController.buildHome);

// Inventory routes
app.use('/inv', inventoryRoute);

// Account routes
app.use('/account', accountRoute);

// 404 Not Found Handler
app.use(notFound);

// Database Error Handler
app.use(databaseErrorHandler);

// Validation Error Handler
app.use(validationErrorHandler);

// General Error Handler
app.use(errorHandler);

/* ***********************
 * Local Server Information
 * Values from .env (environment) file
 *************************/
const port = process.env.PORT || 3000;
const nodeEnv = process.env.NODE_ENV || 'development';
// Always use 0.0.0.0 on Render or in production to allow external connections
const isRender = process.env.RENDER === 'true' || Boolean(process.env.RENDER_EXTERNAL_URL);
const host = isRender || nodeEnv === 'production' ? '0.0.0.0' : (process.env.HOST || 'localhost');

// Set environment
app.set('env', nodeEnv);

/* ***********************
 * Log statement to confirm server operation
 *************************/
const server = app.listen(port, host, () => {
  // Display localhost in the log for better readability when binding to 0.0.0.0
  const displayHost = host === '0.0.0.0' ? 'localhost' : host;
  console.log(`Server running in ${nodeEnv} mode on http://${displayHost}:${port}`);
  console.log(`Server bound to interface: ${host}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
