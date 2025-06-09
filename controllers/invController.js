/* ****************************************
 * Inventory Controller
 * **************************************** */
const utilities = require("../utilities/");
const invModel = require("../models/inventory-model");
const favoriteModel = require("../models/favorite-model");

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
    // Parse inv_id as an integer and validate it
    const inv_id = parseInt(req.params.inv_id, 10);

    if (isNaN(inv_id)) {
      req.flash('notice', 'Invalid vehicle ID.');
      return res.redirect('/inv/');
    }

    const data = await invModel.getInventoryById(inv_id);

    // Check if data is empty or not found
    if (!data || data.length === 0) {
      req.flash('notice', 'Vehicle not found.');
      return res.redirect('/inv/');
    }

    const detail = utilities.buildVehicleDetail(data[0]);
    const nav = await utilities.getNav();

    // ---- START FAVORITES LOGIC ----
    let isFavorite = false;
    if (res.locals.loggedin) {
      const account_id = res.locals.accountData.account_id;
      isFavorite = await favoriteModel.checkIfFavorite(account_id, inv_id);
    }
    // ---- END FAVORITES LOGIC ----

    res.render("./inventory/detail", {
      title: `${data[0].inv_make} ${data[0].inv_model}`,
      nav,
      detail,
      message: req.flash('notice') || '',
      inv_id,
      isFavorite
    });
  } catch (error) {
    console.error('Error in buildByInventoryId:', error);
    req.flash('notice', 'An error occurred while loading the vehicle details.');
    res.redirect('/inv/');
  }
};

/* ***************************
 * Build management view
 * ***************************/
