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
  try {
    const inv_id = req.params.inv_id;
    const data = await invModel.getInventoryById(inv_id);
    
    // Check if data exists and has at least one item
    if (!data || !data.length) {
      req.flash('notice', 'Sorry, that inventory item does not exist.');
      return res.redirect('/inv');
    }
    
    // If we get here, we have data
    const grid = utilities.buildVehicleDetail(data[0]);
    let nav = await utilities.getNav();
    const name = data[0].inv_make + " " + data[0].inv_model;
    
    res.render("./inventory/detail", {
      title: name,
      nav,
      grid,
      message: req.flash('notice')
    });
  } catch (error) {
    console.error('Error in buildByInventoryId:', error);
    error.status = 500;
    error.message = 'Error building inventory detail view';
    next(error);
  }
}

/* ***************************
 * Build management view
 * ************************** */
async function buildManagementView(req, res, next) {
  try {
    let nav = await utilities.getNav();
    res.render("./inventory/management", {
      title: "Vehicle Management",
      nav,
      message: req.flash('notice'),
      errors: null,
      classification_name: ''
    });
  } catch (error) {
    error.status = 500;
    error.message = 'Error building management view';
    next(error);
  }
}

/* ***************************
 * Build add classification view
 * ************************** */
async function buildAddClassification(req, res, next) {
  try {
    let nav = await utilities.getNav();
    res.render("./inventory/add-classification", {
      title: "Add New Classification",
      nav,
      errors: null,
      classification_name: '',
      message: req.flash('notice')
    });
  } catch (error) {
    error.status = 500;
    error.message = 'Error building add classification view';
    next(error);
  }
}

/* ***************************
 * Add new classification
 * ************************** */
async function addClassification(req, res, next) {
  const { classification_name } = req.body;
  
  try {
    // Check if classification already exists
    const classifications = await invModel.getClassifications();
    const exists = classifications.rows.some(
      (c) => c.classification_name.toLowerCase() === classification_name.toLowerCase()
    );
    
    if (exists) {
      req.flash('notice', `Classification "${classification_name}" already exists.`);
      return res.redirect('/inv/add-classification');
    }
    
    const result = await invModel.addClassification(classification_name);
    
    if (result) {
      req.flash('notice', `Successfully added "${classification_name}" classification.`);
      res.redirect('/inv');
    } else {
      req.flash('notice', 'Sorry, the classification could not be added.');
      res.redirect('/inv/add-classification');
    }
  } catch (error) {
    error.status = 500;
    error.message = 'Error adding classification';
    next(error);
  }
}

/* ***************************
 * Build add inventory view
 * ************************** */
async function buildAddInventory(req, res, next) {
  try {
    let nav = await utilities.getNav();
    const classificationList = await utilities.buildClassificationList();
    
    res.render("./inventory/add-inventory", {
      title: "Add New Vehicle",
      nav,
      classificationList,
      errors: null,
      classification_id: '',
      inv_make: '',
      inv_model: '',
      inv_year: new Date().getFullYear(),
      inv_description: '',
      inv_image: '/images/vehicles/no-image.png',
      inv_thumbnail: '/images/vehicles/no-image-tn.png',
      inv_price: '',
      inv_miles: '',
      inv_color: '',
      message: req.flash('notice')
    });
  } catch (error) {
    error.status = 500;
    error.message = 'Error building add inventory view';
    next(error);
  }
}

/* ***************************
 * Add new inventory
 * ************************** */
async function addInventory(req, res, next) {
  const {
    classification_id,
    inv_make,
    inv_model,
    inv_year,
    inv_description,
    inv_image,
    inv_thumbnail,
    inv_price,
    inv_miles,
    inv_color
  } = req.body;
  
  try {
    // Check if vehicle already exists
    const inventory = await invModel.getInventoryByModel(inv_model);
    const exists = inventory.rows.some(
      (item) => 
        item.inv_make.toLowerCase() === inv_make.toLowerCase() &&
        item.inv_model.toLowerCase() === inv_model.toLowerCase() &&
        item.inv_year === parseInt(inv_year)
    );
    
    if (exists) {
      req.flash('notice', `A ${inv_year} ${inv_make} ${inv_model} already exists in inventory.`);
      return res.redirect('/inv/add-inventory');
    }
    
    const result = await invModel.addInventory({
      classification_id: parseInt(classification_id),
      inv_make,
      inv_model,
      inv_year: parseInt(inv_year),
      inv_description,
      inv_image: inv_image || '/images/vehicles/no-image.png',
      inv_thumbnail: inv_thumbnail || '/images/vehicles/no-image-tn.png',
      inv_price: parseFloat(inv_price),
      inv_miles: parseInt(inv_miles),
      inv_color
    });
    
    if (result) {
      req.flash('notice', `Successfully added ${inv_year} ${inv_make} ${inv_model} to inventory.`);
      res.redirect('/inv');
    } else {
      req.flash('notice', 'Sorry, the vehicle could not be added to inventory.');
      res.redirect('/inv/add-inventory');
    }
  } catch (error) {
    error.status = 500;
    error.message = 'Error adding inventory item';
    next(error);
  }
}

module.exports = { 
  buildByClassificationId, 
  buildByInventoryId, 
  buildManagementView, 
  buildAddClassification,
  addClassification,
  buildAddInventory,
  addInventory
};
