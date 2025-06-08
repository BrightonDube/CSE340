/* **************************************
 * Database Connection
 *************************************** */
const pool = require("../database/");

/* *****************************
*   Register new account
* *************************** */
async function registerAccount(account_firstname, account_lastname, account_email, account_password) {
  try {
    const sql = "INSERT INTO account (account_firstname, account_lastname, account_email, account_password, account_type) VALUES ($1, $2, $3, $4, 'Employee') RETURNING *"
    const result = await pool.query(sql, [account_firstname, account_lastname, account_email, account_password])
    return result.rows[0]
  } catch (error) {
    console.error('Error in registerAccount:', error)
    throw error
  }
}

/* **********************
 *   Check for existing email
 * ********************* */
async function checkExistingEmail(account_email) {
  try {
    const sql = "SELECT * FROM account WHERE account_email = $1"
    const email = await pool.query(sql, [account_email])
    return email.rowCount
  } catch (error) {
    return error.message
  }
}

/* *****************************
* Return account data using email address
* ***************************** */
async function getAccountByEmail(account_email) {
  try {
    const result = await pool.query(
      'SELECT account_id, account_firstname, account_lastname, account_email, account_type, account_password FROM account WHERE account_email = $1',
      [account_email])
    return result.rows[0]
  } catch (error) {
    return new Error("No matching email found")
  }
}

/* **********************
 * Get account by ID
 * ********************* */
async function getAccountById(account_id) {
  try {
    const sql = "SELECT * FROM account WHERE account_id = $1";
    const result = await pool.query(sql, [account_id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error in getAccountById:", error);
    return null;
  }
}

/* **********************
 * Update account information
 * ********************* */
async function updateAccount(account_id, updates) {
  try {
    if (!updates || Object.keys(updates).length === 0) {
      // Nothing to update
      return null;
    }
    // Build SET clause dynamically
    const setClauses = [];
    const values = [];
    let idx = 1;
    for (const [field, value] of Object.entries(updates)) {
      setClauses.push(`${field} = $${idx}`);
      values.push(value);
      idx++;
    }
    const sql = `UPDATE account SET ${setClauses.join(", ")} WHERE account_id = $${idx} RETURNING *`;
    values.push(account_id);
    const result = await pool.query(sql, values);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error in updateAccount:", error);
    throw error;
  }
}

/* **********************
 * Update account password
 * ********************* */
async function updatePassword(account_id, hashedPassword) {
  try {
    const sql = `
      UPDATE account 
      SET account_password = $1
      WHERE account_id = $2 
      RETURNING account_id`;
    
    const result = await pool.query(sql, [hashedPassword, account_id]);
    return result.rowCount > 0;
  } catch (error) {
    console.error("Error in updatePassword:", error);
    throw error;
  }
}

module.exports = { 
  registerAccount, 
  checkExistingEmail, 
  getAccountByEmail,
  getAccountById,
  updateAccount, // now (account_id, updates)
  updatePassword
}
