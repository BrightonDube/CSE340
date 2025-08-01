// /models/favorite-model.js

const pool = require("../database/");

/* ***************************
 *  Add a vehicle to a user's favorites
 * ************************** */
async function addToFavorites(account_id, inv_id, notes = "") {
  try {
    // Sanitize notes (remove HTML tags)
    if (typeof notes !== 'string') notes = '';
    // Remove any HTML tags (simple regex)
    notes = notes.replace(/<[^>]*>/g, '');
    if (notes.length > 1000) notes = notes.slice(0, 1000);
    const sql = `
      INSERT INTO public.favorites (account_id, inv_id, notes)
      VALUES ($1, $2, $3)
      RETURNING *`;
    const result = await pool.query(sql, [account_id, inv_id, notes]);
    return result.rows[0];
  } catch (error) {
    // Unique constraint violation (duplicate favorite)
    if (error.code === '23505') { 
        return { error: "This vehicle is already in your favorites." };
    }
    console.error("addToFavorites error: " + error);
    return { error: error.message };
  }
}

/* ***************************
 *  Remove a vehicle from a user's favorites
 * ************************** */
async function removeFavorite(account_id, inv_id) {
  try {
    const sql = `
      DELETE FROM public.favorites
      WHERE account_id = $1 AND inv_id = $2`;
    const result = await pool.query(sql, [account_id, inv_id]);
    return result.rowCount; // Returns 1 if successful, 0 if not found
  } catch (error) {
    console.error("removeFavorite error: " + error);
    return { error: error.message };
  }
}

/* ***************************
 *  Get all favorite vehicles for a specific account
 * ************************** */
async function getFavoritesByAccount(account_id) {
  try {
    // Join with inventory to get vehicle details
    const sql = `
      SELECT i.*, f.date_added, f.notes
      FROM public.favorites AS f
      JOIN public.inventory AS i ON f.inv_id = i.inv_id
      WHERE f.account_id = $1
      ORDER BY f.date_added DESC`;
    const result = await pool.query(sql, [account_id]);
    return result.rows;
  } catch (error) {
    console.error("getFavoritesByAccount error: " + error);
    return { error: error.message };
  }
}

/* ***************************
 *  Check if a specific vehicle is in a user's favorites
 * ************************** */
async function checkIfFavorite(account_id, inv_id) {
  try {
    const sql = `
      SELECT 1 FROM public.favorites
      WHERE account_id = $1 AND inv_id = $2`;
    const result = await pool.query(sql, [account_id, inv_id]);
    return result.rowCount > 0; // Returns true if a favorite exists, false otherwise
  } catch (error) {
    console.error("checkIfFavorite error: " + error);
    return false; // Assume not a favorite if an error occurs
  }
}

async function updateFavoriteNotes(account_id, inv_id, notes) {
  try {
    if (typeof notes !== 'string') notes = '';
    if (notes.length > 1000) notes = notes.slice(0, 1000);
    const sql = `
      UPDATE public.favorites SET notes = $3
      WHERE account_id = $1 AND inv_id = $2
      RETURNING *`;
    const result = await pool.query(sql, [account_id, inv_id, notes]);
    if (result.rowCount === 0) {
      return { error: "Favorite not found." };
    }
    return result.rows[0];
  } catch (error) {
    console.error("updateFavoriteNotes error: " + error);
    return { error: error.message };
  }
}

module.exports = {
  addToFavorites,
  removeFavorite,
  getFavoritesByAccount,
  checkIfFavorite,
  updateFavoriteNotes,
};