invCont.buildManagementView = async function (req, res, next) {
  try {
    const nav = await utilities.getNav();
    const classificationSelect = await utilities.buildClassificationList();
    
    // Get the flash message
    const flashMessage = req.flash('notice');
    const message = flashMessage.length > 0 ? { text: flashMessage[0], type: 'success' } : null;
    
    res.render("./inventory/management", {
      title: "Vehicle Management",
      nav,
      classificationSelect: classificationSelect || '',
      errors: null,
      message: message
    });
  } catch (error) {
    console.error('Error in buildManagementView:', error);
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
      res.status(201).redirect('/inv/');
    } else {
      req.flash('notice', 'Failed to add classification.');
      res.redirect('/inv/add-classification');
    }
  } catch (error) {
    if (error.code === '23505') { // Duplicate key error
      req.flash('notice', 'Classification already exists.');
      res.redirect('/inv/add-classification');
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
      message: req.flash('notice') || null, // Add flash message handling
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

    console.log('Form data received:', {
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
    });

    // Insert new inventory
    const result = await invModel.addInventory({
      classification_id,
      inv_make,
      inv_model,
      inv_year: parseInt(inv_year, 10),
      inv_description,
      inv_image: inv_image || '/images/vehicles/no-image.png',
      inv_thumbnail: inv_thumbnail || '/images/vehicles/no-image-tn.png',
      inv_price: parseFloat(inv_price),
      inv_miles: parseInt(inv_miles, 10),
      inv_color
    });

    console.log('Database result:', result);

    if (result) {
      // Set success message and redirect to management view
      req.flash('notice', `Successfully added ${inv_year} ${inv_make} ${inv_model}.`);
      return res.redirect('/inv/');
    } else {
      // If there's an error, redisplay the form with the entered values
      const nav = await utilities.getNav();
      const classificationList = await utilities.buildClassificationList();
      
      return res.render("./inventory/add-inventory", {
        title: "Add New Vehicle",
        nav,
        classificationList,
        errors: null,
        message: { 
          text: 'Failed to add vehicle. Please check your input.', 
          type: 'error' 
        },
        inv_make,
        inv_model,
        inv_year,
        inv_description,
        inv_image: inv_image || '/images/vehicles/no-image.png',
        inv_thumbnail: inv_thumbnail || '/images/vehicles/no-image-tn.png',
        inv_price,
        inv_miles,
        inv_color,
        classification_id
      });
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

/* ***************************
 * Return Inventory by Classification As JSON
 * ************************** */
invCont.getInventoryJSON = async (req, res, next) => {
  const classification_id = parseInt(req.params.classification_id);
  const invData = await invModel.getInventoryByClassificationId(classification_id);
  if (invData[0]?.inv_id) {
    return res.json(invData);
  } else {
    next(new Error("No data returned"));
  }
};

/* ***************************
 * Build edit inventory view
 * ***************************/
invCont.buildEditInventory = async function (req, res, next) {
  try {
    // Get inv_id from either route parameter format
    const inv_id = parseInt(req.params.inv_id);
    
    if (isNaN(inv_id) || inv_id <= 0) {
      req.flash('notice', 'Invalid vehicle ID.');
      return res.redirect('/inv/');
    }
    
    // Get the inventory item data
    const invDataResult = await invModel.getInventoryById(inv_id);
    
    if (!invDataResult || invDataResult.length === 0) {
      req.flash('notice', 'Vehicle not found.');
      return res.redirect('/inv/');
    }
    
    const invData = invDataResult[0];
    
    // Log the data for debugging
    console.log('Inventory Data:', invData);
    
    const classificationList = await utilities.buildClassificationList(invData.classification_id);
    const nav = await utilities.getNav();
    
    // Prepare the data for the view
    const viewData = {
      title: `Edit ${invData.inv_make} ${invData.inv_model}`,
      nav,
      classificationList,
      errors: null,
      message: req.flash('notice') || '',
      styles: ['/css/forms.css'],
      ...invData  // Spread all inventory data properties
    };
    
    console.log('View Data:', viewData); // Debug log
    
    res.render("./inventory/edit-inventory", viewData);
  } catch (error) {
    error.status = 500;
    error.message = 'Error building edit inventory view';
    next(error);
  }
};

/* ***************************
 * Process inventory update
 * ***************************/
invCont.updateInventory = async function (req, res, next) {
  try {
    const {
      inv_id,
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

    const updateResult = await invModel.updateInventory({
      inv_id: parseInt(inv_id),
      inv_make,
      inv_model,
      inv_year: parseInt(inv_year),
      inv_description,
      inv_image: inv_image || '/images/vehicles/no-image.png',
      inv_thumbnail: inv_thumbnail || '/images/vehicles/no-image-tn.png',
      inv_price: parseFloat(inv_price),
      inv_miles: parseInt(inv_miles),
      inv_color,
      classification_id: parseInt(classification_id)
    });

    if (updateResult) {
      req.flash('notice', `Successfully updated ${inv_year} ${inv_make} ${inv_model}.`);
      return res.redirect('/inv/');
    } else {
      throw new Error('Failed to update inventory');
    }
  } catch (error) {
    error.status = 500;
    error.message = 'Error updating inventory';
    next(error);
  }
};

/* ***************************
 * Build delete confirmation view
 * ***************************/
invCont.buildDeleteInventory = async function (req, res, next) {
  try {
    const inv_id = parseInt(req.params.inv_id);
    const invDataResult = await invModel.getInventoryById(inv_id);
    const nav = await utilities.getNav();
    
    // Check if we got any results
    if (!invDataResult || invDataResult.length === 0) {
      req.flash('notice', 'Vehicle not found.');
      return res.redirect('/inv/');
    }
    
    // Get the first (and should be only) result
    const invData = invDataResult[0];
    
    // Prepare the data for the view
    const viewData = {
      title: `Delete ${invData.inv_make} ${invData.inv_model}`,
      nav,
      errors: null,
      message: req.flash('notice') || '',
      styles: ['/css/forms.css'],
      inv_id: invData.inv_id,
      inv_make: invData.inv_make,
      inv_model: invData.inv_model,
      inv_year: invData.inv_year,
      inv_price: invData.inv_price
    };
    
    res.render("./inventory/delete-confirm", viewData);
  } catch (error) {
    error.status = 500;
    error.message = 'Error building delete confirmation view';
    next(error);
  }
};

/* ***************************
 * Process inventory deletion
 * ***************************/
invCont.deleteInventory = async function (req, res, next) {
  try {
    const { inv_id, inv_make, inv_model, inv_year } = req.body;
    
    const deleteResult = await invModel.deleteInventory(parseInt(inv_id));
    
    if (deleteResult) {
      req.flash('notice', `Successfully deleted ${inv_year} ${inv_make} ${inv_model}.`);
      return res.redirect('/inv/');
    } else {
      throw new Error('Failed to delete inventory');
    }
  } catch (error) {
    error.status = 500;
    error.message = 'Error deleting inventory';
    next(error);
  }
};

module.exports = invCont;
