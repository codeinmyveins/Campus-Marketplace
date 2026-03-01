const multer = require("multer");
const CustomAPIError = require("../../errors/custom-api");
const { StatusCodes } = require("http-status-codes");

const userAvatarUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new CustomAPIError(
                "Only images are allowed (JPEG, PNG, WEBP)",
                StatusCodes.BAD_REQUEST
            ));
        }
        cb(null, true);
    }
});

module.exports = userAvatarUpload;
