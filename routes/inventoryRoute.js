// Needed Resources 
const express = require("express");
const router = new express.Router();
const invController = require("../controllers/invController");
const Util = require("../utilities/");
const validate = require('../utilities/inventory-validation');
const { isAuthenticated } = require('../middleware/auth');

// Route to build inventory by classification view
router.get("/type/:classificationId", Util.handleErrors(invController.buildByClassificationId));

// Route to build inventory detail view
router.get("/detail/:inv_id", Util.handleErrors(invController.buildByInventoryId));

// Route to build management view
router.get("/", 
  isAuthenticated,
  Util.handleErrors(invController.buildManagementView)
);

// Route to build add classification view
router.get("/add-classification", 
  isAuthenticated,
  Util.handleErrors(invController.buildAddClassification)
);

// Process add classification
router.post("/add-classification",
  isAuthenticated,
  validate.classificationRules(),
  validate.checkClassificationData,
  Util.handleErrors(invController.addClassification)
);

// Route to build add inventory view
router.get("/add-inventory", 
  isAuthenticated,
  Util.handleErrors(invController.buildAddInventory)
);

// Process add inventory
router.post("/add-inventory",
  isAuthenticated,
  validate.inventoryRules(),
  validate.checkInventoryData,
  Util.handleErrors(invController.addInventory)
);

// Intentional error route for testing error handler
router.get("/error500", Util.handleErrors(invController.throwError));

module.exports = router;
