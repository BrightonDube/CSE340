const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")

const invCont = {}

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async function (req, res, next) {
  const classification_id = req.params.classificationId
  const data = await invModel.getInventoryByClassificationId(classification_id)
  const grid = await utilities.buildClassificationGrid(data)
  let nav = await utilities.getNav()
  const className = data[0].classification_name
  res.render("./inventory/classification", {
    title: className + " vehicles",
    nav,
    grid,
  })
}

// ***************************
// Build inventory detail view
// ***************************
invCont.buildByInventoryId = async function (req, res, next) {
  const invId = req.params.inv_id;
  const data = await invModel.getInventoryById(invId);
  const detail = utilities.buildVehicleDetail(data);
  const nav = await utilities.getNav();
  res.render("./inventory/detail", {
    title: `${data.inv_make} ${data.inv_model}`,
    nav,
    detail,
  });
};

// Intentional Error for 500 test
invCont.throwError = function (req, res, next) {
  next(new Error('Intentional 500 error triggered'));
};

module.exports = invCont
