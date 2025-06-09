// Needed Resources 
const express = require("express");
const router = new express.Router();
const favController = require("../controllers/favoriteController");
const Util = require("../utilities/");

// Route to view the "My Favorites" page (protected)
router.get(
  "/", 
  Util.checkLogin, 
  Util.handleErrors(favController.buildFavoritesView)
);

// Route to handle adding a favorite via fetch POST request
router.post(
  "/add", 
  Util.checkLogin,
  Util.handleErrors(favController.addFavorite)
);

// Route to handle removing a favorite via fetch POST request
router.post(
  "/remove",
  Util.checkLogin,
  Util.handleErrors(favController.removeFavorite)
);

// Route to handle updating notes for a favorite
router.post(
  "/update-notes",
  Util.checkLogin,
  Util.handleErrors(favController.updateFavoriteNotes)
);

module.exports = router;
