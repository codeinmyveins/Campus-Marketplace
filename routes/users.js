const express = require("express");

//middleware
const { auth } = require("../middleware/authentication");
//controller
const { getUser, getCurrentUser, editUser } = require("../controllers/users");

const router = express.Router();

router.route("/").get(auth, getCurrentUser).patch(auth, editUser); //auth get current user
router.route("/:username").get(getUser); // get a user

module.exports = router;