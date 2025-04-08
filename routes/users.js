const express = require("express");

//middleware
const { auth } = require("../middleware/authentication");
//controller
const { getUser, getCurrentUser } = require("../controllers/users");

const router = express.Router();

router.route("/").get(auth, getCurrentUser).patch(); //auth get current user
router.route("/:username").get(getUser); // get a user

module.exports = router;