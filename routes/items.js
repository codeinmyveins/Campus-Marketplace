const express = require("express");

const { auth } = require("../middleware/authentication");
const verifyItemOwnership = require("../middleware/verify-item-ownership");
const { itemImageUpload } = require("../middleware/file_uploadr");

const {
    getItem, getItems, postItem, deleteItem, editItem,
    uploadImages, deleteImage, reorderImages
} = require("../controllers/items");

const router = express.Router();

router.route("/:id").get(getItem)
    .patch(auth, verifyItemOwnership, editItem)
    .delete(auth, verifyItemOwnership, deleteItem);
router.route("/").get(getItems).post(auth, postItem);
router.route("/:id/images").post(auth, verifyItemOwnership,
        itemImageUpload.array("item_images", 5), uploadImages);
router.route("/:id/images/:image_id").delete(auth, verifyItemOwnership, deleteImage);
router.route("/:id/images/reorder").put(auth, verifyItemOwnership, reorderImages);

module.exports = router;
