const multer = require("multer");
const { StatusCodes } = require("http-status-codes");
const CustomAPIError = require("../../errors/custom-api");
const fs = require("fs");
const path = require('path');
const pool = require('../../db/database');
const { destination, fileImgFilter } = require("./default");

const itemImgDir = path.join(__dirname, "../../uploads/item_images");
if (!fs.existsSync(itemImgDir)) fs.mkdirSync(itemImgDir);

const itemImageUpload = multer({
    storage: multer.diskStorage({
        destination,
        filename: function (req, file, cb) {
            cb(null, Date.now() + "@" + req.params.id);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: async (req, file, cb) => {

        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new CustomAPIError("Only images are allowed (JPEG, PNG, WEBP)", StatusCodes.BAD_REQUEST));
        }

        if (req.fileCount === null || req.fileCount === undefined) {
            req.fileCount = 1;
        }
        if (req.currentItemImgCount === null || req.currentItemImgCount === undefined) {
            const { rows: images } = await pool.query(
                "SELECT COUNT(*) FROM item_images WHERE item_id = $1",
                 [req.params.id]);
            req.currentItemImgCount = parseInt(images[0].count);
        }
        const maxAllowed = 5;
        if (req.currentItemImgCount + req.fileCount > maxAllowed) {
            cb(new CustomAPIError("Image Limit Reached", StatusCodes.BAD_REQUEST));
        }
        req.fileCount++;
        cb(null, true);
    }
});

module.exports = itemImageUpload;
