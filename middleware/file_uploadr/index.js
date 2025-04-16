const fs = require("fs");
const path = require("path");

const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const userAvatarUpload = require("./user-avatar");
const itemImageUpload = require("./item-image");

module.exports = { userAvatarUpload, itemImageUpload };
