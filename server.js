/* ******************************************
 * This server.js file is the primary file of the
 * application. It is used to control the project.
 *******************************************/
/* ***********************
 * Require Statements
 *************************/
const express = require('express');
const env = require('dotenv').config();
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
    }),
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    name: 'sessionId',
  })
);

// Express Messages Middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

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
app.get('/', utilities.handleErrors(baseController.buildHome));
// Inventory routes
app.use('/inv', inventoryRoute);

// Account routes
app.use('/account', accountRoute);

// File Not Found Route - must be last route in list
app.use(async (req, res, next) => {
  next({ status: 404, message: 'Sorry, we appear to have lost that page.' });
});
/* ***********************
 * Express Error Handler
 * Place after all other middleware
 *************************/
app.use(async (err, req, res, next) => {
  try {
    const nav = await utilities.getNav();
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    
    // Log the error
    console.error(`Error ${status} at: "${req.originalUrl}": ${message}`);
    console.error(err.stack);
    
    // Set the response status
    res.status(status);
    
    // Determine the error title and message
    const title = `${status} - ${status === 404 ? 'Not Found' : 'Server Error'}`;
    const errorMessage = status === 404 
      ? `Sorry, the page you're looking for doesn't exist.`
      : 'Sorry, there was an error processing your request. Please try again later.';
    
    // Render the error page
    res.render('errors/error', {
      status,
      title,
      message: errorMessage,
      nav,
    });
  } catch (renderError) {
    console.error('Error rendering error page:', renderError);
    res.status(500).send('An error occurred while rendering the error page.');
  }
});

/* ***********************
 * Local Server Information
 * Values from .env (environment) file
 *************************/
const port = process.env.PORT;
const host = process.env.HOST;

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
  console.log(`app listening on ${host}:${port}`);
});
