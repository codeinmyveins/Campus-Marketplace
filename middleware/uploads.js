const multer = require("multer");
const { StatusCodes } = require("http-status-codes");
const CustomAPIError = require("../errors/custom-api");
const fs = require("fs");
const path = require('path');

const fileImgFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new CustomAPIError("Only images are allowed (JPEG, PNG, WEBP)", StatusCodes.BAD_REQUEST));
    }
}

function destination (req, file, cb) {
    cb(null, "./uploads/" + file.fieldname);
}


const userAvatarStorage = multer.diskStorage({
    destination,
    filename: function (req, file, cb) {
        cb(null, Date.now() + "@" + req.user.userId);
    }
});

const userAvatarUpload = multer({
    storage: userAvatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileImgFilter
});

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const avatarDir = path.join(__dirname, "../uploads/avatar");
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir);

module.exports = { userAvatarUpload };
