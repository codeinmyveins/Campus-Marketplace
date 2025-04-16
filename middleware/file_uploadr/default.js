const { StatusCodes } = require("http-status-codes");
const CustomAPIError = require("../../errors/custom-api");

function fileImgFilter (req, file, cb) {
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

module.exports = { fileImgFilter, destination };
