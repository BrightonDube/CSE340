const pool = require("../database/")

/* ***************************
 *  Get all classification data
 * ************************** */
async function getClassifications(){
  return await pool.query("SELECT * FROM public.classification ORDER BY classification_name")
}

/* ***************************
 *  Get all inventory items and classification_name by classification_id
 * ************************** */
async function getInventoryByClassificationId(classification_id) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory AS i 
      JOIN public.classification AS c 
      ON i.classification_id = c.classification_id 
      WHERE i.classification_id = $1`,
      [classification_id]
    )
    return data.rows
  } catch (error) {
    console.error("getclassificationsbyid error " + error)
    return error.message
  }
}

/* ***************************
 * Get inventory by model (case-insensitive search)
 * ************************** */
async function getInventoryByModel(model) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory 
      WHERE LOWER(inv_model) = LOWER($1)`,
      [model]
    )
    return data
  } catch (error) {
    console.error("getInventoryByModel error " + error)
    return error.message
  }
}

/* ***************************
 *  Get a single inventory item by inv_id
 * ************************** */
async function getInventoryById(inv_id) {
  try {
    const data = await pool.query(
      `SELECT i.*, c.classification_name
       FROM public.inventory AS i
       JOIN public.classification AS c
         ON i.classification_id = c.classification_id
       WHERE i.inv_id = $1`,
      [inv_id]
    );
    return data.rows;
  } catch (error) {
    console.error("getInventoryById error " + error);
    return [];
  }
}

/* ***************************
 *  Add new classification to database
 * ************************** */
async function addClassification(classification_name) {
  try {
    const sql = "INSERT INTO classification (classification_name) VALUES ($1) RETURNING *";
    const result = await pool.query(sql, [classification_name]);
    return result.rows[0];
  } catch (error) {
    console.error("Error adding classification:", error);
    return null;
  }
}

/* ***************************
 *  Add new inventory to database
 * ************************** */
async function addInventory({
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
}) {
  try {
    const sql = `
      INSERT INTO inventory (
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`;
      
    const result = await pool.query(sql, [
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
    ]);
    
    return result.rows[0];
  } catch (error) {
    console.error("Error adding inventory:", error);
    return null;
  }
}

/* ***************************
 *  Update an existing inventory item
 * ************************** */
async function updateInventory({
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
}) {
  try {
    const sql = `
      UPDATE public.inventory 
      SET 
        inv_make = $1,
        inv_model = $2,
        inv_year = $3,
        inv_description = $4,
        inv_image = $5,
        inv_thumbnail = $6,
        inv_price = $7,
        inv_miles = $8,
        inv_color = $9,
        classification_id = $10
      WHERE inv_id = $11 
      RETURNING *`;

    const data = await pool.query(sql, [
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_miles,
      inv_color,
      classification_id,
      inv_id
    ]);

    return data.rows[0];
  } catch (error) {
    console.error("updateInventory error " + error);
    return error.message;
  }
}

/* ***************************
 *  Delete an inventory item
 * ************************** */
async function deleteInventory(inv_id) {
  try {
    const sql = 'DELETE FROM public.inventory WHERE inv_id = $1 RETURNING *';
    const data = await pool.query(sql, [inv_id]);
    return data.rowCount > 0; // Return true if a row was deleted
  } catch (error) {
    console.error("deleteInventory error " + error);
    return false;
  }
}

module.exports = {
  getClassifications, 
  getInventoryByClassificationId, 
  getInventoryByModel,
  getInventoryById,
  addClassification,
  addInventory,
  updateInventory,
  deleteInventory
}