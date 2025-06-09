// /controllers/favoriteController.js

const favoriteModel = require("../models/favorite-model");
const utilities = require("../utilities/");

const favCont = {};

/* ***************************
 *  Build the "My Favorites" view
 * ************************** */
favCont.buildFavoritesView = async function (req, res, next) {
  try {
    const account_id = res.locals.accountData.account_id;
    const favoritesData = await favoriteModel.getFavoritesByAccount(account_id);

    // Use a utility to build a grid of favorite vehicles
    const grid = await utilities.buildFavoritesGrid(favoritesData);

    let nav = await utilities.getNav();
    res.render("favorites/my-favorites", {
      title: "My Favorites",
      nav,
      grid,
      favoritesData,
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};

/* ***************************
 *  Handle "Add to Favorites" action (for fetch)
 * ************************** */
favCont.addFavorite = async function (req, res, next) {
  try {
    const { inv_id, notes } = req.body;
    const account_id = res.locals.accountData.account_id;
    // Server-side validation
    let errors = [];
    if (!inv_id) errors.push("Invalid vehicle id.");
    if (notes && typeof notes !== 'string') errors.push("Notes must be text.");
    if (notes && notes.length > 1000) errors.push("Notes must be less than 1000 characters.");
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }
    const addResult = await favoriteModel.addToFavorites(account_id, inv_id, notes);
    if (addResult && !addResult.error) {
      return res.json({ success: true, message: "Vehicle added to favorites!", notes: addResult.notes });
    } else {
      return res.status(400).json({ success: false, message: addResult.error || "Error adding favorite." });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// Update notes for a favorite
favCont.updateFavoriteNotes = async function (req, res, next) {
  try {
    const { inv_id, notes } = req.body;
    const account_id = res.locals.accountData.account_id;
    // Server-side validation
    let errors = [];
    if (!inv_id) errors.push("Invalid vehicle id.");
    if (typeof notes !== 'string') errors.push("Notes must be text.");
    if (notes.length > 1000) errors.push("Notes must be less than 1000 characters.");
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }
    const updateResult = await favoriteModel.updateFavoriteNotes(account_id, inv_id, notes);
    if (updateResult && !updateResult.error) {
      if (req.session) {
        req.session.messages = req.session.messages || {};
        req.session.messages.success = ["Notes saved!"];
      }
      return res.json({ success: true, message: "Notes updated!", notes: updateResult.notes });
    } else {
      return res.status(400).json({ success: false, message: updateResult.error || "Error updating notes." });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ***************************
 *  Handle "Remove from Favorites" action (for fetch)
 * ************************** */
favCont.removeFavorite = async function (req, res, next) {
  try {
    const { inv_id } = req.body;
    const account_id = res.locals.accountData.account_id;
    const removeResult = await favoriteModel.removeFavorite(account_id, inv_id);

    if (removeResult) {
      return res.json({ success: true, message: "Vehicle removed from favorites." });
    } else {
      return res.status(400).json({ success: false, message: "Error removing favorite." });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = favCont;
