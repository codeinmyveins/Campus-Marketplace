const express = require("express");

//middleware
const { auth } = require("../middleware/authentication");
const { userAvatarUpload } = require("../middleware/file_uploadr");
//controller
const {
    getUser, getCurrentUser, editUser, putAvatarImage,
    contactUser
} = require("../controllers/users");

const router = express.Router();

router.route("/").get(auth, getCurrentUser).patch(auth, editUser);
router.route("/:username").get(getUser);
router.route("/avatar").put(auth, userAvatarUpload.single("avatar"), putAvatarImage);
router.route("/:id/contact").get(auth, contactUser)

module.exports = router;