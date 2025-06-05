const { body, validationResult } = require('express-validator');
const Util = require('.');

const validate = {};

/*  **********************************
 *  Classification Data Validation Rules
 * ********************************* */
validate.classificationRules = () => {
  return [
    // classification_name is required and must contain no spaces or special characters
    body('classification_name')
      .trim()
      .notEmpty()
      .withMessage('Classification name is required.')
      .matches(/^[a-zA-Z0-9]+$/)
      .withMessage('Classification name must not contain spaces or special characters.')
      .isLength({ min: 1 })
      .withMessage('Please provide a classification name.')
  ];
};

/*  **********************************
 *  Inventory Data Validation Rules
 * ********************************* */
validate.inventoryRules = () => {
  return [
    // classification_id is required and must be a number
    body('classification_id')
      .trim()
      .notEmpty()
      .withMessage('Classification is required.')
      .isNumeric()
      .withMessage('Invalid classification.'),
      
    // inv_make is required
    body('inv_make')
      .trim()
      .notEmpty()
      .withMessage('Make is required.')
      .isLength({ min: 1 })
      .withMessage('Please provide a make.'),
      
    // inv_model is required
    body('inv_model')
      .trim()
      .notEmpty()
      .withMessage('Model is required.')
      .isLength({ min: 1 })
      .withMessage('Please provide a model.'),
      
    // inv_year is required and must be a valid year
    body('inv_year')
      .trim()
      .notEmpty()
      .withMessage('Year is required.')
      .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
      .withMessage(`Please provide a valid year between 1900 and ${new Date().getFullYear() + 1}.`),
      
    // inv_description is required
    body('inv_description')
      .trim()
      .notEmpty()
      .withMessage('Description is required.'),
      
    // inv_price is required and must be a positive number
    body('inv_price')
      .trim()
      .notEmpty()
      .withMessage('Price is required.')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number.'),
      
    // inv_miles is required and must be a positive number
    body('inv_miles')
      .trim()
      .notEmpty()
      .withMessage('Mileage is required.')
      .isInt({ min: 0 })
      .withMessage('Mileage must be a positive number.'),
      
    // inv_color is required
    body('inv_color')
      .trim()
      .notEmpty()
      .withMessage('Color is required.')
  ];
};

/* ******************************
 * Check data and return errors or continue to classification creation
 * ***************************** */
validate.checkClassificationData = async (req, res, next) => {
  const { classification_name } = req.body;
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    let nav = await utilities.getNav();
    return res.render('inventory/add-classification', {
      title: 'Add New Classification',
      nav,
      errors: errors.array(),
      classification_name,
      message: {
        type: 'danger',
        text: 'Please correct the following errors:'
      }
    });
  }
  next();
};

/* ******************************
 * Check data and return errors or continue to inventory creation
 * ***************************** */
validate.checkInventoryData = async (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    let nav = await utilities.getNav();
    const classificationList = await Util.buildClassificationList(req.body.classification_id);
    
    return res.render('inventory/add-inventory', {
      title: 'Add New Vehicle',
      nav,
      classificationList,
      errors: errors.array(),
      ...req.body,
      message: {
        type: 'danger',
        text: 'Please correct the following errors:'
      }
    });
  }
  next();
};

module.exports = validate;
