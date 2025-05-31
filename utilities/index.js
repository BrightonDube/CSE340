const invModel = require("../models/inventory-model")
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
  let detail = '<div class="detail-container">';
  detail += '<div class="detail-image">';
  detail += '<img src="' + data.inv_image + '" alt="Image of ' + data.inv_make + ' ' + data.inv_model + '">';
  detail += '</div>';
  detail += '<div class="detail-info">';
  detail += '<h2>' + data.inv_make + ' ' + data.inv_model + ' (' + data.inv_year + ')</h2>';
  detail += '<p class="detail-price">$' + new Intl.NumberFormat('en-US').format(data.inv_price) + '</p>';
  detail += '<ul class="detail-specs">';
  detail += '<li><strong>Mileage:</strong> ' + new Intl.NumberFormat('en-US').format(data.inv_miles) + ' miles</li>';
  detail += '<li><strong>Classification:</strong> ' + data.classification_name + '</li>';
  detail += '<li><strong>Description:</strong> ' + data.inv_description + '</li>';
  detail += '</ul>';
  detail += '</div></div>';
  return detail;
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

module.exports = Util