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
    const { inv_id } = req.body;
    const account_id = res.locals.accountData.account_id;
    const addResult = await favoriteModel.addToFavorites(account_id, inv_id);

    if (addResult && !addResult.error) {
      // fetch expects JSON response
      return res.json({ success: true, message: "Vehicle added to favorites!" });
    } else {
      return res.status(400).json({ success: false, message: addResult.error || "Error adding favorite." });
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
