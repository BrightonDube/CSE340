/* ****************************************
 * Inventory Controller
 * **************************************** */
const utilities = require("../utilities/");
const invModel = require("../models/inventory-model");

/* ***************************
 * Build inventory by classification view
 * ************************** */
async function buildByClassificationId(req, res, next) {
  const classification_id = req.params.classificationId;
  const data = await invModel.getInventoryByClassificationId(classification_id);
  const grid = await utilities.buildClassificationGrid(data);
  let nav = await utilities.getNav();
  const className = data[0].classification_name;
  res.render("./inventory/classification", {
    title: className + " vehicles",
    nav,
    grid,
  });
}

/* ***************************
 * Build inventory detail view
 * ************************** */
async function buildByInventoryId(req, res, next) {
  const inv_id = req.params.inventoryId;
  const data = await invModel.getInventoryById(inv_id);
  const grid = await utilities.buildInventoryDetail(data);
  let nav = await utilities.getNav();
  const name = data[0].inv_make + " " + data[0].inv_model;
  res.render("./inventory/detail", {
    title: name,
    nav,
    grid,
  });
}

/* ***************************
 * Build management view
 * ************************** */
async function buildManagementView(req, res, next) {
  let nav = await utilities.getNav();
  res.render("./inventory/management", {
    title: "Inventory Management",
    nav,
    message: req.flash('notice'),
  });
}

/* ***************************
 * Build add classification view
 * ************************** */
async function buildAddClassification(req, res, next) {
  let nav = await utilities.getNav();
  res.render("./inventory/add-classification", {
    title: "Add New Classification",
    nav,
    errors: null,
    classification_name: '',
    message: req.flash('notice')
  });
}

/* ***************************
 * Add new classification
 * ************************** */
async function addClassification(req, res) {
  let nav = await utilities.getNav();
  const { classification_name } = req.body;
  
  try {
    const result = await invModel.addClassification(classification_name);
    if (result) {
      req.flash("notice", `Successfully added ${classification_name} classification.`);
      res.redirect("/inv");
    } else {
      req.flash("notice", "Sorry, the classification could not be added.");
      res.status(500).render("inventory/add-classification", {
        title: "Add New Classification",
        nav,
        errors: null,
        classification_name,
        message: { type: 'danger', text: 'Sorry, the classification could not be added.' }
      });
    }
  } catch (error) {
    console.error("Error adding classification:", error);
    req.flash("notice", "Sorry, there was an error adding the classification.");
    res.status(500).render("inventory/add-classification", {
      title: "Add New Classification",
      nav,
      errors: null,
      classification_name,
      message: { type: 'danger', text: 'Sorry, there was an error adding the classification.' }
    });
  }
}

module.exports = { 
  buildByClassificationId, 
  buildByInventoryId, 
  buildManagementView, 
  buildAddClassification,
  addClassification 
};
