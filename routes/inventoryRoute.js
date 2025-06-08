// Needed Resources 
const express = require("express");
const router = new express.Router();
const invController = require("../controllers/invController");
const Util = require("../utilities/");
const validate = require('../utilities/inventory-validation');
const { isAuthenticated, hasAdminOrEmployeeRole, checkJWTToken } = require('../middleware/auth');

// Route to build inventory by classification view
router.get("/type/:classificationId", Util.handleErrors(invController.buildByClassificationId));

// Route to build inventory detail view
router.get("/detail/:inv_id", Util.handleErrors(invController.buildByInventoryId));

// Route to build management view
router.get("/", 
  hasAdminOrEmployeeRole,
  Util.handleErrors(invController.buildManagementView)
);

// Route to build add classification view
router.get("/add-classification", 
  hasAdminOrEmployeeRole,
  Util.handleErrors(invController.buildAddClassification)
);

// Process add classification
router.post("/add-classification",
  hasAdminOrEmployeeRole,
  validate.classificationRules(),
  validate.checkClassificationData,
  Util.handleErrors(invController.addClassification)
);

// Route to build add inventory view
router.get("/add-inventory", 
  hasAdminOrEmployeeRole,
  Util.handleErrors(invController.buildAddInventory)
);

// Process add inventory
router.post("/add-inventory",
  hasAdminOrEmployeeRole,
  validate.inventoryRules(),
  validate.checkInventoryData,
  Util.handleErrors(invController.addInventory)
);

// Intentional error route for testing error handler
router.get("/error500", Util.handleErrors(invController.throwError));

// Route to get inventory by classification as JSON
router.get("/getInventory/classification_id/:classification_id", 
  Util.handleErrors(invController.getInventoryJSON)
);

// Route to build edit inventory view - handles both /edit/16 and /edit/inv_id/16
router.get(["/edit/:inv_id", "/edit/inv_id/:inv_id"],
  hasAdminOrEmployeeRole,
  Util.handleErrors(invController.buildEditInventory)
);

// Route to process update inventory
router.post("/update/",
  hasAdminOrEmployeeRole,
  validate.updateRules(),
  validate.checkUpdateData,
  Util.handleErrors(invController.updateInventory)
);

// Route to build delete confirmation view
router.get("/delete/:inv_id",
  hasAdminOrEmployeeRole,
  Util.handleErrors(invController.buildDeleteInventory)
);

// Route to process inventory deletion
router.post("/delete/",
  hasAdminOrEmployeeRole,
  Util.handleErrors(invController.deleteInventory)
);

// Test route for JWT authentication
router.get('/test-jwt', 
  checkJWTToken,
  (req, res) => {
    res.json({ 
      message: 'JWT authentication successful!',
      user: req.user
    });
  }
);

module.exports = router;
