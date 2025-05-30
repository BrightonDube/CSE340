/* ****************************************
 * Inventory Controller
 * **************************************** */
const utilities = require("../utilities/");
const invModel = require("../models/inventory-model");
const { uploadFiles, handleUploadErrors } = require("../utilities/file-upload");

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
      inv_make: '',
      inv_model: '',
      inv_year: '',
      inv_description: '',
      inv_image: '/images/vehicles/no-image.png',
      inv_thumbnail: '/images/vehicles/no-image-tn.png',
      inv_price: '',
      inv_miles: '',
      inv_color: '',
      message: req.flash('notice')
    });
  } catch (error) {
    console.error("Error building add inventory view:", error);
    req.flash("notice", "Sorry, there was an error loading the add inventory page.");
    res.redirect("/inv");
  }
}

/* ***************************
 * Process file uploads for inventory
 * ************************** */
const processFileUploads = (req, res, next) => {
  uploadFiles(req, res, (err) => {
    if (err) {
      return handleUploadErrors(err, req, res, next);
    }
    next();
  });
};

/* ***************************
 * Add new inventory
 * ************************** */
async function addInventory(req, res) {
  let nav = await utilities.getNav();
  const classificationList = await utilities.buildClassificationList(req.body.classification_id);
  
  // Handle file uploads if files were uploaded
  let inv_image = req.body.inv_image || '/images/vehicles/no-image.png';
  let inv_thumbnail = req.body.inv_thumbnail || '/images/vehicles/no-image-tn.png';
  
  if (req.files) {
    if (req.files.inv_image && req.files.inv_image[0]) {
      // Convert path to URL path
      inv_image = '/images/vehicles/' + path.basename(req.files.inv_image[0].path);
    }
    if (req.files.inv_thumbnail && req.files.inv_thumbnail[0]) {
      // Convert path to URL path
      inv_thumbnail = '/images/vehicles/' + path.basename(req.files.inv_thumbnail[0].path);
    }
  }
  
  const {
    classification_id,
    inv_make,
    inv_model,
    inv_year,
    inv_description,
    inv_price,
    inv_miles,
    inv_color
  } = req.body;
  
  try {
    const result = await invModel.addInventory({
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
    });
    
    if (result) {
      req.flash("notice", `Successfully added ${inv_year} ${inv_make} ${inv_model} to inventory.`);
      return res.redirect("/inv");
    } else {
      req.flash("notice", "Sorry, the vehicle could not be added to inventory.");
      return res.status(500).render("inventory/add-inventory", {
        title: "Add New Vehicle",
        nav,
        classificationList,
        errors: null,
        ...req.body,
        inv_image,
        inv_thumbnail,
        message: { type: 'danger', text: 'Sorry, the vehicle could not be added to inventory.' }
      });
    }
  } catch (error) {
    console.error("Error adding inventory:", error);
    req.flash("notice", "Sorry, there was an error adding the vehicle to inventory.");
    return res.status(500).render("inventory/add-inventory", {
      title: "Add New Vehicle",
      nav,
      classificationList,
      errors: null,
      ...req.body,
      inv_image,
      inv_thumbnail,
      message: { type: 'danger', text: 'Sorry, there was an error adding the vehicle to inventory.' }
    });
  }
}

module.exports = { 
  buildByClassificationId, 
  buildByInventoryId, 
  buildManagementView, 
  buildAddClassification,
  addClassification,
  buildAddInventory,
  addInventory,
  processFileUploads,
  handleUploadErrors
};
