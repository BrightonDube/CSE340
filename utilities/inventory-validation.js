const { body, validationResult } = require('express-validator');

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

module.exports = validate;
