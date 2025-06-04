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
const utilities = require('./utilities');
const inventoryRoute = require('./routes/inventoryRoute');
const accountRoute = require('./routes/accountRoute');
const session = require('express-session');
const pool = require('./database/');
const { notFound, errorHandler, validationErrorHandler, databaseErrorHandler } = require('./utilities/error-handler');
const cookieParser = require("cookie-parser")

/* ***********************
 * Middleware
 * ************************/
// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(
  session({
    store: new (require('connect-pg-simple')(session))({
      createTableIfMissing: true,
      pool,
      tableName: 'session'
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

// Cookie parser middleware
app.use(cookieParser());

// Express Messages Middleware
const flash = require('connect-flash');
app.use(flash());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// Set up static directory
// Make session data available to all templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Set up views directory
app.set('views', path.join(__dirname, 'views'));

/* ***********************
 * View Engine and Templates
 *************************/
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', './layouts/layout'); // not at views root

/* ***********************
 * Routes
 *************************/
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
