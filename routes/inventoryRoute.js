// Needed Resources 
const express = require("express");
const router = new express.Router();
const invController = require("../controllers/inventoryController");
const utilities = require("../utilities");
const validate = require('../utilities/inventory-validation');
const { isAuthenticated } = require('../middleware/auth');

// Route to build inventory by classification view
router.get("/type/:classificationId", utilities.handleErrors(invController.buildByClassificationId));

// Route to build inventory detail view
router.get("/detail/:inv_id", utilities.handleErrors(invController.buildByInventoryId));

// Route to build management view
router.get("/", 
  isAuthenticated,
  utilities.handleErrors(invController.buildManagementView)
);

// Route to build add classification view
router.get("/add-classification", 
  isAuthenticated,
  utilities.handleErrors(invController.buildAddClassification)
);

// Process add classification
router.post("/add-classification",
  isAuthenticated,
  validate.classificationRules(),
  validate.checkClassificationData,
  utilities.handleErrors(invController.addClassification)
);

// Intentional error route for testing error handler
router.get("/error500", utilities.handleErrors(invController.throwError));

module.exports = router;
