const multer = require("multer");
const { StatusCodes } = require("http-status-codes");
const CustomAPIError = require("../../errors/custom-api");
const fs = require("fs");
const path = require('path');
const { destination, fileImgFilter } = require("./default");

const avatarDir = path.join(__dirname, "../../uploads/avatar");
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir);

const userAvatarUpload = multer({
    storage: multer.diskStorage({
        destination,
        filename: function (req, file, cb) {
            cb(null, Date.now() + "@" + req.user.userId);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileImgFilter
});

module.exports = userAvatarUpload;
