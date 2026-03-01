const multer = require("multer");
const CustomAPIError = require("../../errors/custom-api");
const { StatusCodes } = require("http-status-codes");

const itemImageUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 5
    },
    fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/webp"];
        if (!allowed.includes(file.mimetype)) {
            return cb(new CustomAPIError("Only JPEG, PNG, WEBP allowed", StatusCodes.BAD_REQUEST));
        }
        cb(null, true);
    }
});

module.exports = itemImageUpload;
