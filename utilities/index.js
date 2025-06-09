const invModel = require("../models/inventory-model")
const jwt = require("jsonwebtoken")
require("dotenv").config()
const Util = {}

/* ************************
 * Constructs the nav HTML unordered list
 ************************** */
Util.getNav = async function (req, res, next) {
  let data = await invModel.getClassifications()
  let list = "<ul>"
  list += '<li><a href="/" title="Home page">Home</a></li>'
  data.rows.forEach((row) => {
    list += "<li>"
    list +=
      '<a href="/inv/type/' +
      row.classification_id +
      '" title="See our inventory of ' +
      row.classification_name +
      ' vehicles">' +
      row.classification_name +
      "</a>"
    list += "</li>"
  })
  list += "</ul>"
  return list
}

/* **************************************
* Build the classification view HTML
* ************************************ */
Util.buildClassificationGrid = async function(data){
  let grid = '';
  if(data.length > 0){
    grid = '<ul id="inv-display">'
    data.forEach(vehicle => { 
      grid += '<li>'
      grid +=  '<a href="../../inv/detail/'+ vehicle.inv_id 
      + '" title="View ' + vehicle.inv_make + ' '+ vehicle.inv_model 
      + 'details"><img src="' + vehicle.inv_thumbnail 
      +'" alt="Image of '+ vehicle.inv_make + ' ' + vehicle.inv_model 
      +' on CSE Motors" /></a>'
      grid += '<div class="namePrice">'
      grid += '<hr />'
      grid += '<h2>'
      grid += '<a href="../../inv/detail/' + vehicle.inv_id +'" title="View ' 
      + vehicle.inv_make + ' ' + vehicle.inv_model + ' details">' 
      + vehicle.inv_make + ' ' + vehicle.inv_model + '</a>'
      grid += '</h2>'
      grid += '<span>$' 
      + new Intl.NumberFormat('en-US').format(vehicle.inv_price) + '</span>'
      grid += '</div>'
      grid += '</li>'
    })
    grid += '</ul>'
  } else { 
    grid += '<p class="notice">Sorry, no matching vehicles could be found.</p>'
  }
  return grid
}

/* **************************************
 * Build vehicle detail view HTML
 * ************************************ */
Util.buildVehicleDetail = function (data) {
  let grid = '<div class="detail-container">';
  grid += '<div class="detail-image">';
  grid += '<img src="' + data.inv_image + '" alt="Image of ' + data.inv_make + ' ' + data.inv_model + '">';
  grid += '</div>';
  grid += '<div class="detail-info">';
  grid += '<h2>' + data.inv_make + ' ' + data.inv_model + ' (' + data.inv_year + ')</h2>';
  grid += '<p class="detail-price">$' + new Intl.NumberFormat('en-US').format(data.inv_price) + '</p>';
  grid += '<ul class="detail-specs">';
  grid += '<li><strong>Mileage:</strong> ' + new Intl.NumberFormat('en-US').format(data.inv_miles) + ' miles</li>';
  grid += '<li><strong>Classification:</strong> ' + data.classification_name + '</li>';
  grid += '<li><strong>Description:</strong> ' + data.inv_description + '</li>';
  grid += '</ul>';
  grid += '</div></div>';
  return grid;
};

/* ****************************************
 * Middleware For Handling Errors
 * Wrap other function in this for 
 * General Error Handling
 **************************************** */
Util.handleErrors = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

/* **************************************
 * Build Classification List for Form Dropdown
* ************************************ */
Util.buildClassificationList = async function() {
  const data = await invModel.getClassifications();
  let classificationList = '<select name="classification_id" id="classification_id" class="form-select" required>';
  classificationList += '<option value="">Choose a Classification</option>';
  data.rows.forEach(row => {
    classificationList += `<option value="${row.classification_id}">${row.classification_name}</option>`;
  });
  classificationList += '</select>';
  return classificationList;
};

/* ****************************************
* Middleware to check token validity
**************************************** */
Util.checkJWTToken = (req, res, next) => {
 if (req.cookies.jwt) {
  jwt.verify(
   req.cookies.jwt,
   process.env.ACCESS_TOKEN_SECRET,
   function (err, accountData) {
    if (err) {
     req.flash("Please log in")
     res.clearCookie("jwt")
     return res.redirect("/account/login")
    }
    res.locals.accountData = accountData
    res.locals.loggedin = 1
    next()
   })
 } else {
  next()
 }
}

/* ****************************************
 *  Check Login
 * ************************************ */
Util.checkLogin = (req, res, next) => {
  // Check if user is logged in via JWT or session
  if (res.locals.loggedin || (req.session && req.session.user && req.session.loggedin)) {
    next();
  } else {
    req.flash("notice", "Please log in to access this page.");
    req.session.returnTo = req.originalUrl;
    return res.redirect("/account/login");
  }
}

/* ****************************************
 * Build the favorites view HTML
 * ************************************ */
Util.buildFavoritesGrid = async function(data) {
  let grid;
  if (data.length > 0) {
    grid = '<ul id="fav-display">';
    data.forEach(vehicle => {
      grid += '<li>';
      grid += '<a href="../../inv/detail/' + vehicle.inv_id + '" title="View ' + vehicle.inv_make + ' ' + vehicle.inv_model + ' details">';
      grid += '<img src="' + vehicle.inv_thumbnail + '" alt="Image of ' + vehicle.inv_make + ' ' + vehicle.inv_model + ' on CSE Motors" />';
      grid += '</a>';
      grid += '<div class="namePrice">';
      grid += '<hr />';
      grid += '<h2>' + vehicle.inv_make + ' ' + vehicle.inv_model + '</h2>';
      grid += '<span>$' + new Intl.NumberFormat('en-US').format(vehicle.inv_price) + '</span>';
      grid += '</div>';
      if (vehicle.notes && vehicle.notes.trim().length > 0) {
        grid += '<div class="favorite-notes" style="background:#f5f5f5; border-radius:5px; padding:0.5em 1em; margin:0.5em 0; color:#333; font-size:0.97em;">';
        grid += '<strong>Notes:</strong><br>' + vehicle.notes + '</div>';
      }
      // Add a remove button for each favorite
      grid += '<button class="remove-fav-btn" data-inv-id="' + vehicle.inv_id + '">Remove</button>';
      grid += '</li>';
    });
    grid += '</ul>';
  } else {
    grid = '<p class="notice">You have no favorite vehicles yet.</p>';
  }
  return grid;
};

module.exports = Util