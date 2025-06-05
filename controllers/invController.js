/* ****************************************
 * Inventory Controller
 * **************************************** */
const utilities = require("../utilities/");
const invModel = require("../models/inventory-model");

const invCont = {};

/* ***************************
 * Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async function (req, res, next) {
  try {
    const classification_id = req.params.classificationId;
    const data = await invModel.getInventoryByClassificationId(classification_id);
    
    if (!data || data.length === 0) {
      req.flash('notice', 'No vehicles found for this classification.');
      return res.redirect('/');
    }
    
    const grid = await utilities.buildClassificationGrid(data);
    const nav = await utilities.getNav();
    const className = data[0].classification_name;
    
    res.render("./inventory/classification", {
      title: className + " vehicles",
      nav,
      grid,
    });
  } catch (error) {
    next(error);
  }
};

/* ***************************
 * Build inventory detail view
 * ***************************/
invCont.buildByInventoryId = async function (req, res, next) {
  try {
    const inv_id = req.params.inv_id;
    const data = await invModel.getInventoryById(inv_id);
    
    if (!data) {
      req.flash('notice', 'Vehicle not found.');
      return res.redirect('/inventory');
    }
    
    const detail = utilities.buildVehicleDetail(data);
    const nav = await utilities.getNav();
    
    res.render("./inventory/detail", {
      title: `${data.inv_make} ${data.inv_model}`,
      nav,
      detail,
    });
  } catch (error) {
    next(error);
  }
};

/* ***************************
 * Build management view
 * ***************************/
invCont.buildManagementView = async function (req, res, next) {
  try {
    const nav = await utilities.getNav();
    const classificationSelect = await utilities.buildClassificationList();
    
    res.render("./inventory/management", {
      title: "Vehicle Management",
      nav,
      classificationSelect,
      errors: null,
      message: req.flash('notice')
    });
  } catch (error) {
    error.status = 500;
    error.message = 'Error building management view';
    next(error);
  }
};

/* ***************************
 * Build add classification view
 * ***************************/
invCont.buildAddClassification = async function (req, res, next) {
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
};

/* ***************************
 * Add new classification
 * ***************************/
invCont.addClassification = async function (req, res, next) {
  try {
    const { classification_name } = req.body;
    
    // Insert new classification
    const result = await invModel.addClassification(classification_name);
    
    if (result) {
      req.flash('notice', `Successfully added ${classification_name} classification.`);
      res.status(201).redirect('/inventory');
    } else {
      req.flash('notice', 'Failed to add classification.');
      res.redirect('/inventory/add-classification');
    }
  } catch (error) {
    if (error.code === '23505') { // Duplicate key error
      req.flash('notice', 'Classification already exists.');
      res.redirect('/inventory/add-classification');
    } else {
      error.status = 500;
      error.message = 'Error adding classification';
      next(error);
    }
  }
};

/* ***************************
 * Build add inventory view
 * ***************************/
invCont.buildAddInventory = async function (req, res, next) {
  try {
    const nav = await utilities.getNav();
    const classificationList = await utilities.buildClassificationList();
    
    res.render("./inventory/add-inventory", {
      title: "Add New Vehicle",
      nav,
      classificationList,
      errors: null,
      inv_make: '',
      inv_model: '',
      inv_year: '',
      inv_description: '',
      inv_image: '/images/vehicles/no-image.png',
      inv_thumbnail: '/images/vehicles/no-image-tn.png',
      inv_price: '',
      inv_miles: '',
      inv_color: '',
      classification_id: ''
    });
  } catch (error) {
    error.status = 500;
    error.message = 'Error building add inventory view';
    next(error);
  }
};

/* ***************************
 * Add new inventory
 * ***************************/
invCont.addInventory = async function (req, res, next) {
  try {
    const {
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_miles,
      inv_color,
      classification_id
    } = req.body;

    // Insert new inventory
    const result = await invModel.addInventory(
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_miles,
      inv_color,
      classification_id
    );

    if (result) {
      req.flash('notice', `Successfully added ${inv_year} ${inv_make} ${inv_model}.`);
      res.status(201).redirect('/inventory');
    } else {
      req.flash('notice', 'Failed to add vehicle.');
      res.redirect('/inventory/add-inventory');
    }
  } catch (error) {
    error.status = 500;
    error.message = 'Error adding inventory';
    next(error);
  }
};

// Intentional Error for 500 test
invCont.throwError = function (req, res, next) {
  throw new Error('Intentional error for testing 500 handler');
};

module.exports = invCont;
